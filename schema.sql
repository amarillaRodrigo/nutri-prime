-- SQL Schema for Prime State App (Phase 2)

-- 1. Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    weight_kg FLOAT,
    height_cm FLOAT,
    age INT,
    gender TEXT CHECK (gender IN ('male', 'female')),
    activity_level FLOAT DEFAULT 1.2,
    goal_type TEXT CHECK (goal_type IN ('cut', 'maintain', 'bulk')) DEFAULT 'maintain',
    calorie_goal FLOAT,
    protein_goal FLOAT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Food Entries Table
CREATE TABLE IF NOT EXISTS public.food_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    food_name TEXT NOT NULL,
    calories INT NOT NULL,
    macros JSONB, -- {protein, carbs, fat}
    nutrition_score INT CHECK (nutrition_score BETWEEN 1 AND 10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Daily Logs Table
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    total_calories INT DEFAULT 0,
    total_protein FLOAT DEFAULT 0,
    is_complete BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, date)
);

-- 4. Motivation Assets Table
CREATE TABLE IF NOT EXISTS public.motivation_assets (
    id SERIAL PRIMARY KEY,
    asset_url TEXT NOT NULL,
    asset_type TEXT CHECK (asset_type IN ('video', 'image', 'quote')),
    message TEXT,
    min_score INT DEFAULT 1,
    max_score INT DEFAULT 4, -- Assets for low nutritional quality
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motivation_assets ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Profiles: Users can only view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles -- Needed for initial sync
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Food Entries: Users can only see/insert their own entries
CREATE POLICY "Users can handle own food entries" ON public.food_entries
    FOR ALL USING (auth.uid() = user_id);

-- Daily Logs: Users can handle own logs
CREATE POLICY "Users can handle own daily logs" ON public.daily_logs
    FOR ALL USING (auth.uid() = user_id);

-- Motivation Assets: Publicly readable for all users
CREATE POLICY "Motivation assets are public" ON public.motivation_assets
    FOR SELECT USING (true);
