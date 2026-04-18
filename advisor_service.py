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
Eres el 'Prime State Advisor', un experto en biohacking y nutrición de 2026.
Tu misión es ayudar al usuario a alcanzar sus objetivos físicos basándote en lo que le queda comer hoy y lo que tiene disponible.

CONTEXTO NUTRICIONAL RESTANTE:
- Calorías: {calories_left} kcal
- Proteína: {protein_left} g
- Carbohidratos: {carbs_left} g
- Grasas: {fat_left} g

LO QUE EL USUARIO TIENE DISPONIBLE:
{available_food}

REGLAS:
1. Sé creativo pero práctico. Si el usuario tiene pocos ingredientes, sugiere combinaciones inteligentes o alimentos individuales.
2. Prioriza cubrir la proteína faltante. La proteína es la ley.
3. El tono debe ser directo, ligeramente agresivo/motivador (estilo Prime State), pero profesional.
4. Genera sugerencias que se ajusten lo mejor posible a los macros restantes.
5. No inventes ingredientes que no estén en la lista, a menos que sean básicos (sal, pimienta, agua).
"""

class AdvisorService:
    def __init__(self):
        # Fallback list for higher resilience
        self.model_ids = [
            "gemini-1.5-flash-002", 
            "gemini-2.0-flash-exp", 
            "gemini-2.0-flash", 
            "gemini-1.5-flash", 
            "gemini-1.5-pro",
            "gemini-1.5-flash-8b"
        ]

    async def get_recommendations(self, request: AdvisorRequest) -> AdvisorResponse:
        last_err = None
        prompt = ADVISOR_PROMPT.format(
            calories_left=request.calories_left,
            protein_left=request.protein_left,
            carbs_left=request.carbs_left,
            fat_left=request.fat_left,
            available_food=request.available_food
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
