import io
import os
import json
from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from models import UploadResponse, UserProfile, FoodAnalysisResult, ProfileSyncResponse
from ai_service import VisionInferenceService
from logic_service import calculate_tmb, evaluate_intervention, suggest_goals
from fastapi.responses import StreamingResponse
from analytics_service import AnalyticsService
from dopamine_engine import DopamineInterventionEngine
from db_service import DBService
from auth import get_current_user
import uvicorn
from datetime import date

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    print("PRIME STATE API - ONLINE")
    yield

app = FastAPI(title="Prime State API", version="2.0.0", lifespan=lifespan)

# CORS setup
app.add_middleware(CORSMiddleware, allow_origins=["https://nutri-prime.vercel.app"], allow_methods=["*"], allow_headers=["*"], allow_credentials=True, expose_headers=["*"])

# Initialize services
vision_service = VisionInferenceService()
dopamine_engine = DopamineInterventionEngine()
analytics_service = AnalyticsService()

@app.get("/health")
async def health_check():
    return {"status": "ok", "phase": 2}

@app.post("/sync-profile", response_model=ProfileSyncResponse)
async def sync_profile(
    profile: UserProfile,
    user_id: str = Depends(get_current_user)
):
    """
    Syncs user physical profile and calculates scientific goals.
    """
    try:
        # 1. Calculate suggested goals
        suggestions = suggest_goals(profile, profile.goal_type)
        
        # 2. Prepare payload
        db_payload = profile.model_dump()
        db_payload["id"] = user_id
        
        # 3. Apply overrides or suggestions
        db_payload["calorie_goal"] = profile.calorie_goal_override or suggestions["calorie_goal"]
        db_payload["protein_goal"] = profile.protein_goal_override or suggestions["protein_goal"]
        
        # 4. Update recalculation date if missing
        if not db_payload.get("last_recalculation"):
            db_payload["last_recalculation"] = date.today().isoformat()
        
        await DBService.upsert_profile(db_payload)
        
        return ProfileSyncResponse(
            profile=db_payload,
            suggested_goals=suggestions,
            message="Perfil sincronizado exitosamente."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/profile", response_model=UserProfile)
async def get_user_profile(
    user_id: str = Depends(get_current_user)
):
    """
    Retrieves the user's profile from Supabase.
    """
    try:
        profile = await DBService.get_profile(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        return profile
    except Exception as e:
        if "404" in str(e): raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-image", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """
    Authenticated endpoint for food analysis.
    Saves entries to Supabase and updates daily logs.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        # 1. Get user profile and goals
        profile_data = await DBService.get_profile(user_id)
        if not profile_data:
            raise HTTPException(status_code=404, detail="Profile not found. Please sync-profile first.")
        
        # 2. Vision Inference
        image_bytes = await file.read()
        analysis: FoodAnalysisResult = await vision_service.analyze_food_image(
            image_bytes, 
            mime_type=file.content_type
        )
        
        # 3. Save Entry to DB
        entry_payload = {
            "user_id": user_id,
            "food_name": analysis.alimento,
            "calories": analysis.total_estimated_calories,
            "macros": {
                "protein": analysis.proteina,
                "carbs": analysis.carbohidratos,
                "fat": analysis.grasas
            },
            "nutrition_score": analysis.calidad_nutricional,
            "veredicto": analysis.veredicto,
            "justificacion": analysis.justificacion
        }
        await DBService.create_food_entry(entry_payload)
        
        # 4. Update Daily Log
        today = date.today().isoformat()
        await DBService.update_daily_log_totals(
            user_id, 
            today, 
            analysis.total_estimated_calories, 
            analysis.proteina
        )
        
        # 5. Logic & Dopamine Intervention
        updated_log = await DBService.get_daily_log(user_id, today)
        daily_goal = profile_data.get("calorie_goal", 2000)
        calories_remaining = daily_goal - updated_log["total_calories"]
        
        intervention_data = await dopamine_engine.evaluate_and_get_asset(
            nutrition_score=analysis.calidad_nutricional,
            user_id=user_id
        )
        
        trigger_intervention = intervention_data["trigger_intervention"] or \
                               (analysis.total_estimated_calories > (calories_remaining + analysis.total_estimated_calories))
        
        return UploadResponse(
            analysis=analysis,
            motivation_mode_active=trigger_intervention,
            calories_remaining=calories_remaining,
            message=analysis.justificacion or intervention_data["message"] or "Registro guardado.",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/analytics/trends")
async def get_trends(
    user_id: str = Depends(get_current_user)
):
    """
    Returns a PNG chart showing the last 7 days of caloric trends.
    Uses 'Honest Visualization' (gaps for missing days).
    """
    try:
        # 1. Fetch data
        df = analytics_service.fetch_user_daily_calorie_logs(user_id)
        
        # 2. Get user calorie goal for visual reference
        profile = await DBService.get_profile(user_id)
        calorie_goal = profile.get("calorie_goal", 2000) if profile else 2000
        
        # 3. Process data
        clean_df = analytics_service.clean_daily_logs(df)
        processed_df = analytics_service.apply_additive_trend_model(clean_df)
        
        # 4. Generate Plot
        img_bytes = analytics_service.generate_trend_visualization_png(processed_df, calorie_goal)
        
        return StreamingResponse(io.BytesIO(img_bytes), media_type="image/png")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics Error: {str(e)}")

@app.get("/history")
async def get_history(
    user_id: str = Depends(get_current_user),
    limit: int = 10
):
    """
    Returns the latest food scanning history for the user.
    """
    try:
        history = await DBService.get_food_history(user_id, limit)
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
