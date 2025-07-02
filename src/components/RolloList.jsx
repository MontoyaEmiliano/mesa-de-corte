import { useEffect, useState } from "react";
import axios from "axios";

export default function ListaRollos() {
  const [rollos, setRollos] = useState([]);
  const [rollosFiltrados, setRollosFiltrados] = useState([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [ordenarPor, setOrdenarPor] = useState("id");
  const [direccionOrden, setDireccionOrden] = useState("asc");
  const [editando, setEditando] = useState(null);
  const [rolloEditado, setRolloEditado] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [rolloAEliminar, setRolloAEliminar] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    cargarRollos();
  }, []);

  useEffect(() => {
    filtrarRollos();
  }, [rollos, terminoBusqueda, ordenarPor, direccionOrden]);

  const cargarRollos = () => {
    axios.get("http://localhost:8001/rollos/")
      .then((res) => setRollos(res.data))
      .catch((err) => {
        setErrorMessage("Error al obtener rollos");
        setShowError(true);
        console.error("Error al obtener rollos", err);
      });
  };

  const filtrarRollos = () => {
    let resultados = [...rollos];

    if (terminoBusqueda.trim()) {
      const termino = terminoBusqueda.toLowerCase();
      resultados = resultados.filter(rollo => {
        const campos = [
          rollo.numero_rollo?.toString(),
          rollo.lote,
          rollo.tipo_tela,
          rollo.color,
          rollo.metraje?.toString(),
          rollo.fecha
        ];

        let formatosFecha = [];
        if (rollo.fecha) {
          formatosFecha = transformarFecha(rollo.fecha);
        }

        const todosCampos = [...campos, ...formatosFecha];

        return todosCampos.some(campo =>
          campo && campo.toString().toLowerCase().includes(termino)
        );
      });
    }

    resultados.sort((a, b) => {
      const campoA = ordenarPor === "fecha" ? new Date(a.fecha) : a.id;
      const campoB = ordenarPor === "fecha" ? new Date(b.fecha) : b.id;

      if (campoA < campoB) return direccionOrden === "asc" ? -1 : 1;
      if (campoA > campoB) return direccionOrden === "asc" ? 1 : -1;
      return 0;
    });

    setRollosFiltrados(resultados);
  };

  const transformarFecha = (fecha) => {
    const formatos = [];
    try {
      const fechaStr = fecha.toString();
      if (fechaStr.match(/^\d{4}-\d{1,2}-\d{1,2}/)) {
        const [año, mes, dia] = fechaStr.split('-');
        const mesNorm = mes.padStart(2, '0');
        const diaNorm = dia.padStart(2, '0');
        formatos.push(
          `${diaNorm}/${mesNorm}/${año}`,
          `${diaNorm}/${mesNorm}`,
          `${parseInt(diaNorm)}/${parseInt(mesNorm)}/${año}`,
          `${parseInt(diaNorm)}/${parseInt(mesNorm)}`,
          año,
          mesNorm,
          diaNorm,
          parseInt(mesNorm).toString(),
          parseInt(diaNorm).toString()
        );
      } else {
        const fechaObj = new Date(fecha);
        if (!isNaN(fechaObj.getTime())) {
          const año = fechaObj.getFullYear().toString();
          const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
          const dia = fechaObj.getDate().toString().padStart(2, '0');
          formatos.push(
            `${dia}/${mes}/${año}`,
            `${dia}/${mes}`,
            `${parseInt(dia)}/${parseInt(mes)}/${año}`,
            `${parseInt(dia)}/${parseInt(mes)}`,
            año, mes, dia,
            parseInt(mes).toString(),
            parseInt(dia).toString()
          );
        }
      }
    } catch (error) {
      console.log('Error transformando fecha:', error);
    }
    return formatos;
  };

  const limpiarBusqueda = () => setTerminoBusqueda("");

  const eliminarRollo = (id) => {
    setRolloAEliminar(id);
    setShowDeleteConfirm(true);
  };

  const confirmarEliminacion = async () => {
    try {
      await axios.delete(`http://localhost:8001/rollos/${rolloAEliminar}/`);
      setSuccessMessage("Rollo eliminado correctamente");
      setShowSuccess(true);
      cargarRollos();
    } catch (err) {
      setErrorMessage("Error al eliminar el rollo");
      setShowError(true);
      console.error(err);
    } finally {
      setShowDeleteConfirm(false);
      setRolloAEliminar(null);
    }
  };

  const iniciarEdicion = (rollo) => {
    setEditando(rollo.id);
    setRolloEditado({ ...rollo });
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setRolloEditado({});
  };

  const guardarEdicion = async () => {
    try {
      await axios.put(`http://localhost:8001/rollos/${editando}/`, {
        ...rolloEditado,
        metraje: parseFloat(rolloEditado.metraje),
      });
      setSuccessMessage("Rollo actualizado correctamente");
      setShowSuccess(true);
      setEditando(null);
      setRolloEditado({});
      cargarRollos();
    } catch (err) {
      setErrorMessage("Error al actualizar el rollo");
      setShowError(true);
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    setRolloEditado({
      ...rolloEditado,
      [e.target.name]: e.target.value
    });
  };

  const handleBusquedaChange = (e) => setTerminoBusqueda(e.target.value);

  return (
    <div className="p-4">
      {/* Barra de búsqueda */}
      <div className="mb-4 flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por número, lote, tipo de tela, color o fecha..."
            value={terminoBusqueda}
            onChange={handleBusquedaChange}
            className="w-full p-3 pl-10 bg-gray-800 border border-gray-600 rounded-lg text-white"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {terminoBusqueda && (
          <button
            onClick={limpiarBusqueda}
            className="px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Controles de ordenamiento */}
      <div className="mb-4 flex gap-4 items-center">
        <label className="text-white">Ordenar por:</label>
        <select
          value={ordenarPor}
          onChange={(e) => setOrdenarPor(e.target.value)}
          className="bg-gray-800 text-white border border-gray-600 rounded p-2"
        >
          <option value="id">ID</option>
          <option value="fecha">Fecha</option>
        </select>
        <button
          onClick={() => setDireccionOrden(prev => (prev === "asc" ? "desc" : "asc"))}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
        >
          {direccionOrden === "asc" ? "Ascendente ↑" : "Descendente ↓"}
        </button>
      </div>

      {/* Información de resultados */}
      {terminoBusqueda && (
        <div className="mb-3 text-sm text-gray-400">
          {rollosFiltrados.length === 0 
            ? "No se encontraron rollos que coincidan con la búsqueda"
            : `Mostrando ${rollosFiltrados.length} de ${rollos.length} rollos`
          }
        </div>
      )}

      {/* Tabla de rollos */}
      <div className="overflow-x-auto">
        <table className="w-full text-left mt-4 border border-gray-600">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Número</th>
              <th className="p-3">Lote</th>
              <th className="p-3">Tipo Tela</th>
              <th className="p-3">Color</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Metraje</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rollosFiltrados.map((rollo, i) => (
              <tr key={rollo.id} className="border-t border-gray-700 hover:bg-gray-800/50">
                <td className="p-3">{i + 1}</td>
                
                {editando === rollo.id ? (
                  <>
                    <td className="p-2">
                      <input
                        type="text"
                        name="numero_rollo"
                        value={rolloEditado.numero_rollo || ''}
                        onChange={handleInputChange}
                        className="w-full p-1 bg-gray-700 border border-gray-600 rounded text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="lote"
                        value={rolloEditado.lote || ''}
                        onChange={handleInputChange}
                        className="w-full p-1 bg-gray-700 border border-gray-600 rounded text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="tipo_tela"
                        value={rolloEditado.tipo_tela || ''}
                        onChange={handleInputChange}
                        className="w-full p-1 bg-gray-700 border border-gray-600 rounded text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="color"
                        value={rolloEditado.color || ''}
                        onChange={handleInputChange}
                        className="w-full p-1 bg-gray-700 border border-gray-600 rounded text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        name="fecha"
                        value={rolloEditado.fecha || ''}
                        onChange={handleInputChange}
                        className="w-full p-1 bg-gray-700 border border-gray-600 rounded text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        name="metraje"
                        value={rolloEditado.metraje || ''}
                        onChange={handleInputChange}
                        className="w-full p-1 bg-gray-700 border border-gray-600 rounded text-sm"
                        step="0.1"
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button
                          onClick={guardarEdicion}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
                        >
                          ✓
                        </button>
                        <button
                          onClick={cancelarEdicion}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3">{rollo.numero_rollo}</td>
                    <td className="p-3">{rollo.lote}</td>
                    <td className="p-3">{rollo.tipo_tela}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-gray-700 rounded-full text-sm">
                        {rollo.color}
                      </span>
                    </td>
                    <td className="p-3">{rollo.fecha}</td>
                    <td className="p-3">{rollo.metraje} m</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => iniciarEdicion(rollo)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarRollo(rollo.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {rollosFiltrados.length === 0 && rollos.length > 0 && terminoBusqueda && (
          <div className="text-center py-8 text-gray-400">
            No se encontraron rollos que coincidan con "<span className="text-white">{terminoBusqueda}</span>"
          </div>
        )}
        
        {rollos.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No hay rollos registrados
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-xl font-bold text-yellow-500 mb-2">Confirmar eliminación</h3>
            <p className="text-white mb-4">¿Estás seguro de que quieres eliminar este rollo?</p>
            <div className="flex gap-3">
              <button
                onClick={confirmarEliminacion}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
              >
                Eliminar
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRolloAEliminar(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-xl font-bold text-green-500 mb-2">¡Éxito!</h3>
            <p className="text-white mb-4">{successMessage}</p>
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* Modal de error */}
      {showError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-xl font-bold text-red-500 mb-2">Error</h3>
            <p className="text-white mb-4">{errorMessage}</p>
            <button
              onClick={() => setShowError(false)}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}