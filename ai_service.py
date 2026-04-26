import os
import json
import re
from google import genai
from google.genai import types
from dotenv import load_dotenv
from models import FoodAnalysisResult
from typing import Optional

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")

# New SDK Client
client = genai.Client(api_key=GEMINI_API_KEY)

# Tool definition for structured output
# Gemini 1.5 Flash supports response_mime_type="application/json"
# We will use this to ensure the output matches our Pydantic model.

SYSTEM_PROMPT = """
Eres un Agente Ingeniero de IA y experto en nutrición operando en 2026. 
Tu objetivo es realizar una inferencia visual multimodal de alta precisión para la app 'Prime State'.

REGLAS DE INFERENCIA (Chain-of-Thought):
1. ANÁLISIS DE ESCALA: Busca referencias visuales 2D (cubiertos, manos, servilletas). Si no hay, asume un plato estándar de 25cm.
2. COMIDAS DE OLLA: Estima densidades basadas en preparaciones comunes (1.2 - 1.5 kcal/g).
3. DESGLOSE DE MACROS: Calcula proteína, carbohidratos y grasas. La suma calórica debe ser coherente (4/4/9 kcal por gramo).
4. EL JURADO PRIME: Emite un veredicto nutricional basado en densidad de micronutrientes, índice glucémico y procesamiento.
   - BUENO: Alimentos densos, naturales, alta proteína.
   - MODERADO: Comidas balanceadas pero con algún procesado o exceso de grasa.
   - MALO: Ultraprocesados, azúcares refinados, calorías vacías.

5. TONO DE LA JUSTIFICACIÓN (CRÍTICO):
   - Si el veredicto es BUENO: Sé técnico, felicitando su compromiso con el 'Prime State' y la estética.
   - Si el veredicto es MALO o no recomendado: Sé brutalmente honesto y dolorosamente creativo. Tienes la obligación de advertirle al usuario de diferentes maneras creativas que si come eso "los culitos se alejan" o "las mujeres que quiere (especialmente las rubias) se alejarán". Usa variaciones de esta frase (ej: "cada mordisco aleja a esa rubia que te gusta", "con esto esos culitos ni te van a mirar", etc) para crear un rechazo psicológico inmediato.

6. PROTOCOLO DE CONTROL DE DAÑOS (ESTRATEGIA DE MITIGACIÓN):
   - Si el veredicto es MALO o MODERADO, DEBES generar una `estrategia_mitigacion`.
   - La estrategia debe indicar límites claros basados en lo que ves en la imagen (ej: "Solo comé 2 fetas de las 4 que veo", "Comé solo la mitad y toma 2 vasos de agua", "Máximo 1 rebanada").
   - **REGLA CRÍTICA DE MITIGACIÓN**: Siempre que sugieras una cantidad en unidades (fetas, vasos, rebanadas), DEBES especificar a cuántos GRAMOS o MILILITROS equivale esa cantidad sugerida para que el usuario pueda ingresarlo exactamente en la app (ej: "Come solo 3 fetas (aprox 45g)" o "Solo 2 vasos (aprox 400ml)").

7. DETECCIÓN DE ENVASES:
   - Identifica si el alimento es un producto procesado con un empaque visible (lata, bolsa, caja, botella) o si es una unidad comercial clara (un alfajor, una rebanada de pan, una hamburguesa de cadena).
   - En estos casos, marca `is_packaged = True` y define el `unit_name`.
   - IMPORTANTE: Si es un paquete, estima las calorías y macros siempre para **UNA (1) unidad** (un paquete, una lata, etc). El usuario ajustará la cantidad después.
"""

class VisionInferenceService:
    def __init__(self):
        # Using verified 2026 brain list
        self.model_ids = [
            "gemini-2.5-flash", 
            "gemini-2.0-flash-lite", 
            "gemini-2.0-flash", 
            "gemini-flash-lite-latest"
        ]

    async def analyze_food_image(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> FoodAnalysisResult:
        last_err = None
        for model_id in self.model_ids:
            try:
                response = await client.aio.models.generate_content(
                    model=model_id,
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                        "Realiza el análisis nutricional detallado de este plato."
                    ],
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        response_mime_type="application/json",
                        response_schema=FoodAnalysisResult,
                    )
                )
                
                if not response.text:
                    continue
                    
                analysis_dict = json.loads(response.text)
                return FoodAnalysisResult(**analysis_dict)
                
            except Exception as e:
                last_err = e
                err_msg = str(e)
                print(f"[CEREBRO-FAIL] Vision Model {model_id} failed: {err_msg}")
                # Try next model on any error
                continue
        
        # Final Error handling
        err_msg = str(last_err)
        if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
            raise HTTPException(status_code=429, detail="El cerebro visual está saturado por hoy. Intenta en unos minutos.")
        raise HTTPException(status_code=500, detail=f"Error en el análisis visual: {err_msg}")

    async def refine_food_context(self, food_name: str, current_calories: int, current_macros: dict, context: str) -> 'RefinedMacrosResult':
        from models import RefinedMacrosResult
        
        prompt = f"""
        El usuario registró originalmente "{food_name}" asumiendo una porción estándar o la totalidad de lo visto en la imagen.
        Se estimaron: {current_calories} calorías, Proteínas: {current_macros.get('protein', 0)}g, Carbohidratos: {current_macros.get('carbs', 0)}g, Grasas: {current_macros.get('fat', 0)}g.
        
        Ahora, el usuario proporciona este nuevo contexto sobre lo que REALMENTE consumió:
        "{context}"
        
        Tu trabajo es recalcular las calorías y macros finales basándote en esta corrección.
        Si dice "me comí la mitad", divide todo por 2.
        Si dice "le saqué el pan", resta los carbohidratos correspondientes al pan, etc.
        Si dice "me comí todo", devuelve los valores originales.
        """
        
        last_err = None
        for model_id in self.model_ids:
            try:
                response = await client.aio.models.generate_content(
                    model=model_id,
                    contents=[prompt],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=RefinedMacrosResult,
                    )
                )
                
                if not response.text:
                    continue
                    
                analysis_dict = json.loads(response.text)
                return RefinedMacrosResult(**analysis_dict)
                
            except Exception as e:
                last_err = e
                continue
                
        raise HTTPException(status_code=500, detail=f"Error en el refinamiento de contexto: {str(last_err)}")
