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
"""

class VisionInferenceService:
    def __init__(self):
        # Using the new SDK client pattern
        self.model_id = "gemini-2.5-flash"

    async def analyze_food_image(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> FoodAnalysisResult:
        """
        Sends raw image bytes to Gemini using the modern google-genai SDK (Async).
        """
        try:
            response = await client.aio.models.generate_content(
                model=self.model_id,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    "Realiza el análisis nutricional detallado de este plato."
                ],
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    response_schema=FoodAnalysisResult,
                    max_output_tokens=1000,
                )
            )
            
            if not response.text:
                raise ValueError("Gemini returned empty response.")
                
            raw_text = response.text
            # Clean markdown code blocks if Gemini returns them despite application/json
            match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', raw_text)
            if match:
                raw_text = match.group(1)
            else:
                start_idx = raw_text.find('{')
                end_idx = raw_text.rfind('}')
                if start_idx != -1 and end_idx != -1:
                    raw_text = raw_text[start_idx:end_idx+1]
            
            raw_text = raw_text.strip()
            analysis_dict = json.loads(raw_text)
            
            # Pydantic validation (Zero Trust)
            return FoodAnalysisResult(**analysis_dict)
            
        except Exception as e:
            print(f"VisionInferenceService Error: {str(e)}")
            raise e
