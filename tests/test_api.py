import httpx
import asyncio
import os

async def test_upload():
    url = "http://127.0.0.1:8000/upload-image"
    
    # Check if we have a test image
    image_path = "test_food.png"
    if not os.path.exists(image_path):
        print(f"Error: {image_path} not found. Please provide an image to test.")
        return

    async with httpx.AsyncClient() as client:
        with open(image_path, "rb") as f:
            files = {"file": ("test_food.png", f, "image/png")}
            data = {
                "weight": 80.0,
                "height": 180.0,
                "age": 25,
                "gender": "male",
                "activity": 1.55
            }
            
            print("Sending request to Prime State API...")
            try:
                response = await client.post(url, files=files, data=data, timeout=30.0)
                print(f"Status: {response.status_code}")
                print(f"Response: {response.json()}")
            except Exception as e:
                print(f"Error connecting to API: {e}")

if __name__ == "__main__":
    # This script assumes the server is running on another process
    # uvicorn main:app --reload
    asyncio.run(test_upload())
