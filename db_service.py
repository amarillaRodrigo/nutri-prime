import os
from postgrest import SyncPostgrestClient
from dotenv import load_dotenv
from typing import Optional, Dict, Any

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

class DBService:
    # Direct Postgrest Client for DB operations
    _db = SyncPostgrestClient(f"{SUPABASE_URL}/rest/v1", headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }) if SUPABASE_URL and SUPABASE_KEY else None

    @staticmethod
    async def get_profile(user_id: str) -> Optional[Dict[str, Any]]:
        if not DBService._db: return None
        response = DBService._db.table("profiles").select("*").eq("id", user_id).execute()
        return response.data[0] if response.data else None

    @staticmethod
    async def upsert_profile(profile_data: Dict[str, Any]):
        if not DBService._db: return None
        return DBService._db.table("profiles").upsert(profile_data).execute()

    @staticmethod
    async def create_food_entry(entry_data: Dict[str, Any]):
        if not DBService._db: return None
        return DBService._db.table("food_entries").insert(entry_data).execute()

    @staticmethod
    async def get_daily_log(user_id: str, date_str: str):
        if not DBService._db: return None
        response = DBService._db.table("daily_logs").select("*").eq("user_id", user_id).eq("date", date_str).execute()
        return response.data[0] if response.data else None

    @staticmethod
    async def update_daily_log_totals(user_id: str, date_str: str, calories: int, protein: float):
        if not DBService._db: return None
        # This is a simplified version. In a real app, you'd use a RPC or atomic update.
        log = await DBService.get_daily_log(user_id, date_str)
        if log:
            new_calories = log["total_calories"] + calories
            new_protein = log["total_protein"] + protein
            return DBService._db.table("daily_logs").update({
                "total_calories": new_calories,
                "total_protein": new_protein
            }).eq("id", log["id"]).execute()
        else:
            return DBService._db.table("daily_logs").insert({
                "user_id": user_id,
                "date": date_str,
                "total_calories": calories,
                "total_protein": protein
            }).execute()
