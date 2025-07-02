import { useEffect, useState } from "react";
import axios from "axios";

export default function ListaRollos() {
  const [rollos, setRollos] = useState([]);
  const [editando, setEditando] = useState(null);
  const [rolloEditado, setRolloEditado] = useState({});

  useEffect(() => {
    cargarRollos();
  }, []);

  const cargarRollos = () => {
    axios.get("http://localhost:8001/rollos/")
      .then((res) => setRollos(res.data))
      .catch((err) => console.error("Error al obtener rollos", err));
  };

  const eliminarRollo = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este rollo?")) {
      try {
        await axios.delete(`http://localhost:8001/rollos/${id}/`);
        alert("Rollo eliminado correctamente");
        cargarRollos(); // Recargar la lista
      } catch (err) {
        alert("Error al eliminar el rollo");
        console.error(err);
      }
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
      alert("Rollo actualizado correctamente");
      setEditando(null);
      setRolloEditado({});
      cargarRollos(); // Recargar la lista
    } catch (err) {
      alert("Error al actualizar el rollo");
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    setRolloEditado({
      ...rolloEditado,
      [e.target.name]: e.target.value
    });
  };

  return (
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
          {rollos.map((rollo, i) => (
            <tr key={rollo.id} className="border-t border-gray-700 hover:bg-gray-800/50">
              <td className="p-3">{i + 1}</td>
              
              {editando === rollo.id ? (
                // Modo edición
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
                // Modo vista
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
      
      {rollos.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No hay rollos registrados
        </div>
      )}
    </div>
  );
}