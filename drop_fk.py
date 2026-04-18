import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

try:
    print(f"Connecting to {db_url.split('@')[-1]}...")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    # Drop profiles -> auth.users foreign key
    cur.execute("ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;")
    print("Dropped profiles_id_fkey constraint.")
    
    # Also add missing columns to food_entries just in case
    cur.execute("ALTER TABLE public.food_entries ADD COLUMN IF NOT EXISTS veredicto TEXT;")
    cur.execute("ALTER TABLE public.food_entries ADD COLUMN IF NOT EXISTS justificacion TEXT;")
    print("Added veredicto/justificacion columns if they were missing.")

    conn.commit()
    cur.close()
    conn.close()
    print("Done!")
except Exception as e:
    print(f"Error: {e}")
