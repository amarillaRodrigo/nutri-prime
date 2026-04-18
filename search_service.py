import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv
from typing import List
from models import ManualSearchResponse, ManualSearchResult

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

SEARCH_PROMPT = """
Eres un Asistente de Búsqueda Nutricional experto. 
Tu tarea es encontrar información nutricional precisa basada en una consulta de texto.

Dada la consulta, devuelve una lista de posibles alimentos (máximo 3) con sus macros por cada 100g.

REGLAS:
1. Siempre asume porciones de 100g para los macros en `macros_per_100g`.
2. Las calorías deben ser consistentes con los macros (4/4/9).
3. Estandariza el nombre del alimento.
4. Incluye un veredicto (BUENO/MODERADO/MALO) basado en la calidad nutricional.
5. Si el usuario menciona una cantidad específica (ej: 'una manzana grande'), ajusta el nombre pero mantén los macros base por 100g para que el frontend pueda escalar.
"""

class SearchService:
    def __init__(self):
        self.model_id = "gemini-2.0-flash"

    async def search_food(self, query: str) -> ManualSearchResponse:
        try:
            response = await client.aio.models.generate_content(
                model=self.model_id,
                contents=f"Busca la información nutricional de: {query}",
                config=types.GenerateContentConfig(
                    system_instruction=SEARCH_PROMPT,
                    response_mime_type="application/json",
                    response_schema=ManualSearchResponse,
                )
            )

            if not response.text:
                raise ValueError("Gemini returned empty response.")

            data = json.loads(response.text)
            return ManualSearchResponse(**data)

        except Exception as e:
            print(f"SearchService Error: {str(e)}")
            raise e
