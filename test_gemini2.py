import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

models_to_test = ["gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-flash-lite-latest", "gemini-3.1-flash-lite-preview", "gemini-flash-latest"]

for m in models_to_test:
    try:
        response = client.models.generate_content(
            model=m,
            contents="Say hi"
        )
        print(f"SUCCESS: {m} -> {response.text}")
        break # stop at first success
    except Exception as e:
        print(f"FAILED: {m} -> {e}")
