import os
import json
import urllib.request
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
url = f"{os.getenv('SUPABASE_URL')}/auth/v1/admin/users"

data = {
    "email": "fallback@prime.local",
    "password": "PrimePassword123!",
    "email_confirm": True
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'))
req.add_header('Authorization', f'Bearer {key}')
req.add_header('apikey', key)
req.add_header('Content-Type', 'application/json')
req.get_method = lambda: 'POST'

try:
    with urllib.request.urlopen(req) as response:
        res = response.read()
        print(f"SUCCESS: {res.decode('utf-8')}")
except Exception as e:
    try:
        print(f"FAILED: {e.read().decode('utf-8')}")
    except:
        print(f"FAILED: {e}")
