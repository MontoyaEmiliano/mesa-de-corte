import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Importante para CORS
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      // Manejar autenticación si es necesario
    }
    return Promise.reject(error);
  }
);

export const rollosApi = {
  fetchRollos: () => api.get('/rollos/'),
  fetchRollosDisponibles: () => api.get('/rollos/disponibles/'),
  fetchRollo: (id) => api.get(`/rollos/${id}`),
  createRollo: (data) => api.post('/rollos/', data),
  updateRollo: (id, data) => api.put(`/rollos/${id}`, data),
  changeAvailability: (id, disponible) => 
    api.patch(`/rollos/${id}/disponibilidad`, { disponible }),
  deleteRollo: (id) => api.delete(`/rollos/${id}`),
  fetchEstadisticas: () => api.get('/estadisticas/')
};

export default api;