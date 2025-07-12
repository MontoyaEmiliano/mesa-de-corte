import { useState, useEffect } from "react";
import { rollosApi } from "../api/rollosApi";
import { useParams } from "react-router-dom";

export default function Cortes() {
  const { clienteId } = useParams();
  const [tipoTela, setTipoTela] = useState("");
  const [color, setColor] = useState("");
  const [metrosRequeridos, setMetrosRequeridos] = useState("");
  const [rollos, setRollos] = useState([]);
  const [rollosFiltrados, setRollosFiltrados] = useState([]);
  const [rollosSeleccionados, setRollosSeleccionados] = useState([]);
  const [rollosUsados, setRollosUsados] = useState([]);
  const [numerosEditados, setNumerosEditados] = useState({});
  const [restosLimpios, setRestosLimpios] = useState({});
  const [restosSucios, setRestosSucios] = useState({});
  const [resultado, setResultado] = useState(null);
  const [erroresValidacion, setErroresValidacion] = useState({});

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
        const res = await rollosApi.fetchRollos(clienteId);
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
  }, [clienteId]);

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

  // Función para validar que los restos no excedan el metraje disponible del rollo
  const validarRestos = (rolloId, restoLimpio, restoSucio) => {
    const rollo = rollos.find(r => r.id === rolloId);
    if (!rollo) return false;
    
    const totalRestos = parseFloat(restoLimpio || 0) + parseFloat(restoSucio || 0);
    // Usar resto limpio si existe, sino el metraje completo
    const metrosDisponibles = parseFloat(rollo.resto_limpio) > 0 ? parseFloat(rollo.resto_limpio) : parseFloat(rollo.metraje);
    
    return totalRestos <= metrosDisponibles;
  };

  const verificarDisponibilidad = () => {
    // Validar que todos los campos estén llenos
    if (!tipoTela.trim()) {
      setResultado("⚠️ Por favor, ingresa el tipo de tela.");
      setRollosFiltrados([]);
      setRollosSeleccionados([]);
      setRollosUsados([]);
      setNumerosEditados({});
      setRestosLimpios({});
      setRestosSucios({});
      return;
    }

    if (!color.trim()) {
      setResultado("⚠️ Por favor, ingresa el color.");
      setRollosFiltrados([]);
      setRollosSeleccionados([]);
      setRollosUsados([]);
      setNumerosEditados({});
      setRestosLimpios({});
      setRestosSucios({});
      return;
    }

    const requerido = parseFloat(metrosRequeridos);
    if (!metrosRequeridos.trim() || isNaN(requerido) || requerido <= 0) {
      setResultado("⚠️ Por favor, ingresa una cantidad válida de metros.");
      setRollosFiltrados([]);
      setRollosSeleccionados([]);
      setRollosUsados([]);
      setNumerosEditados({});
      setRestosLimpios({});
      setRestosSucios({});
      return;
    }

    const disponibles = rollos
      .filter(
        (r) =>
          r.disponible &&
          r.tipo_tela?.toLowerCase().includes(tipoTela.toLowerCase()) &&
          r.color?.toLowerCase().includes(color.toLowerCase())
      )
      .sort((a, b) => parseFloat(b.metraje) - parseFloat(a.metraje));

    if (disponibles.length === 0) {
      setResultado("❌ No hay rollos disponibles que coincidan con los filtros.");
      setRollosFiltrados([]);
      setRollosSeleccionados([]);
      setRollosUsados([]);
      setNumerosEditados({});
      setRestosLimpios({});
      setRestosSucios({});
      return;
    }

    // Calcular suma total de metros disponibles (considerando resto limpio disponible)
    const totalMetrosDisponibles = disponibles.reduce((acc, r) => {
      // Si el rollo tiene resto limpio > 0, usamos ese valor, sino el metraje completo
      const metrosUsables = parseFloat(r.resto_limpio) > 0 ? parseFloat(r.resto_limpio) : parseFloat(r.metraje);
      return acc + metrosUsables;
    }, 0);
    
    setRollosFiltrados(disponibles);
    setRollosSeleccionados([]);
    setRollosUsados([]);
    setNumerosEditados({});
    setRestosLimpios({});
    setRestosSucios({});
    setErroresValidacion({});
    
    // Mostrar resultado con información completa
    const suficiente = totalMetrosDisponibles >= requerido;
    const icono = suficiente ? "✅" : "⚠️";
    const estado = suficiente ? "Suficiente disponible" : "No hay suficientes metros";
    
    setResultado(
      `${icono} ${estado} - Total disponible: ${totalMetrosDisponibles.toFixed(2)} m | Requerido: ${requerido} m | Rollos encontrados: ${disponibles.length}`
    );
  };

  const toggleSeleccion = (rollo) => {
    const yaSeleccionado = rollosSeleccionados.find((r) => r.id === rollo.id);
    let nuevosSeleccionados;

    if (yaSeleccionado) {
      nuevosSeleccionados = rollosSeleccionados.filter((r) => r.id !== rollo.id);
      const nuevosNumeros = { ...numerosEditados };
      const nuevosRestosLimpios = { ...restosLimpios };
      const nuevosRestosSucios = { ...restosSucios };
      const nuevosErrores = { ...erroresValidacion };
      delete nuevosNumeros[rollo.id];
      delete nuevosRestosLimpios[rollo.id];
      delete nuevosRestosSucios[rollo.id];
      delete nuevosErrores[rollo.id];
      setNumerosEditados(nuevosNumeros);
      setRestosLimpios(nuevosRestosLimpios);
      setRestosSucios(nuevosRestosSucios);
      setErroresValidacion(nuevosErrores);
    } else {
      nuevosSeleccionados = [...rollosSeleccionados, rollo];
      setNumerosEditados((prev) => ({
        ...prev,
        [rollo.id]: rollo.numero_rollo || ""
      }));
      setRestosLimpios((prev) => ({
        ...prev,
        [rollo.id]: rollo.resto_limpio || 0
      }));
      setRestosSucios((prev) => ({
        ...prev,
        [rollo.id]: rollo.resto_sucio || 0
      }));
    }

    setRollosSeleccionados(nuevosSeleccionados);

    // Calcular total considerando metros usables (resto limpio si existe, sino metraje completo)
    const total = nuevosSeleccionados.reduce((acc, r) => {
      const metrosUsables = parseFloat(r.resto_limpio) > 0 ? parseFloat(r.resto_limpio) : parseFloat(r.metraje);
      return acc + metrosUsables;
    }, 0);
    
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

  const actualizarRestoLimpio = (id, nuevoResto) => {
    const valorNumerico = parseFloat(nuevoResto) || 0;
    setRestosLimpios((prev) => ({
      ...prev,
      [id]: valorNumerico
    }));
    
    // Validar restos
    const restoSucio = restosSucios[id] || 0;
    if (!validarRestos(id, valorNumerico, restoSucio)) {
      setErroresValidacion((prev) => ({
        ...prev,
        [id]: 'La suma de restos no puede ser mayor al metraje del rollo'
      }));
    } else {
      setErroresValidacion((prev) => {
        const nuevosErrores = { ...prev };
        delete nuevosErrores[id];
        return nuevosErrores;
      });
    }
  };

  const actualizarRestoSucio = (id, nuevoResto) => {
    const valorNumerico = parseFloat(nuevoResto) || 0;
    setRestosSucios((prev) => ({
      ...prev,
      [id]: valorNumerico
    }));
    
    // Validar restos
    const restoLimpio = restosLimpios[id] || 0;
    if (!validarRestos(id, restoLimpio, valorNumerico)) {
      setErroresValidacion((prev) => ({
        ...prev,
        [id]: 'La suma de restos no puede ser mayor al metraje del rollo'
      }));
    } else {
      setErroresValidacion((prev) => {
        const nuevosErrores = { ...prev };
        delete nuevosErrores[id];
        return nuevosErrores;
      });
    }
  };

  const marcarComoNoDisponibles = async () => {
    // Validar que no haya errores antes de procesar
    if (Object.keys(erroresValidacion).length > 0) {
      setResultado("❌ Hay errores en los restos. Por favor, corrígelos antes de continuar.");
      return;
    }

    try {
      for (const rollo of rollosUsados) {
        const numeroEditado = numerosEditados[rollo.id];
        const restoLimpio = restosLimpios[rollo.id] || 0;
        const restoSucio = restosSucios[rollo.id] || 0;
        
        // Si el resto limpio es mayor a 15m, mantener el rollo disponible
        if (restoLimpio > 15) {
          await rollosApi.updateRollo(rollo.id, {
            ...rollo,
            numero_rollo: numeroEditado,
            // MANTENER metraje original
            metraje: rollo.metraje,
            disponible: true, // Mantener disponible
            cliente_id: clienteId,
            resto_limpio: restoLimpio, // Guardar resto limpio para futuros usos
            resto_sucio: restoSucio
          });
        } else {
          // Si el resto limpio es 15m o menor, marcar como no disponible
          await rollosApi.updateRollo(rollo.id, {
            ...rollo,
            numero_rollo: numeroEditado,
            disponible: false,
            cliente_id: clienteId,
            resto_limpio: restoLimpio,
            resto_sucio: restoSucio
          });
        }
      }
      
      // Contar cuántos rollos siguieron disponibles
      const rollosMantenidos = rollosUsados.filter(rollo => (restosLimpios[rollo.id] || 0) > 15);
      const rollosEliminados = rollosUsados.filter(rollo => (restosLimpios[rollo.id] || 0) <= 15);
      
      let mensajeResultado = "✅ Procesamiento completado. ";
      if (rollosEliminados.length > 0) {
        mensajeResultado += `${rollosEliminados.length} rollo(s) marcado(s) como no disponible(s). `;
      }
      if (rollosMantenidos.length > 0) {
        mensajeResultado += `${rollosMantenidos.length} rollo(s) mantenido(s) disponible(s) con resto limpio aprovechable.`;
      }
      
      setResultado(mensajeResultado);
      setRollosSeleccionados([]);
      setRollosUsados([]);
      setNumerosEditados({});
      setRestosLimpios({});
      setRestosSucios({});
      setErroresValidacion({});
      setTipoTela("");
      setColor("");
      setMetrosRequeridos("");
      
      // Refrescar la lista de rollos
      const res = await rollosApi.fetchRollos(clienteId);
      setRollos(res.data);
      setRollosFiltrados([]);
    } catch (error) {
      console.error("Error al actualizar rollos:", error);
      setResultado(
        `❌ Error al procesar rollos: ${
          error.response?.data?.detail || error.message
        }`
      );
    }
  };

  // Verificar si hay errores de validación o si el botón debe estar deshabilitado
  const hayErrores = Object.keys(erroresValidacion).length > 0;

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-900 p-6 text-white">
      <div className="w-full max-w-6xl bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
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
          disabled={!tipoTela.trim() || !color.trim() || !metrosRequeridos.trim() || parseFloat(metrosRequeridos) <= 0}
          className={`w-full px-4 py-2 rounded font-semibold ${
            !tipoTela.trim() || !color.trim() || !metrosRequeridos.trim() || parseFloat(metrosRequeridos) <= 0
              ? 'bg-gray-600 cursor-not-allowed text-gray-400'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Verificar Disponibilidad
        </button>

        {resultado && (
          <div className="mt-4 text-lg border-t border-gray-600 pt-4">
            {resultado}
          </div>
        )}

        {rollosFiltrados.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <h2 className="text-lg font-semibold mb-2">Selecciona los rollos:</h2>
            <div className="mb-2 text-sm text-yellow-400">
              💡 Tip: Si el resto limpio es mayor a 15m, el rollo seguirá disponible con el nuevo metraje
            </div>
            <table className="w-full text-sm border border-gray-600">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-2 border border-gray-600">Usar</th>
                  <th className="p-2 border border-gray-600">Número</th>
                  <th className="p-2 border border-gray-600">Factura</th>
                  <th className="p-2 border border-gray-600">Fecha</th>
                  <th className="p-2 border border-gray-600">Metraje</th>
                  <th className="p-2 border border-gray-600">Resto Limpio</th>
                  <th className="p-2 border border-gray-600">Resto Sucio</th>
                </tr>
              </thead>
              <tbody>
                {rollosFiltrados.map((r) => {
                  const estaSeleccionado = rollosSeleccionados.some((sel) => sel.id === r.id);
                  const hayError = erroresValidacion[r.id];
                  const restoLimpio = restosLimpios[r.id] || 0;
                  const esReutilizable = restoLimpio > 15;
                  
                  return (
                    <tr key={r.id} className={`border-t border-gray-700 ${hayError ? 'bg-red-900 bg-opacity-20' : ''}`}>
                      <td className="p-2 border border-gray-600 text-center">
                        <input
                          type="checkbox"
                          checked={estaSeleccionado}
                          onChange={() => toggleSeleccion(r)}
                        />
                      </td>
                      <td className="p-2 border border-gray-600">
                        {estaSeleccionado ? (
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
                      <td className="p-2 border border-gray-600">
                        {estaSeleccionado ? (
                          <div className="space-y-1">
                            <input
                              type="number"
                              step="0.01"
                              value={restosLimpios[r.id] || ""}
                              onChange={(e) => actualizarRestoLimpio(r.id, e.target.value)}
                              className={`w-full p-1 bg-gray-700 border rounded ${
                                hayError ? 'border-red-500' : 'border-gray-600'
                              }`}
                              placeholder="0.00"
                            />
                            {esReutilizable && (
                              <div className="text-xs text-green-400">
                                ♻️ Seguirá disponible
                              </div>
                            )}
                          </div>
                        ) : (
                          `${r.resto_limpio || 0} m`
                        )}
                      </td>
                      <td className="p-2 border border-gray-600">
                        {estaSeleccionado ? (
                          <div className="space-y-1">
                            <input
                              type="number"
                              step="0.01"
                              value={restosSucios[r.id] || ""}
                              onChange={(e) => actualizarRestoSucio(r.id, e.target.value)}
                              className={`w-full p-1 bg-gray-700 border rounded ${
                                hayError ? 'border-red-500' : 'border-gray-600'
                              }`}
                              placeholder="0.00"
                            />
                            {hayError && (
                              <div className="text-xs text-red-400">
                                ⚠️ {hayError}
                              </div>
                            )}
                          </div>
                        ) : (
                          `${r.resto_sucio || 0} m`
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {rollosUsados.length > 0 && (
          <button
            onClick={marcarComoNoDisponibles}
            disabled={hayErrores}
            className={`mt-4 w-full px-4 py-2 rounded font-semibold ${
              hayErrores 
                ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {hayErrores ? 'Corrige los errores para continuar' : 'Confirmar y procesar rollos'}
          </button>
        )}
      </div>
    </div>
  );
}