import os
import asyncio
from google import genai
from google.genai import types
from dotenv import load_dotenv
from models import FoodAnalysisResult

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

async def main():
    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents="Realiza el análisis nutricional detallado de este plato. Es una pizza napolitana.",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=FoodAnalysisResult,
                max_output_tokens=1000,
            )
        )
        print("RAW:")
        print(response.text)
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(main())
