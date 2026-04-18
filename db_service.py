import os
from postgrest import SyncPostgrestClient
from dotenv import load_dotenv
from typing import Optional, Dict, Any

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

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
        if response.data:
            return response.data[0]
        # No profile found – create a default fallback profile
        fallback_profile = {
            "id": user_id,
            "email": "fallback@prime.local",
            "weight_kg": 80,
            "height_cm": 180,
            "age": 25,
            "gender": "male",
            "activity_level": 1.55,
            "goal_type": "maintain",
            "calorie_goal": None,
            "protein_goal": None,
            "updated_at": None
        }
        # Upsert the fallback profile
        DBService._db.table("profiles").upsert(fallback_profile).execute()
        return fallback_profile

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
    async def get_today_totals(user_id: str):
        if not DBService._db: return {"calories": 0, "protein": 0, "carbs": 0, "fats": 0}
        from datetime import datetime, timezone
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        response = DBService._db.table("food_entries").select("*").eq("user_id", user_id).gte("created_at", f"{today_str}T00:00:00").execute()
        
        totals = {"calories": 0, "protein": 0, "carbs": 0, "fats": 0}
        for entry in response.data:
            totals["calories"] += entry.get("calories", 0)
            macros = entry.get("macros", {})
            if macros:
                totals["protein"] += macros.get("protein", 0)
                totals["carbs"] += macros.get("carbs", 0)
                totals["fats"] += macros.get("fat", 0)
                
        return totals

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

    @staticmethod
    async def get_food_history(user_id: str, limit: int = 10):
        if not DBService._db: return []
        response = DBService._db.table("food_entries") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
        return response.data
