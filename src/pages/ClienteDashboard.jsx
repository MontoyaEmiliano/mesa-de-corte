import { useState, useEffect } from "react";
import { useParams, Outlet, Link, useNavigate } from "react-router-dom";
import { rollosApi } from "../api/rollosApi";

export default function ClienteDashboard() {
  const { clienteId } = useParams();
  const [cliente, setCliente] = useState(null);
  const [stats, setStats] = useState({
    totalRollos: 0,
    rollosDisponibles: 0,
    rollosUsados: 0,
    ultimaActualizacion: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClienteData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener datos del cliente
        const clienteResponse = await rollosApi.fetchCliente(clienteId);
        setCliente(clienteResponse.data);
        
        // Obtener rollos del cliente para estadísticas
        await refreshStats();
        
      } catch (error) {
        console.error("Error al cargar datos del cliente:", error);
        setError(error.response?.data?.detail || "Error al cargar los datos del cliente");
        
        // Si el cliente no existe, redirigir después de un momento
        if (error.response?.status === 404) {
          setTimeout(() => navigate("/clientes"), 2000);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (clienteId) {
      fetchClienteData();
    }
  }, [clienteId, navigate]);

  // Función para refrescar estadísticas - CORREGIDA
  const refreshStats = async () => {
    try {
      setRefreshing(true);
      // Cambiado de fetchRollosByCliente a fetchRollosCliente
      const rollosResponse = await rollosApi.fetchRollosCliente(clienteId);
      const rollos = rollosResponse.data;
      
      setStats({
        totalRollos: rollos.length,
        rollosDisponibles: rollos.filter(r => r.disponible).length,
        rollosUsados: rollos.filter(r => !r.disponible).length,
        ultimaActualizacion: new Date()
      });
    } catch (error) {
      console.error("Error al refrescar estadísticas:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await refreshStats();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400 text-lg">Cargando dashboard del cliente...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate("/clientes")}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Volver a Clientes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/clientes/nuevo")}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors duration-200 group"
            >
              <span className="text-lg group-hover:transform group-hover:-translate-x-1 transition-transform duration-200">←</span>
              <span>Volver a clientes</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {cliente?.nombre}
              </h1>
              <p className="text-gray-400 text-sm">
                ID: {cliente?.id} • Creado: {cliente?.created_at ? new Date(cliente.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-white transition-all duration-200 disabled:opacity-50"
            >
              <span className={`text-lg ${refreshing ? 'animate-spin' : ''}`}>🔄</span>
              <span className="hidden sm:block">
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 shadow-2xl hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <span className="text-2xl">📦</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total de Rollos</p>
                <p className="text-2xl font-bold text-white">{stats.totalRollos}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 shadow-2xl hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Disponibles</p>
                <p className="text-2xl font-bold text-green-400">{stats.rollosDisponibles}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 shadow-2xl hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <span className="text-2xl">✂️</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Usados</p>
                <p className="text-2xl font-bold text-red-400">{stats.rollosUsados}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        {stats.ultimaActualizacion && (
          <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-700/50 mb-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-sm">🕒</span>
                <span className="text-sm">
                  Última actualización: {stats.ultimaActualizacion.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-sm">📊</span>
                <span className="text-sm">
                  Disponibilidad: {stats.totalRollos > 0 ? Math.round((stats.rollosDisponibles / stats.totalRollos) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navegación */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 mb-6 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to={`/cliente/${clienteId}/rollos`}
              className="flex items-center gap-3 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl border border-gray-600/50 hover:border-blue-500/50 text-white transition-all duration-200 group hover:shadow-lg transform hover:scale-105"
            >
              <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                <span className="text-xl">📋</span>
              </div>
              <div>
                <h3 className="font-semibold">Lista de Rollos</h3>
                <p className="text-sm text-gray-400">Ver todos los rollos</p>
              </div>
            </Link>
            
            <Link
              to={`/cliente/${clienteId}/agregar`}
              className="flex items-center gap-3 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl border border-gray-600/50 hover:border-green-500/50 text-white transition-all duration-200 group hover:shadow-lg transform hover:scale-105"
            >
              <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                <span className="text-xl">➕</span>
              </div>
              <div>
                <h3 className="font-semibold">Agregar Rollo</h3>
                <p className="text-sm text-gray-400">Añadir nuevo rollo</p>
              </div>
            </Link>
            
            <Link
              to={`/cliente/${clienteId}/cortes`}
              className="flex items-center gap-3 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl border border-gray-600/50 hover:border-purple-500/50 text-white transition-all duration-200 group hover:shadow-lg transform hover:scale-105"
            >
              <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                <span className="text-xl">✂️</span>
              </div>
              <div>
                <h3 className="font-semibold">Gestión de Cortes</h3>
                <p className="text-sm text-gray-400">Manejar cortes de tela</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Área de contenido */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl min-h-[400px]">
          <Outlet context={{ cliente, stats, refreshStats }} />
        </div>
      </div>
    </div>
  );
}