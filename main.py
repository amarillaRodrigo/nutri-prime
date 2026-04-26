import io
import os
import json
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from ai_service import VisionInferenceService
from advisor_service import AdvisorService
from search_service import SearchService
from logic_service import calculate_tmb, evaluate_intervention, suggest_goals
from fastapi.responses import StreamingResponse
from analytics_service import AnalyticsService
from dopamine_engine import DopamineInterventionEngine
from db_service import DBService
from auth import get_current_user
from models import UploadResponse, UserProfile, FoodAnalysisResult, ProfileSyncResponse, AdvisorRequest, ManualSearchResponse, ManualLogRequest, ManualSearchResult, RefineContextRequest
import random

CATBOX_REWARDS = [
    "https://files.catbox.moe/37lqle.mp4",
    "https://files.catbox.moe/frxafy.mp4",
    "https://files.catbox.moe/u7iiwv.mp4",
    "https://files.catbox.moe/kut84n.mp4",
    "https://files.catbox.moe/qrm8sw.mp4",
    "https://files.catbox.moe/zvgpm2.mp4",
    "https://files.catbox.moe/2ogisq.mp4",
    "https://files.catbox.moe/05sk3z.mp4",
    "https://files.catbox.moe/4x4s0i.mp4",
    "https://files.catbox.moe/odcsmu.mp4",
    "https://files.catbox.moe/08ptm3.mp4",
    "https://files.catbox.moe/9epe2r.mp4",
    "https://files.catbox.moe/z6hed7.mp4",
    "https://files.catbox.moe/25z40p.mp4",
    "https://files.catbox.moe/llsxdn.mp4",
    "https://files.catbox.moe/qxt3y3.mp4",
    "https://files.catbox.moe/9jo4t8.mp4",
    "https://files.catbox.moe/5vwzo9.mp4",
    "https://files.catbox.moe/nlirmh.mp4",
    "https://files.catbox.moe/vtx9ew.mp4",
    "https://files.catbox.moe/7mefq1.mp4",
    "https://files.catbox.moe/zjuvi3.mp4",
    "https://files.catbox.moe/ztp4e7.mp4",
    "https://files.catbox.moe/85n27d.mp4",
    "https://files.catbox.moe/iru7gd.mp4",
    "https://files.catbox.moe/11ooyu.mp4",
    "https://files.catbox.moe/96iwrb.mp4",
    "https://files.catbox.moe/xiw9t8.mp4",
    "https://files.catbox.moe/foawne.mp4",
    "https://files.catbox.moe/l5r3zx.mp4",
    "https://files.catbox.moe/gmzw1x.mp4",
    "https://files.catbox.moe/d3r5q9.mp4",
    "https://files.catbox.moe/2nfxgg.mp4",
    "https://files.catbox.moe/a3sqty.mp4",
    "https://files.catbox.moe/ks8uei.mp4",
    "https://files.catbox.moe/qe12xi.mp4",
    "https://files.catbox.moe/aul4bp.mp4",
    "https://files.catbox.moe/ks5ghh.mp4",
    "https://files.catbox.moe/6e3i7w.mp4",
    "https://files.catbox.moe/0d7mje.mp4",
    "https://files.catbox.moe/ophtws.mp4",
    "https://files.catbox.moe/yhhqer.mp4",
    "https://files.catbox.moe/1uwo7l.mp4",
    "https://files.catbox.moe/tt59td.mp4",
    "https://files.catbox.moe/nrmkzs.mp4",
    "https://files.catbox.moe/5zr37i.mp4",
    "https://files.catbox.moe/mqd6y9.mp4",
    "https://files.catbox.moe/i6p1yj.mp4",
    "https://files.catbox.moe/624gpc.mp4",
    "https://files.catbox.moe/2w0k21.mp4",
    "https://files.catbox.moe/ol9y8u.mp4",
    "https://files.catbox.moe/fz1lre.mp4",
    "https://files.catbox.moe/r91026.mp4",
    "https://files.catbox.moe/fou9ca.mp4",
    "https://files.catbox.moe/a6cdju.mp4",
    "https://files.catbox.moe/2bo15p.mp4",
    "https://files.catbox.moe/k1eqby.mp4",
    "https://files.catbox.moe/w3ms3i.mp4",
    "https://files.catbox.moe/5wovwo.mp4",
    "https://files.catbox.moe/t1o0ap.mp4",
    "https://files.catbox.moe/v25dic.mp4",
    "https://files.catbox.moe/l81zhf.mp4",
    "https://files.catbox.moe/83mhiq.mp4",
    "https://files.catbox.moe/lpmcuh.mp4",
    "https://files.catbox.moe/d4hce8.mp4",
    "https://files.catbox.moe/jd2m3e.mp4",
    "https://files.catbox.moe/f0qqjk.mp4",
    "https://files.catbox.moe/bhfa2d.mp4",
    "https://files.catbox.moe/g0oou5.mp4",
    "https://files.catbox.moe/4gau90.mp4",
    "https://files.catbox.moe/ph6ggf.mp4",
    "https://files.catbox.moe/n91dt6.mp4",
    "https://files.catbox.moe/pxpnm9.mp4",
    "https://files.catbox.moe/xs6084.mp4",
    "https://files.catbox.moe/e7gky9.mp4",
    "https://files.catbox.moe/t7kfuw.mp4",
    "https://files.catbox.moe/8adgy1.mp4",
    "https://files.catbox.moe/87ze97.mp4",
    "https://files.catbox.moe/qxiew6.mp4",
    "https://files.catbox.moe/ujl297.mp4",
    "https://files.catbox.moe/6xzzke.mp4",
    "https://files.catbox.moe/7gmyvn.mp4",
    "https://files.catbox.moe/sed5s2.mp4",
    "https://files.catbox.moe/0d1bwz.mp4",
    "https://files.catbox.moe/17eapz.mp4",
    "https://files.catbox.moe/nraum4.mp4",
    "https://files.catbox.moe/lp7grx.mp4",
    "https://files.catbox.moe/dqhcx1.mp4",
    "https://files.catbox.moe/1hgk87.mp4",
    "https://files.catbox.moe/u2icid.mp4",
    "https://files.catbox.moe/vstxve.mp4",
    "https://files.catbox.moe/pw0c6g.mp4",
    "https://files.catbox.moe/cn2qlu.mp4",
    "https://files.catbox.moe/nzbjjh.mp4",
    "https://files.catbox.moe/94pilk.mp4",
    "https://files.catbox.moe/1ah1sn.mp4",
    "https://files.catbox.moe/8lfcaq.mp4",
    "https://files.catbox.moe/t2wcmb.mp4",
    "https://files.catbox.moe/0sstoa.mp4",
    "https://files.catbox.moe/yuzr8v.mp4",
    "https://files.catbox.moe/pnqkky.mp4",
    "https://files.catbox.moe/zxtc2k.mp4",
    "https://files.catbox.moe/gqw4gl.mp4",
    "https://files.catbox.moe/byhjxe.mp4",
    "https://files.catbox.moe/lnnun3.mp4",
    "https://files.catbox.moe/d8twhj.mp4",
    "https://files.catbox.moe/p7a24a.mp4",
    "https://files.catbox.moe/g7ykxr.mp4",
    "https://files.catbox.moe/q3q3gb.mp4",
    "https://files.catbox.moe/ifm46q.mp4",
    "https://files.catbox.moe/md25x9.mp4",
    "https://files.catbox.moe/mvfh4s.mp4",
    "https://files.catbox.moe/8fn0py.mp4",
    "https://files.catbox.moe/tdkc44.mp4",
    "https://files.catbox.moe/powltj.mp4",
    "https://files.catbox.moe/hru3ei.mp4",
    "https://files.catbox.moe/7ooaie.mp4",
    "https://files.catbox.moe/9e230i.mp4",
    "https://files.catbox.moe/9eni41.mp4",
    "https://files.catbox.moe/pnlfq5.mp4",
    "https://files.catbox.moe/o45vk3.mp4",
    "https://files.catbox.moe/73ih5o.mp4",
    "https://files.catbox.moe/pwbhyy.mp4",
    "https://files.catbox.moe/hx7gwr.mp4",
    "https://files.catbox.moe/es3mjg.mp4",
    "https://files.catbox.moe/z080xo.mp4",
    "https://files.catbox.moe/26d9d3.mp4",
    "https://files.catbox.moe/urdlh3.mp4",
    "https://files.catbox.moe/4c4u9m.mp4",
    "https://files.catbox.moe/9muywv.mp4",
    "https://files.catbox.moe/rxs22m.mp4",
    "https://files.catbox.moe/xw29a0.mp4",
    "https://files.catbox.moe/j1fvhq.mp4",
    "https://files.catbox.moe/8ap0u1.mp4",
    "https://files.catbox.moe/krdz9v.mp4",
    "https://files.catbox.moe/20cr4u.mp4",
    "https://files.catbox.moe/p2siiz.mp4",
    "https://files.catbox.moe/has7i5.mp4",
    "https://files.catbox.moe/gbjiym.mp4",
    "https://files.catbox.moe/q3y8j9.mp4",
    "https://files.catbox.moe/t13jar.mp4",
    "https://files.catbox.moe/gxhj99.mp4",
    "https://files.catbox.moe/7pn439.mp4",
    "https://files.catbox.moe/47gy6t.mp4",
    "https://files.catbox.moe/for5dx.mp4",
    "https://files.catbox.moe/o64443.mp4",
    "https://files.catbox.moe/wdta28.mp4",
    "https://files.catbox.moe/18q2gm.mp4",
    "https://files.catbox.moe/4x9ecr.mp4",
    "https://files.catbox.moe/9hsf9t.mp4",
    "https://files.catbox.moe/1ix237.mp4",
    "https://files.catbox.moe/zcm3m3.mp4",
    "https://files.catbox.moe/5scubr.mp4",
    "https://files.catbox.moe/x3j9ya.mp4",
    "https://files.catbox.moe/qisecv.mp4",
    "https://files.catbox.moe/taezxb.mp4",
    "https://files.catbox.moe/33y9i0.MP4",
    "https://files.catbox.moe/vfb5vw.mp4",
    "https://files.catbox.moe/mywq5r.mp4",
    "https://files.catbox.moe/krq6sd.mp4",
    "https://files.catbox.moe/hs4m59.mp4",
    "https://files.catbox.moe/16iypw.mp4",
    "https://files.catbox.moe/sg5gna.mp4",
    "https://files.catbox.moe/74m8ox.mp4",
    "https://files.catbox.moe/74m8ox.mp4",
    "https://files.catbox.moe/gstyiv.mp4",
    "https://files.catbox.moe/ky3fw6.mp4",
    "https://files.catbox.moe/zle2pm.mp4",
    "https://files.catbox.moe/3agd1t.mp4",
    "https://files.catbox.moe/p3ld4j.mp4",
    "https://files.catbox.moe/i6edkw.mp4",
    "https://files.catbox.moe/o79z7k.mp4",
    "https://files.catbox.moe/1a2bvu.mp4",
    "https://files.catbox.moe/p2zluy.mp4",
    "https://files.catbox.moe/4fwclx.mp4",
    "https://files.catbox.moe/m6twr0.mp4",
    "https://files.catbox.moe/cp6304.mp4",
    "https://files.catbox.moe/umdo9h.mp4",
    "https://files.catbox.moe/92id4t.mp4",
    "https://files.catbox.moe/ryeg66.mp4",
    "https://files.catbox.moe/ux6wi5.mp4",
    "https://files.catbox.moe/n1ar3n.mp4",
    "https://files.catbox.moe/54ram9.mp4",
    "https://files.catbox.moe/38fwuz.mp4",
    "https://files.catbox.moe/wjetc8.mp4",
    "https://files.catbox.moe/1qlda1.mp4",
    "https://files.catbox.moe/azmw3f.mp4",
    "https://files.catbox.moe/t0xxm8.mp4",
    "https://files.catbox.moe/f5zmp6.mp4",
    "https://files.catbox.moe/q6x1gk.mp4",
    "https://files.catbox.moe/fc3d28.mp4"


]
from google import genai
import uvicorn
from datetime import date

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

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
advisor_service = AdvisorService()
search_service = SearchService()
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
            
        # 5. Remove fields that don't belong to the db schema
        db_payload.pop("calorie_goal_override", None)
        db_payload.pop("protein_goal_override", None)
        db_payload.pop("last_recalculation", None)
        
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
        db_response = await DBService.create_food_entry(entry_payload)
        entry_id = None
        if db_response and getattr(db_response, 'data', None):
            entry_id = db_response.data[0].get("id")
        
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
        
        # Dopamine Reward Logic
        reward_active = False
        reward_url = None
        if analysis.veredicto == "BUENO":
            reward_active = True
            reward_url = random.choice(CATBOX_REWARDS)
        
        return UploadResponse(
            analysis=analysis,
            motivation_mode_active=trigger_intervention,
            calories_remaining=calories_remaining,
            message=analysis.justificacion or intervention_data["message"] or "Registro guardado.",
            entry_id=entry_id,
            is_packaged=analysis.is_packaged,
            unit_name=analysis.unit_name,
            reward_active=reward_active,
            reward_url=reward_url
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
        today_totals = await DBService.get_today_totals(user_id)
        return {
            "history": history,
            "today_totals": today_totals
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/history/{entry_id}")
async def delete_history_entry(
    entry_id: str,
    user_id: str = Depends(get_current_user)
):
    try:
        await DBService.delete_food_entry(entry_id, user_id)
        return {"message": "Entry deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/advisor/recommend")
async def recommend_food(
    request: AdvisorRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Suggests meals based on available food and remaining macros.
    """
    try:
        recommendations = await advisor_service.get_recommendations(request)
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ScaleRequest(BaseModel):
    multiplier: float

@app.post("/history/{entry_id}/scale")
async def scale_history_entry(
    entry_id: str,
    request: ScaleRequest,
    user_id: str = Depends(get_current_user)
):
    try:
        await DBService.scale_food_entry(entry_id, user_id, request.multiplier)
        return {"message": "Entry scaled"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/history/{entry_id}/refine")
async def refine_history_entry(
    entry_id: str,
    request: RefineContextRequest,
    user_id: str = Depends(get_current_user)
):
    try:
        # Get the current entry
        db_response = DBService._db.table("food_entries").select("*").eq("id", entry_id).eq("user_id", user_id).execute()
        if not db_response.data:
            raise HTTPException(status_code=404, detail="Entry not found")
            
        entry = db_response.data[0]
        
        # Call AI to refine macros based on context
        refined_data = await vision_service.refine_food_context(
            food_name=entry.get("food_name", "Comida"),
            current_calories=entry.get("calories", 0),
            current_macros=entry.get("macros", {}),
            context=request.context
        )
        
        # Update entry in DB
        await DBService.update_food_macros(
            entry_id, user_id, 
            refined_data.calories, 
            refined_data.protein, 
            refined_data.carbs, 
            refined_data.fat
        )
        
        return {"message": "Entry refined", "refined_macros": refined_data.dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search-food")
async def search_food(
    q: str,
    user_id: str = Depends(get_current_user)
):
    """
    Finds food nutritional info from a text query.
    """
    try:
        results = await search_service.search_food(q)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/log-manual")
async def log_manual_food(
    request: ManualLogRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Saves a manual food entry with final calculated macros.
    """
    try:
        # Construct the entry data for DBService.create_food_entry
        # Note: We align the structure with how DB expects it (from main.py logic)
        # Map nutritional quality to a score for the DB
        score_map = {"BUENO": 10, "MODERADO": 6, "MALO": 2}
        score = score_map.get(request.veredicto, 5)

        entry_data = {
            "user_id": user_id,
            "food_name": f"{request.nombre} ({request.grams}g)",
            "calories": int(request.calories),
            "macros": {
                "protein": request.protein,
                "carbs": request.carbs,
                "fat": request.fat,
                "is_manual": True
            },
            "nutrition_score": score,
            "veredicto": request.veredicto,
            "justificacion": request.justificacion
        }
        
        db_res = await DBService.create_food_entry(entry_data)
        
        # Recalculate remaining calories (simplified for this endpoint)
        profile = await DBService.get_profile(user_id)
        goal = profile.get("calorie_goal", 2000)
        today_totals = await DBService.get_today_totals(user_id)
        remaining = max(0, goal - today_totals["calories"])
        
        # Dopamine Reward Logic
        reward_active = False
        reward_url = None
        if request.veredicto == "BUENO":
            reward_active = True
            reward_url = random.choice(CATBOX_REWARDS)
        
        return {
            "message": "Registro manual guardado con éxito.",
            "calories_remaining": remaining,
            "entry_id": db_res.data[0]["id"] if db_res.data else None,
            "reward_active": reward_active,
            "reward_url": reward_url
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
