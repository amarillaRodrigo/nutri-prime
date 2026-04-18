from pydantic import BaseModel, Field
from typing import List, Optional

class UserProfile(BaseModel):
    """Core user data for calculations."""
    weight_kg: float
    height_cm: float
    age: int
    gender: str = Field(..., pattern="^(male|female)$")
    activity_level: float = Field(default=1.2)
    goal_type: str = Field(default="maintain", pattern="^(cut|maintain|bulk)$")
    
    # New: Manual overrides for "adaptable" goals
    calorie_goal_override: Optional[float] = None
    protein_goal_override: Optional[float] = None
    
    # Tracking for mandatory recalculation (ISO format date string)
    last_recalculation: Optional[str] = None

class ProfileSyncResponse(BaseModel):
    """Response after syncing profile with DB."""
    profile: dict
    suggested_goals: dict
    message: str

class FoodItem(BaseModel):
    """Individual food item within a meal."""
    nombre: str
    porcion_estimada: str

class FoodAnalysisResult(BaseModel):
    """Schema for Gemini output via JSON mode."""
    alimento: str
    cantidad_estimada_gramos: int
    proteina: float
    carbohidratos: float
    grasas: float
    calidad_nutricional: int = Field(ge=1, le=10)
    veredicto: str = Field(..., pattern="^(BUENO|MALO|MODERADO)$")
    justificacion: str
    food_items: List[FoodItem]
    total_estimated_calories: int

class UploadResponse(BaseModel):
    """Final response returned by the API."""
    analysis: FoodAnalysisResult
    motivation_mode_active: bool
    calories_remaining: float
    message: Optional[str] = None
    entry_id: Optional[str] = None
