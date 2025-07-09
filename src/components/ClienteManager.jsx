import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { rollosApi } from "../api/rollosApi";

export default function ClienteManager() {
  const [clientes, setClientes] = useState([]);
  const [nuevoCliente, setNuevoCliente] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [editName, setEditName] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async (search = null) => {
    try {
      setLoading(true);
      const response = await rollosApi.fetchClientes(search);
      setClientes(response.data);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      setErrorMessage("Error al cargar la lista de clientes");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      cargarClientes(value || null);
    }, 300);
  };

  const crearCliente = async () => {
    if (!nuevoCliente.trim()) {
      setErrorMessage("El nombre del cliente es requerido");
      setShowError(true);
      return;
    }

    try {
      setLoading(true);
      const response = await rollosApi.createCliente({
        nombre: nuevoCliente.trim()
      });
      setClientes([response.data, ...clientes]);
      setNuevoCliente("");
      setShowSuccess(true);
      
      // Auto-cerrar el modal de éxito después de 2 segundos
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("Error al crear cliente:", error);
      setErrorMessage(error.response?.data?.detail || "Error al crear el cliente");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const editarCliente = async (clienteId) => {
    if (!editName.trim()) {
      setErrorMessage("El nombre del cliente es requerido");
      setShowError(true);
      return;
    }

    try {
      setLoading(true);
      const response = await rollosApi.updateCliente(clienteId, {
        nombre: editName.trim()
      });
      
      setClientes(clientes.map(cliente => 
        cliente.id === clienteId ? response.data : cliente
      ));
      
      setEditingCliente(null);
      setEditName("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("Error al editar cliente:", error);
      setErrorMessage(error.response?.data?.detail || "Error al editar el cliente");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const eliminarCliente = async (clienteId) => {
    try {
      setLoading(true);
      await rollosApi.deleteCliente(clienteId);
      setClientes(clientes.filter(cliente => cliente.id !== clienteId));
      setShowConfirmDelete(false);
      setClienteSeleccionado(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      setErrorMessage(error.response?.data?.detail || "Error al eliminar el cliente");
      setShowError(true);
      setShowConfirmDelete(false);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarClick = (cliente) => {
    setClienteSeleccionado(cliente);
    setShowConfirmDelete(true);
  };

  const handleEditClick = (cliente) => {
    setEditingCliente(cliente.id);
    setEditName(cliente.nombre);
  };

  const cancelEdit = () => {
    setEditingCliente(null);
    setEditName("");
  };

  const verDashboard = (clienteId) => {
    navigate(`/cliente/${clienteId}`);
  };

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header con gradiente */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Gestión de Clientes
          </h1>
          <p className="text-gray-400">Administra tus clientes y accede a sus dashboards</p>
        </div>
        
        {/* Formulario para crear nuevo cliente */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 mb-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">➕</span>
            Crear Nuevo Cliente
          </h2>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={nuevoCliente}
              onChange={(e) => setNuevoCliente(e.target.value)}
              className="flex-1 p-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              onKeyPress={(e) => e.key === 'Enter' && crearCliente()}
              disabled={loading}
            />
            <button
              onClick={crearCliente}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Creando..." : "Crear Cliente"}
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-700/50 mb-8 shadow-2xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full p-3 pl-10 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
          </div>
        </div>

        {/* Lista de clientes */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span className="text-2xl">👥</span>
            Lista de Clientes ({clientes.length})
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-gray-400 mt-2">Cargando clientes...</p>
            </div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📋</span>
              <p className="text-gray-400 text-lg">No hay clientes registrados</p>
              <p className="text-gray-500 text-sm mt-2">
                {searchTerm ? "Prueba con otro término de búsqueda" : "Crea tu primer cliente arriba"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {clientes.map(cliente => (
                <div key={cliente.id} className="group p-4 bg-gray-700/50 rounded-xl border border-gray-600/50 hover:border-blue-500/50 transition-all duration-200 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {editingCliente === cliente.id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 p-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => e.key === 'Enter' && editarCliente(cliente.id)}
                          />
                          <button
                            onClick={() => editarCliente(cliente.id)}
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm"
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-white font-semibold text-lg group-hover:text-blue-400 transition-colors">
                            {cliente.nombre}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            ID: {cliente.id} • Creado: {new Date(cliente.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {editingCliente !== cliente.id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => verDashboard(cliente.id)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-white text-sm font-medium transition-all duration-200 transform hover:scale-105"
                        >
                          Dashboard
                        </button>
                        <button
                          onClick={() => handleEditClick(cliente)}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white text-sm transition-all duration-200"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminarClick(cliente)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-all duration-200"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de confirmación para eliminar */}
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-2xl max-w-md w-full mx-4 shadow-2xl border border-gray-700">
              <h3 className="text-xl font-bold text-red-400 mb-2 flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                Confirmar Eliminación
              </h3>
              <p className="text-white mb-4">
                ¿Estás seguro de que quieres eliminar el cliente <strong>"{clienteSeleccionado?.nombre}"</strong>?
              </p>
              <p className="text-gray-400 text-sm mb-6">
                Esta acción no se puede deshacer. Solo se puede eliminar si no tiene rollos asociados.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => eliminarCliente(clienteSeleccionado.id)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? "Eliminando..." : "Eliminar"}
                </button>
                <button
                  onClick={() => {
                    setShowConfirmDelete(false);
                    setClienteSeleccionado(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium transition-all duration-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de éxito */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-2xl max-w-sm w-full mx-4 shadow-2xl border border-gray-700">
              <h3 className="text-xl font-bold text-green-400 mb-2 flex items-center gap-2">
                <span className="text-2xl">✅</span>
                ¡Éxito!
              </h3>
              <p className="text-white mb-4">Operación realizada correctamente</p>
              <button
                onClick={() => setShowSuccess(false)}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-white font-medium transition-all duration-200"
              >
                Aceptar
              </button>
            </div>
          </div>
        )}

        {/* Modal de error */}
        {showError && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-2xl max-w-sm w-full mx-4 shadow-2xl border border-gray-700">
              <h3 className="text-xl font-bold text-red-400 mb-2 flex items-center gap-2">
                <span className="text-2xl">❌</span>
                Error
              </h3>
              <p className="text-white mb-4">{errorMessage}</p>
              <button
                onClick={() => setShowError(false)}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-white font-medium transition-all duration-200"
              >
                Aceptar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}