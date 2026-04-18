from db_service import DBService
from typing import Optional, Dict, Any

class DopamineInterventionEngine:
    """
    Evaluates nutrition scores and manages behavioral interventions.
    """
    def __init__(self, low_nutrition_threshold: int = 4):
        self.threshold = low_nutrition_threshold

    async def evaluate_and_get_asset(self, nutrition_score: int, user_id: str) -> Dict[str, Any]:
        """
        Triggers an intervention if score is below threshold.
        Fetches a motivation asset from the database.
        """
        trigger_intervention = False
        asset_url = None
        message = None

        if nutrition_score < self.threshold:
            trigger_intervention = True
            # Fetch a random motivation asset for low scores
            db = DBService._db
            if db:
                try:
                    # Filter assets that match the current low score
                    response = db.table("motivation_assets")\
                        .select("*")\
                        .lte("min_score", nutrition_score)\
                        .gte("max_score", nutrition_score)\
                        .limit(1)\
                        .execute()
                    
                    if response.data:
                        asset = response.data[0]
                        asset_url = asset.get("asset_url")
                        message = asset.get("message")
                except Exception as e:
                    print(f"DopamineInterventionEngine DB Error: {e}")
        
        return {
            "trigger_intervention": trigger_intervention,
            "asset_url": asset_url,
            "message": message or ("¡Cuidado! Este alimento es de baja calidad nutricional." if trigger_intervention else None)
        }
