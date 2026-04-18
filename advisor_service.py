import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv
from typing import List, Dict, Any
from fastapi import HTTPException
from models import AdvisorResponse, AdvisorRequest

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

ADVISOR_PROMPT = """
Eres el 'Prime State Emergency Advisor', un estratega de biohacking de 2026.
Tu misión es salvar el día del usuario basándote en lo que ya consumió y lo que planea hacer.

CONTEXTO NUTRICIONAL ACTUAL:
- Consumido: {calories_c} kcal (P: {protein_c}g, C: {carbs_c}g, F: {fat_c}g)
- Restante: {calories_l} kcal (P: {protein_l}g, C: {carbs_l}g, F: {fat_l}g)

MODO ESPECIAL:
- Ir al boliche hoy: {is_party}

REGLAS DE ESTRATEGIA:
1. ANÁLISIS DE EXCESOS: Si el usuario ya consumió de más en algún macro (ej: grasa > meta), la estrategia debe ser de COMPENSACIÓN (priorizar proteína magra, reducir ese macro al mínimo).
2. MODO BOLICHE: Si va al boliche, instruye sobre:
   - Estrategia de hidratación (ej: técnica del 1:1 agua/alcohol).
   - Mitigación calórica (qué alcohol elegir si va a tomar).
   - Qué comer ANTES de salir y qué evitar al volver.
3. TONO PRIME: Sé rudo pero efectivo. "Dammit, te pasaste de grasas. Aquí está cómo arreglarlo." o "Hoy se sale, aquí está tu plan de batalla."
4. INGREDIENTES DISPONIBLES: Si el usuario lista comida, úsala.
{available_food}

ESQUEMA DE RESPUESTA:
- emergency_strategy: Texto motivador y estratégico de alto impacto (formato Markdown).
- context_message: Un resumen corto del estado actual.
- suggestions: Lista de comidas específicas para el resto del día.
"""

class AdvisorService:
    def __init__(self):
        self.model_ids = [
            "gemini-2.5-flash", 
            "gemini-2.0-flash-lite", 
            "gemini-2.0-flash", 
            "gemini-flash-lite-latest"
        ]

    async def get_recommendations(self, request: AdvisorRequest) -> AdvisorResponse:
        last_err = None
        prompt = ADVISOR_PROMPT.format(
            calories_c=request.calories_consumed,
            protein_c=request.protein_consumed,
            carbs_c=request.carbs_consumed,
            fat_c=request.fat_consumed,
            calories_l=request.calories_left,
            protein_l=request.protein_left,
            carbs_l=request.carbs_left,
            fat_l=request.fat_left,
            is_party="SÍ" if request.is_party_mode else "NO",
            available_food=f"COMIDA DISPONIBLE: {request.available_food}" if request.available_food else "No se especificó comida disponible."
        )

        for model_id in self.model_ids:
            try:
                response = await client.aio.models.generate_content(
                    model=model_id,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction="Actúa como el Prime State Advisor.",
                        response_mime_type="application/json",
                        response_schema=AdvisorResponse,
                    )
                )

                if not response.text:
                    continue

                data = json.loads(response.text)
                return AdvisorResponse(**data)

            except Exception as e:
                last_err = e
                err_msg = str(e)
                print(f"[CEREBRO-FAIL] Advisor Model {model_id} failed: {err_msg}")
                # Try next on any error
                continue
        
        # Final Error handling
        err_msg = str(last_err)
        if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
            raise HTTPException(status_code=429, detail="El asesor está saturado por hoy. Intenta en unos momentos.")
        raise HTTPException(status_code=500, detail=f"Error en el asesor: {err_msg}")
