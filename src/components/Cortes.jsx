import { useState, useEffect } from "react";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:8000";
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.headers.common["Accept"] = "application/json";

export default function Cortes() {
  const [tipoTela, setTipoTela] = useState("");
  const [color, setColor] = useState("");
  const [metrosRequeridos, setMetrosRequeridos] = useState("");
  const [rollos, setRollos] = useState([]);
  const [rollosFiltrados, setRollosFiltrados] = useState([]);
  const [rollosSeleccionados, setRollosSeleccionados] = useState([]);
  const [rollosUsados, setRollosUsados] = useState([]);
  const [numerosEditados, setNumerosEditados] = useState({});
  const [resultado, setResultado] = useState(null);

  // Estados para autocompletado
  const [tiposTela, setTiposTela] = useState([]);
  const [colores, setColores] = useState([]);
  const [mostrarSugerenciasTela, setMostrarSugerenciasTela] = useState(false);
  const [mostrarSugerenciasColor, setMostrarSugerenciasColor] = useState(false);
  const [sugerenciasTela, setSugerenciasTela] = useState([]);
  const [sugerenciasColor, setSugerenciasColor] = useState([]);

  useEffect(() => {
    const fetchRollos = async () => {
      try {
        const res = await axios.get("/rollos/");
        setRollos(res.data);
        
        // Extraer tipos de tela únicos
        const tiposUnicos = [...new Set(res.data.map(r => r.tipo_tela).filter(Boolean))];
        setTiposTela(tiposUnicos);
        
        // Extraer colores únicos
        const coloresUnicos = [...new Set(res.data.map(r => r.color).filter(Boolean))];
        setColores(coloresUnicos);
      } catch (error) {
        console.error("Error al obtener rollos:", error);
      }
    };
    fetchRollos();
  }, []);

  const handleTipoTelaChange = (e) => {
    const valor = e.target.value;
    setTipoTela(valor);
    
    if (valor.length > 0) {
      const filtradas = tiposTela.filter(tipo => 
        tipo.toLowerCase().includes(valor.toLowerCase())
      );
      setSugerenciasTela(filtradas);
      setMostrarSugerenciasTela(true);
    } else {
      setMostrarSugerenciasTela(false);
    }
  };

  const handleColorChange = (e) => {
    const valor = e.target.value;
    setColor(valor);
    
    if (valor.length > 0) {
      const filtradas = colores.filter(color => 
        color.toLowerCase().includes(valor.toLowerCase())
      );
      setSugerenciasColor(filtradas);
      setMostrarSugerenciasColor(true);
    } else {
      setMostrarSugerenciasColor(false);
    }
  };

  const seleccionarTipoTela = (tipo) => {
    setTipoTela(tipo);
    setMostrarSugerenciasTela(false);
  };

  const seleccionarColor = (color) => {
    setColor(color);
    setMostrarSugerenciasColor(false);
  };

  const verificarDisponibilidad = () => {
    const disponibles = rollos
      .filter(
        (r) =>
          r.disponible &&
          r.tipo_tela?.toLowerCase().includes(tipoTela.toLowerCase()) &&
          r.color?.toLowerCase().includes(color.toLowerCase())
      )
      .sort((a, b) => parseFloat(b.metraje) - parseFloat(a.metraje));

    const requerido = parseFloat(metrosRequeridos);
    if (isNaN(requerido) || requerido <= 0) {
      setResultado("⚠️ Ingresa una cantidad válida de metros.");
      setRollosFiltrados([]);
      setRollosSeleccionados([]);
      setRollosUsados([]);
      setNumerosEditados({});
      return;
    }

    if (disponibles.length === 0) {
      setResultado("❌ No hay rollos disponibles que coincidan con los filtros.");
      setRollosFiltrados([]);
      setRollosSeleccionados([]);
      setRollosUsados([]);
      setNumerosEditados({});
      return;
    }

    setRollosFiltrados(disponibles);
    setRollosSeleccionados([]);
    setRollosUsados([]);
    setNumerosEditados({});
    setResultado(`Selecciona manualmente los rollos hasta alcanzar al menos ${requerido} metros.`);
  };

  const toggleSeleccion = (rollo) => {
    const yaSeleccionado = rollosSeleccionados.find((r) => r.id === rollo.id);
    let nuevosSeleccionados;

    if (yaSeleccionado) {
      nuevosSeleccionados = rollosSeleccionados.filter((r) => r.id !== rollo.id);
      const nuevosNumeros = { ...numerosEditados };
      delete nuevosNumeros[rollo.id];
      setNumerosEditados(nuevosNumeros);
    } else {
      nuevosSeleccionados = [...rollosSeleccionados, rollo];
      setNumerosEditados((prev) => ({
        ...prev,
        [rollo.id]: rollo.numero_rollo || ""
      }));
    }

    setRollosSeleccionados(nuevosSeleccionados);

    const total = nuevosSeleccionados.reduce((acc, r) => acc + parseFloat(r.metraje), 0);
    if (total >= parseFloat(metrosRequeridos)) {
      setResultado(`✅ Suficiente metraje seleccionado (${total.toFixed(2)} m).`);
      setRollosUsados(nuevosSeleccionados);
    } else {
      setResultado(`❌ Aún no hay suficiente. Seleccionado: ${total.toFixed(2)} m.`);
      setRollosUsados([]);
    }
  };

  const actualizarNumeroRollo = (id, nuevoNumero) => {
    setNumerosEditados((prev) => ({
      ...prev,
      [id]: nuevoNumero
    }));
  };

  const marcarComoNoDisponibles = async () => {
    try {
      for (const rollo of rollosUsados) {
        const numeroEditado = numerosEditados[rollo.id];
        await axios.put(`/rollos/${rollo.id}/`, {
          ...rollo,
          numero_rollo: numeroEditado,
          disponible: false
        });
      }
      setResultado("✅ Rollos marcados como no disponibles.");
      setRollosSeleccionados([]);
      setRollosUsados([]);
      setNumerosEditados({});
      setTipoTela("");
      setColor("");
      setMetrosRequeridos("");
      const res = await axios.get("/rollos/");
      setRollos(res.data);
    } catch (error) {
      console.error("Error al actualizar rollos:", error);
      setResultado(
        `❌ Error al marcar rollos como usados: ${
          error.response?.data?.detail || error.message
        }`
      );
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-900 p-6 text-white">
      <div className="w-full max-w-xl bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
        <h1 className="text-2xl font-bold text-center">Verificar Corte de Tela</h1>

        {/* Campo Tipo de Tela con Autocompletado */}
        <div className="relative">
          <input
            type="text"
            placeholder="Tipo de tela (ej. gabardina)"
            value={tipoTela}
            onChange={handleTipoTelaChange}
            onFocus={() => {
              if (tipoTela.length > 0) {
                setMostrarSugerenciasTela(true);
              }
            }}
            onBlur={() => {
              // Delay para permitir clic en sugerencias
              setTimeout(() => setMostrarSugerenciasTela(false), 200);
            }}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
          />
          {mostrarSugerenciasTela && sugerenciasTela.length > 0 && (
            <div className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-b-lg shadow-lg max-h-40 overflow-y-auto">
              {sugerenciasTela.map((tipo, index) => (
                <div
                  key={index}
                  onClick={() => seleccionarTipoTela(tipo)}
                  className="p-2 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
                >
                  {tipo}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Campo Color con Autocompletado */}
        <div className="relative">
          <input
            type="text"
            placeholder="Color (ej. azul)"
            value={color}
            onChange={handleColorChange}
            onFocus={() => {
              if (color.length > 0) {
                setMostrarSugerenciasColor(true);
              }
            }}
            onBlur={() => {
              // Delay para permitir clic en sugerencias
              setTimeout(() => setMostrarSugerenciasColor(false), 200);
            }}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
          />
          {mostrarSugerenciasColor && sugerenciasColor.length > 0 && (
            <div className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-b-lg shadow-lg max-h-40 overflow-y-auto">
              {sugerenciasColor.map((color, index) => (
                <div
                  key={index}
                  onClick={() => seleccionarColor(color)}
                  className="p-2 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
                >
                  {color}
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          type="number"
          placeholder="Metros requeridos (ej. 150)"
          value={metrosRequeridos}
          onChange={(e) => setMetrosRequeridos(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
        />
        <button
          onClick={verificarDisponibilidad}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold"
        >
          Verificar Disponibilidad
        </button>

        {resultado && (
          <div className="mt-4 text-lg border-t border-gray-600 pt-4">
            {resultado}
          </div>
        )}

        {rollosFiltrados.length > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Selecciona los rollos:</h2>
            <table className="w-full text-sm border border-gray-600">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-2 border border-gray-600">Usar</th>
                  <th className="p-2 border border-gray-600">Número</th>
                  <th className="p-2 border border-gray-600">Lote</th>
                  <th className="p-2 border border-gray-600">Fecha</th>
                  <th className="p-2 border border-gray-600">Metraje</th>
                </tr>
              </thead>
              <tbody>
                {rollosFiltrados.map((r) => (
                  <tr key={r.id} className="border-t border-gray-700">
                    <td className="p-2 border border-gray-600 text-center">
                      <input
                        type="checkbox"
                        checked={rollosSeleccionados.some((sel) => sel.id === r.id)}
                        onChange={() => toggleSeleccion(r)}
                      />
                    </td>
                    <td className="p-2 border border-gray-600">
                      {rollosSeleccionados.some((sel) => sel.id === r.id) ? (
                        <input
                          type="text"
                          value={numerosEditados[r.id] || ""}
                          onChange={(e) => actualizarNumeroRollo(r.id, e.target.value)}
                          className="w-full p-1 bg-gray-700 border border-gray-600 rounded"
                        />
                      ) : (
                        r.numero_rollo || ""
                      )}
                    </td>
                    <td className="p-2 border border-gray-600">{r.lote}</td>
                    <td className="p-2 border border-gray-600">{r.fecha}</td>
                    <td className="p-2 border border-gray-600">{r.metraje} m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rollosUsados.length > 0 && (
          <button
            onClick={marcarComoNoDisponibles}
            className="mt-4 w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-semibold"
          >
            Confirmar y marcar como usados
          </button>
        )}
      </div>
    </div>
  );
}