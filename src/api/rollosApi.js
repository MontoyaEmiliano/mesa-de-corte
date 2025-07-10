import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para añadir /api a todas las rutas
api.interceptors.request.use(config => {
  if (!config.url.startsWith('http') && !config.url.startsWith('/api/')) {
    config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
  }
  return config;
});

// Interceptor de respuesta mejorado
api.interceptors.response.use(
  response => {
    // Verificar si la respuesta contiene datos
    if (response.data === '' || response.data === null) {
      console.warn('La respuesta está vacía para:', response.config.url);
    }
    return response;
  },
  error => {
    console.error('Error en la petición:', error.config?.url, error.response?.status);
    
    // Manejo específico de errores comunes
    if (error.response?.status === 404) {
      console.error('Recurso no encontrado');
    } else if (error.response?.status === 400) {
      console.error('Datos inválidos:', error.response?.data?.detail);
    } else if (error.response?.status === 500) {
      console.error('Error del servidor');
    }
    
    return Promise.reject(error);
  }
);

export const rollosApi = {
  // Endpoints de clientes
  fetchClientes: (search = null) => api.get('/clientes/', {
    params: search ? { search } : {}
  }),
  
  fetchCliente: (id) => api.get(`/clientes/${id}/`),
  
  createCliente: (data) => api.post('/clientes/', data),
  
  updateCliente: (id, data) => api.patch(`/clientes/${id}/`, data),
  
  deleteCliente: (id) => api.delete(`/clientes/${id}/`),
  
  fetchRollosCliente: (clienteId, disponible = null) => api.get(`/api/clientes/${clienteId}/rollos/`, {
    params: disponible !== null ? { disponible: disponible.toString() } : {}
  }),

  // Endpoints de rollos
  fetchRollos: (filters = {}) => {
    const params = {};
    
    if (filters.clienteId) params.cliente_id = filters.clienteId;
    if (filters.disponible !== null && filters.disponible !== undefined) {
      params.disponible = filters.disponible.toString();
    }
    if (filters.tipo_tela) params.tipo_tela = filters.tipo_tela;
    if (filters.color) params.color = filters.color;
    
    return api.get('/rollos/', { params });
  },
  
  fetchRollo: (id) => api.get(`/rollos/${id}/`),
  
  createRollo: (data) => api.post('/rollos/', data),
  
  updateRollo: (id, data) => api.patch(`/rollos/${id}/`, data),
  
  deleteRollo: (id) => api.delete(`/rollos/${id}/`),
  
  // Estadísticas
  fetchStats: () => api.get('/stats/'),
  
  // Health check
  healthCheck: () => api.get('/health/'),
  
  // Utilidades
  getCSRFToken: () => api.get('/csrf/')
};

export default api;