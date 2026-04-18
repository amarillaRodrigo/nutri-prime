# 🚀 Guía de Despliegue: Prime State (Zero Tunnels)

Sigue estos pasos para llevar tu app de nutrición a la nube y eliminar los errores de conexión para siempre.

---

## 1. Preparar el Repositorio (Git)
Abre una terminal en la carpeta de tu proyecto y ejecuta estos comandos uno por uno:

```bash
# Inicializar Git si no lo has hecho
git init

# Agregar todos los archivos preparados por Antigravity
git add .

# Guardar los cambios
git commit -m "feat: ready for cloud deployment"
```

## 2. Crear Repositorio en GitHub
1. Ve a [github.com/new](https://github.com/new) y crea un repositorio llamado `nutri-prime`.
2. Sigue las instrucciones para conectar tu carpeta local:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/nutri-prime.git
   git branch -M main
   git push -u origin main
   ```

---

## 3. Desplegar el Cerebro (Backend) en Railway
1. Crea una cuenta en [Railway.app](https://railway.app).
2. Toca en **"+ New Project"** -> **"Deploy from GitHub repo"**.
3. Selecciona tu repositorio `nutri-prime`.
4. En la configuración del servicio:
   - Ve a **Variables** y agrega lo contenido en tu archivo `.env` local (`GEMINI_API_KEY`, `SUPABASE_URL`, etc.).
5. Railway detectará automáticamente el `Dockerfile` que creé y desplegará el backend.
6. **Importante**: Copia la URL que te de Railway (ej: `nutri-prime-production.up.railway.app`).

---

## 4. Desplegar la Interfaz (Frontend) en Vercel
1. Crea una cuenta en [Vercel.com](https://vercel.com).
2. Toca en **"Add New"** -> **"Project"**.
3. Importa tu repo `nutri-prime`.
4. **Configuración Crucial**:
   - En **Root Directory**, selecciona la carpeta `frontend`.
   - En **Environment Variables**, agrega:
     - `NEXT_PUBLIC_API_URL`: [Pega aquí la URL de Railway que copiaste en el paso anterior].
5. Dale a **"Deploy"**.

---

## ✅ ¡Listo!
Ahora tendrás una URL permanente de Vercel (ej: `https://prime-state.vercel.app`) que podrás abrir en tu iPhone. 

- **Sin 503.**
- **Sin autorizar IPs.**
- **100% estable 24/7.**
- **Cámara y Análisis instantáneos.**
