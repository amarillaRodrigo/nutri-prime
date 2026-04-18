import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

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

SALIDA:
Debes responder ESTRICTAMENTE con un JSON válido:
{
  "alimento": str,
  "cantidad_estimada_gramos": int,
  "proteina": float,
  "carbohidratos": float,
  "grasas": float,
  "calidad_nutricional": int (1-10),
  "veredicto": "BUENO" | "MALO" | "MODERADO",
  "justificacion": str (breve, técnica y motivadora),
  "food_items": [{"nombre": str, "porcion_estimada": str}],
  "total_estimated_calories": int
}
"""

try:
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Realiza el análisis nutricional detallado de este plato. Es una pizza napolitana normal.",
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            max_output_tokens=1000,
        )
    )
    print("RAW:")
    print(repr(response.text))
except Exception as e:
    print(f"FAILED: {e}")
