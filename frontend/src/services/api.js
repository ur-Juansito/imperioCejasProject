import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000 // Render (plan gratuito) puede tardar en "despertar"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Sesión vencida o token inválido → volver a la pantalla de login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = String(error.config?.url || '').startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthCall && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

/**
 * Mensaje legible para cualquier error de axios. Distingue:
 *  - el servidor respondió con un mensaje (message / error)
 *  - no hubo respuesta (servidor apagado, URL incorrecta o bloqueo CORS)
 */
export function getErrorMessage(err, fallback = 'Ocurrió un error inesperado.') {
  if (err?.response) {
    const data = err.response.data;
    return data?.message || data?.error || `${fallback} (código ${err.response.status})`;
  }
  if (err?.code === 'ECONNABORTED') {
    return 'El servidor tardó demasiado en responder. Si acaba de iniciar, espera unos segundos e intenta de nuevo.';
  }
  return 'No se pudo conectar con el servidor. Verifica que el backend esté activo, la variable VITE_API_URL y la configuración CORS (FRONTEND_URL).';
}

export default api;
