# Éclat Studio — Frontend

React + Vite. Consume la API de Express.

## Local

```bash
npm install
cp .env.example .env
npm run dev
```

En `.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

## Vercel

- Importa el repositorio/carpeta `frontend`.
- Framework preset: Vite.
- Build command: `npm run build`.
- Output directory: `dist`.
- Environment variable:
  `VITE_API_URL=https://TU-BACKEND.onrender.com/api`

Después de desplegar, agrega el dominio de Vercel en la variable `FRONTEND_URL` del servicio Render. Vuelve a desplegar el backend para aplicar CORS.

El cliente puede solicitar citas y ver su estado. Los usuarios `PROFESIONAL` y `ADMIN` pueden gestionar solicitudes. Los datos de autenticación se envían mediante JWT.
