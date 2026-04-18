import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

try:
    print("Connecting...")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS total_carbs FLOAT DEFAULT 0;")
    cur.execute("ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS total_fat FLOAT DEFAULT 0;")
    conn.commit()
    print("Columns added")
except Exception as e:
    print(f"Error: {e}")
