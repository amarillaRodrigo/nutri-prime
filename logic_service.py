from models import UserProfile

# Mifflin-St Jeor Constants
W_CONST = 10.0
H_CONST = 6.25
A_CONST = 5.0
MALE_ADJ = 5.0
FEMALE_ADJ = -161.0

# Intervention Thresholds
LOW_NUTRITION_THRESHOLD = 4

# Goal Calculation Constants
CUT_DEFICIT = 0.20        # 20% deficit
BULK_SURPLUS = 0.15       # 15% surplus
PROTEIN_BASE = 2.0        # Midpoint for maintain (1.6-2.2 g/kg)
PROTEIN_CUT = 2.3         # Midpoint for cut (1.8-2.7 g/kg)
PROTEIN_BULK = 2.0        # Midpoint for bulk (1.6-2.2 g/kg)

def calculate_tmb(profile: UserProfile) -> float:
    """
    Calculates Basal Metabolic Rate (BMR/TMB) using Mifflin-St Jeor equation.
    TMB = (W_CONST * weight) + (H_CONST * height) - (A_CONST * age) + s
    where s is +5 for males and -161 for females.
    Then multiplies by activity level.
    """
    base_tmb = (W_CONST * profile.weight_kg) + \
               (H_CONST * profile.height_cm) - \
               (A_CONST * profile.age)
    
    if profile.gender == "male":
        base_tmb += MALE_ADJ
    else:
        base_tmb += FEMALE_ADJ
        
    return base_tmb * profile.activity_level

def suggest_goals(profile: UserProfile, goal_type: str = "maintain") -> dict:
    """
    Suggests calorie and protein goals based on the person's profile and goal.
    Returns: {calorie_goal, protein_goal}
    """
    maintenance = calculate_tmb(profile)
    
    if goal_type == "cut":
        calories = maintenance * (1.0 - CUT_DEFICIT)
        protein = profile.weight_kg * PROTEIN_CUT
    elif goal_type == "bulk":
        calories = maintenance * (1.0 + BULK_SURPLUS)
        protein = profile.weight_kg * PROTEIN_BULK
    else: # maintain
        calories = maintenance
        protein = profile.weight_kg * PROTEIN_BASE
        
    return {
        "calorie_goal": round(calories, 0),
        "protein_goal": round(protein, 1)
    }

def evaluate_intervention(food_score: int, daily_calories_remaining: float, food_calories: int) -> bool:
    """
    Returns True if an intervention (motivation_mode) should be triggered.
    Triggered if food quality is too low or if it exceeds remaining budget.
    """
    if food_score < LOW_NUTRITION_THRESHOLD:
        return True
    
    if food_calories > daily_calories_remaining:
        return True
        
    return False
