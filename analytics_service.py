import os
import pandas as pd
import matplotlib.pyplot as plt
from sqlalchemy import create_engine
from datetime import datetime, timedelta
from dotenv import load_dotenv
import io
from statsmodels.tsa.seasonal import seasonal_decompose

load_dotenv()

# Constants
TREND_ANALYSIS_DAYS = 7
DB_URL = os.getenv("DATABASE_URL")

class AnalyticsService:
    def __init__(self):
        if not DB_URL:
            print("Warning: DATABASE_URL not found.")
        self.engine = create_engine(DB_URL) if DB_URL else None

    def fetch_user_daily_calorie_logs(self, user_id: str) -> pd.DataFrame:
        """
        Paso 1 (Extracción): Conectarse a la tabla daily_logs y extraer los últimos 7 días.
        """
        if not self.engine:
            raise ValueError("Database engine not initialized.")
        
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=TREND_ANALYSIS_DAYS - 1)
        
        query = f"""
            SELECT date, total_calories, total_protein 
            FROM public.daily_logs 
            WHERE user_id = '{user_id}' 
            AND date >= '{start_date}'
            ORDER BY date ASC
        """
        df = pd.read_sql(query, self.engine)
        return df

    def clean_daily_logs(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Paso 2 (Limpieza): Asegurar que el DataFrame tenga los 7 días, dejando NaNs para los huecos.
        """
        end_date = datetime.now().date()
        daterange = pd.date_range(end=end_date, periods=TREND_ANALYSIS_DAYS)
        
        # Create a base dataframe with all dates
        full_df = pd.DataFrame({"date": daterange.date})
        
        # Merge with existing data
        df['date'] = pd.to_datetime(df['date']).dt.date
        user_daily_calorie_logs = pd.merge(full_df, df, on="date", how="left")
        
        # We DON'T impute here to maintain "Honest Visualization"
        return user_daily_calorie_logs

    def apply_additive_trend_model(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Paso 3 (Modelado Aditivo): Descomponer la tendencia.
        Note: For such a short window (7 days), we'll do a simple moving average 
        or a linear trend if seasonal_decompose fails due to missing data.
        """
        # Fill NaNs with 0 for the model calculation (temporary) or use interpolate
        model_data = df.copy()
        model_data = model_data.set_index(pd.to_datetime(model_data['date']))
        
        # Minimal imputation for the 'trend line' only
        model_data['total_calories_filled'] = model_data['total_calories'].interpolate(method='linear').fillna(0)
        
        # Simple trend (rolling mean)
        model_data['trend'] = model_data['total_calories_filled'].rolling(window=3, min_periods=1).mean()
        
        return model_data

    def generate_trend_visualization_png(self, processed_df: pd.DataFrame, calorie_goal: float = 2000) -> bytes:
        """
        Paso 4 (Visualización): Generar el gráfico premium y devolverlo como bytes.
        """
        plt.style.use('dark_background')
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Bar chart for actual intake (with gaps for missing days)
        ax.bar(processed_df.index, processed_df['total_calories'], color='#00d1b2', label='Calorías Reales', alpha=0.7)
        
        # Goal line
        ax.axhline(y=calorie_goal, color='#ff3860', linestyle='--', label=f'Objetivo ({calorie_goal})')
        
        # Trend line
        ax.plot(processed_df.index, processed_df['trend'], color='#3273dc', linewidth=3, label='Tendencia (Media Móvil)')
        
        # Formatting
        ax.set_title('Tu Balance Energético (Últimos 7 Días)', fontsize=16, pad=20)
        ax.set_ylabel('Calorías (kcal)')
        ax.legend()
        
        # Save to buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', transparent=False, dpi=100)
        plt.close(fig)
        buf.seek(0)
        return buf.getvalue()
