# 🧠 Prime State API Documentation - Phase 4 (2026 Ready)

Bienvenido a la documentación técnica de **Prime State**, una API de nutrición multimodal diseñada para reducir la fricción del registro calórico a <3 segundos y reorientar la dopamina del usuario mediante IA.

## 🚀 Arquitectura del Sistema
- **Core**: Python 3.12+ & FastAPI.
- **IA**: Gemini 2.0 Flash (Async SDK).
- **Persistencia**: Supabase (PostgreSQL) con RLS (Row Level Security).
- **Analítica**: Pandas + Statsmodels + Matplotlib.

---

## 🔑 Autenticación (Zero Trust)
La API utiliza JWT de Supabase Auth para proteger cada endpoint.
- **Header Requerido**: `Authorization: Bearer <TOKEN_JWT>`
- El `user_id` se extrae automáticamente del campo `sub` del token.

---

## 📡 Referencia de Endpoints

### 1. Perfil y Objetivos
#### `POST /sync-profile`
Sincroniza los datos biométricos del usuario y calcula automáticamente los objetivos basados en evidencia científica.
- **Body (JSON)**:
  ```json
  {
    "weight_kg": float,
    "height_cm": float,
    "age": int,
    "gender": "male" | "female",
    "activity_level": float (1.2 - 1.9),
    "goal_type": "cut" | "bulk" | "maintain"
  }
  ```
- **Lógica**: Utiliza la fórmula de Mifflin-St Jeor para TMB y aplica déficits/superávits sugeridos.

---

### 2. Ingesta Multimodal
#### `POST /upload-image`
El corazón de la app. Procesa una imagen, realiza inferencia de macros y guarda la entrada.
- **Body**: `multipart/form-data` con campo `file`.
- **Respuesta**:
  ```json
  {
    "analysis": {
        "alimento": "Guiso de lentejas",
        "calidad_nutricional": 8,
        "total_estimated_calories": 450,
        "proteina": 25.0,
        "carbohidratos": 45.0,
        "grasas": 12.0
    },
    "motivation_mode_active": boolean,
    "calories_remaining": int,
    "message": "¡Buen provecho!"
  }
  ```
- **Motor de Dopamina**: Si `calidad_nutricional < 4`, se dispara una intervención de motivación.

---

### 3. Analítica Avanzada
#### `GET /analytics/trends`
Genera una visualización del balance energético de los últimos 7 días.
- **Respuesta**: Binario de imagen (`image/png`).
- **Filosofía**: *Visualización Honesta*. Si no hay registros un día, se muestra un hueco (gap) para fomentar la consistencia del usuario.

---

## 🗄️ Esquema de Base de Datos (SQL)
- `profiles`: Datos físicos y metas calóricas.
- `food_entries`: Historial detallado de cada comida escaneada.
- `daily_logs`: Agregados diarios para optimización de consultas.
- `motivation_assets`: Biblioteca de contenido motivador (video/imagenes) para intervenciones.

---

## 🧪 Pruebas Automatizadas
Para validar que todo el sistema funciona (con mock auth):
```powershell
python -m pytest -s tests/test_flujo_principal.py
```

---

## 🛠️ Instalación y Setup
1. Clonar el repositorio.
2. Instalar dependencias: `pip install -r requirements.txt`.
3. Configurar `.env` con las llaves de Gemini y Supabase.
4. Levantar servidor: `uvicorn main:app --reload`.

---
**Prime State v2.0.0** | *Reduciendo la fricción, potenciando el hábito.*
