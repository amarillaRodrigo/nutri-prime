# SKILL.md: Fase 1 - Cerebro Backend (Prime State App)

## 1. Metadatos y Propósito
Eres un Agente Ingeniero de Backend Experto operando en 2026. Tu objetivo es construir la primera fase de "Prime State", una API de nutrición multimodal diseñada para reducir la fricción del registro calórico a <3 segundos y reorientar la dopamina del usuario.
- **Stack estricto:** Python 3.12+, FastAPI (Asíncrono), Pydantic (Validación), SDK de Google GenAI (Gemini 1.5 Flash).

## 2. Lógica de Ejecución y Endpoints (Tareas)
Debes generar un servidor FastAPI modular que cumpla exactamente con estas tres tareas:

**Tarea 1.1: Endpoint de Ingesta (`/upload-image`)**
- Crea un endpoint POST que reciba un archivo binario (imagen) vía `multipart/form-data`.
- No guardes la imagen en disco de forma permanente aún; procésala en memoria para enviarla a la API de Gemini.

**Tarea 1.2: Motor de Inferencia (Prompt de Sistema Gemini)**
- Escribe una función asíncrona que llame a la API de Gemini 1.5 Flash pasándole la imagen.
- **Restricción Crítica:** Debes obligar a Gemini a devolver ESTRICTAMENTE un JSON. Utiliza Pydantic para definir y forzar este esquema de salida.
- El esquema JSON de salida debe ser:
  `{ "alimento": str, "cantidad_estimada_gramos": int, "proteina": float, "carbohidratos": float, "grasas": float, "calidad_nutricional": int (1-10) }`
- Instrucciones internas para Gemini: Debe ser capaz de manejar los "Edge Cases". Si el usuario indica por texto "Guiso de lentejas" (Comida de Olla) o envía referencias de escala (una mano/cubierto), la IA debe ajustar sus cálculos de volumen basándose en esa densidad promedio.

**Tarea 1.3: Lógica de Intervención (Motor de Dopamina)**
- Crea una función `evaluate_intervention(food_score: int, daily_calories_remaining: float) -> bool`.
- Si `calidad_nutricional` es menor a 4 (ej. comida ultraprocesada) o las calorías superan el presupuesto restante, devuelve `True` (activar `motivation_mode`). De lo contrario, `False`.
- El endpoint final debe devolver al frontend el JSON de macros y un flag booleano `motivation_mode_active`.

## 3. Guardarraíles de Seguridad y Clean Code
- **Manejo de Errores (Zero Trust):** Envuelve la llamada a Gemini en un bloque `try/except`. Si Gemini alucina o la API falla, devuelve un error HTTP 500 elegante, no rompas el servidor.
- **Seguridad:** Las API Keys (`GEMINI_API_KEY`) NUNCA deben estar hardcodeadas. Usa `python-dotenv` y cárgalas desde variables de entorno.
- **Responsabilidad Única (SRP):** Separa el código. Crea un archivo `main.py` para las rutas, un archivo `models.py` para los esquemas de Pydantic, y un archivo `ai_service.py` para la lógica de Gemini.

--------------------------------------------------------------------------------

Fase 2 - La Memoria y Base de Datos (Prime State App)

## 1. Metadatos y Propósito
Eres un Agente Arquitecto de Datos y Backend Experto. Tu objetivo es construir la capa de persistencia para "Prime State", una app de nutrición.
- **Stack estricto:** PostgreSQL, Supabase (Autenticación y Base de Datos), Python (para la lógica de sincronización metabólica).

## 2. Lógica de Ejecución y Tareas

**Tarea 2.1: Diseño del Esquema de Base de Datos (Supabase/PostgreSQL)**
- Escribe el script SQL para crear las siguientes tablas con sus relaciones:
  - `users`: id (UUID), email, tmb (float), protein_goal (float), calorie_goal (float), current_weight (float).
  - `food_entries`: Catálogo de los alimentos/escaneos.
  - `daily_logs`: Registro diario que vincula al usuario con sus `food_entries` y suma las calorías/macros del día.
- **Restricción de Clean Code:** Usa nombres significativos y descriptivos para las columnas y variables, evitando términos genéricos como `data` o `info` [4].

**Tarea 2.2: Función de Sincronización de Perfil (Cálculo de TMB)**
- Crea una función en Python llamada `calculate_tmb_and_sync` que calcule la Tasa Metabólica Basal usando la fórmula de Mifflin-St Jeor con los datos del usuario.
- **Restricción de Clean Code:** Evita usar números "hardcodeados" (mágicos) para los multiplicadores de la fórmula; define constantes con nombres claros en su lugar [4].
- **Restricción de Responsabilidad Única (SRP):** La función debe hacer solo una cosa [5]. Si necesitas actualizar la base de datos y además hacer el cálculo matemático, sepáralo en dos funciones distintas (ej. `calculate_tmb` y `sync_user_profile`).

## 3. Guardarraíles de Seguridad (DevSecOps) y Privacidad
- **Zero Trust y RLS:** Escribe las políticas de Seguridad a Nivel de Fila (Row Level Security - RLS) de Supabase para todas las tablas. Un usuario (identificado vía JWT) **solo** debe poder leer, insertar o modificar sus propios registros y fotos en `users`, `food_entries` y `daily_logs` [3].
- Valida exhaustivamente todos los inputs para evitar inyecciones antes de tocar la base de datos.

--------------------------------------------------------------------------------

Fase 3 - Cerebro de Inferencia y Motor de Dopamina (Prime State App)

## 1. Metadatos y Propósito
Eres un Agente Ingeniero de IA y Backend Experto. Tu objetivo es construir el motor de inferencia visual y la lógica de toma de decisiones para la app "Prime State".
- **Stack estricto:** Python 3.12+, SDK de Google GenAI (Gemini 1.5 Flash), OpenCV (para preprocesamiento de imágenes), Pydantic (Validación estricta de esquemas).

## 2. Lógica de Ejecución y Tareas

**Tarea 3.1: Orquestación del LLM Multimodal (Gemini)**
- Escribe el servicio `VisionInferenceService` que reciba la URL de la imagen del bucket y se comunique de forma asíncrona con Gemini 1.5 Flash.
- **Restricción Crítica (Pydantic):** La IA generativa produce resultados variables y puede alucinar [3]. Debes obligar a Gemini a devolver la salida estructurada usando un modelo de Pydantic llamado `FoodAnalysisResult`. 
- El esquema debe incluir: `food_items` (lista), `total_estimated_calories` (int), `macros` (dict con prot, carbs, fat), y `nutrition_score` (int 1-10).

**Tarea 3.2: Manejo de Casos Límite (Edge Cases)**
- El prompt de sistema enviado a Gemini debe incluir instrucciones de **Cadena de Pensamiento (Chain-of-Thought)** [5] para manejar explícitamente estos casos:
  1. *Comida de Olla:* Si el usuario proporciona un input de voz/texto adicional (ej. "Guiso de lentejas"), la IA debe priorizar la densidad calórica promedio de ese plato sobre lo que sea visible en la superficie.
  2. *Error de Escala:* Instruir al modelo para que busque referencias visuales 2D (cubiertos, manos) en la foto para calibrar el volumen de la porción.

**Tarea 3.3: Motor de Dopamina (Capa de Decisión)**
- Escribe la clase `DopamineInterventionEngine`. Esta clase evaluará el `nutrition_score` devuelto por Gemini.
- Si el score es menor a 4 (Baja Densidad Nutricional / Ultraprocesado), debe retornar el flag `trigger_intervention = True` junto con una URL de un `MotivationAsset` consultado en la base de datos.
- **Restricción de Clean Code:** Las funciones deben hacer una sola cosa [6]. Separar estrictamente la función que llama a Gemini de la función que evalúa si se debe lanzar la intervención de dopamina.

## 3. Guardarraíles (Guardrails) y Observabilidad
- **Manejo de Errores (Zero Trust):** Nunca confíes ciegamente en la salida del LLM. Utiliza bloques `try/except` [7]. Si falla la validación del JSON o la API de Gemini devuelve un error, debes tener un mecanismo de respaldo (fallback) que no rompa la aplicación.
- **LLMOps y Costos:** Registra la latencia de cada llamada a Gemini (P95) y el consumo de tokens (`cost_per_query`) [8]. El presupuesto de tokens es clave; establece límites (`max_tokens`) para evitar sobrecostos [4].
- **Nombres Descriptivos:** Usa nombres de variables que revelen su intención, como `total_estimated_calories` en lugar de palabras vagas como `data` o `info` [9].

--------------------------------------------------------------------------------
# SKILL.md: Fase 4 - Análisis de Datos y Tendencias (Prime State App)

## 1. Metadatos y Propósito
Eres un Agente Ingeniero de Datos y Científico de Datos Experto. Tu objetivo es construir el script de análisis para "Prime State", una app de nutrición, que genere visualizaciones basadas en el balance energético del usuario.
- **Stack estricto:** Python 3.12+, Pandas, SQLAlchemy (o cliente de Supabase/PostgreSQL), y librerías de modelado aditivo (como `Prophet` de Meta o `statsmodels`) para el análisis de tendencias.

## 2. Lógica de Ejecución (Tarea 4.1)
Debes crear un script modular que cumpla con el siguiente flujo:
- **Paso 1 (Extracción):** Conectarse a la tabla `daily_logs` y extraer los últimos 7 días de consumo del usuario, cruzándolos con su `calorie_goal` de la tabla `users`. 
- **Paso 2 (Limpieza y Edge Cases):** Manejar los días con datos nulos. Si el usuario tuvo un "atracón sin foto" (input manual) o no registró nada, el script debe aplicar una lógica de imputación de datos o resaltarlo como un evento anómalo en el modelo.
- **Paso 3 (Modelado Aditivo):** Ajustar un modelo aditivo sobre la serie temporal de los 7 días para descomponer la tendencia de consumo calórico real versus el objetivo diario.
- **Paso 4 (Visualización/Exportación):** Generar el gráfico de la tendencia y guardarlo como imagen (o devolver el JSON de las coordenadas de la gráfica para que el frontend lo renderice de forma nativa).

## 3. Guardarraíles de Código Limpio (Clean Code) y MLOps
- **Cero Números Mágicos:** No "hardcodees" el número 7 para la ventana de días ni otros umbrales. Utiliza variables constantes con nombres en mayúsculas al inicio del archivo (ej. `TREND_ANALYSIS_DAYS = 7`) para que sean fáciles de modificar en el futuro [4, 5].
- **Nomenclatura Significativa:** No utilices nombres de variables vagos como `data`, `info` o `df`. Usa nombres descriptivos que expliquen exactamente qué contiene la variable, como `user_daily_calorie_logs` o `additive_trend_results` [6, 7].
- **Principio de Responsabilidad Única (SRP):** Prohibido crear una función gigante que haga todo [1]. Debes escribir funciones cortas y modulares [2, 3]: una para hacer el fetch a la DB, otra para limpiar los datos, otra para aplicar el modelo aditivo, y otra para generar el gráfico.
- **Seguridad (Zero Trust):** Las credenciales de la base de datos deben cargarse usando `dotenv`. Nunca expongas la cadena de conexión en el script.

--------------------------------------------------------------------------------