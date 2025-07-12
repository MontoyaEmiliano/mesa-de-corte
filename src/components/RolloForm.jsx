import { useState, useEffect } from "react";
import { rollosApi } from "../api/rollosApi";
import { useParams } from "react-router-dom";

export default function FormularioRollo() {
  const { clienteId } = useParams();
  const [rollo, setRollo] = useState({
    numero_rollo: "",
    lote: "",
    tipo_tela: "",
    color: "",
    fecha: "",
    metraje: "",
    disponible: true,
    cliente_id: clienteId
  });
  const [yardas, setYardas] = useState("");
  const [clientes, setClientes] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [isProcessingCSV, setIsProcessingCSV] = useState(false);
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState("");
  
  // Nuevos estados para agregado masivo
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkQuantity, setBulkQuantity] = useState(1);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Cargar clientes al montar el componente
  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const response = await rollosApi.fetchClientes();
      setClientes(response.data);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      setErrorMessage("Error al cargar la lista de clientes");
      setShowError(true);
    }
  };

  const crearCliente = async () => {
    if (!nuevoCliente.trim()) {
      setErrorMessage("El nombre del cliente es requerido");
      setShowError(true);
      return;
    }

    try {
      const response = await rollosApi.createCliente({
        nombre: nuevoCliente.trim()
      });
      setClientes([...clientes, response.data]);
      setRollo({ ...rollo, cliente_id: response.data.id });
      setNuevoCliente("");
      setShowClienteForm(false);
    } catch (error) {
      console.error("Error al crear cliente:", error);
      setErrorMessage(error.response?.data?.detail || "Error al crear el cliente");
      setShowError(true);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setRollo({ ...rollo, [e.target.name]: value });
  };

  const handleMetrajeChange = (e) => {
    const value = e.target.value;
    setRollo({ ...rollo, metraje: value });
    setYardas(""); // Limpiar yardas cuando se escribe en metros
  };

  const handleYardasChange = (e) => {
    const value = e.target.value;
    setYardas(value);
    setRollo({ ...rollo, metraje: "" }); // Limpiar metros cuando se escribe en yardas
  };

  const convertirYardasAMetros = (yardas) => {
    return parseFloat(yardas) * 0.9144; // 1 yarda = 0.9144 metros
  };

  const handleSubmit = async () => {
    if (!rollo.cliente_id) {
      setErrorMessage("Debe seleccionar un cliente");
      setShowError(true);
      return;
    }

    // Determinar el metraje final
    let metrajeTotal = 0;
    if (yardas) {
      metrajeTotal = convertirYardasAMetros(yardas);
    } else if (rollo.metraje) {
      metrajeTotal = parseFloat(rollo.metraje);
    }

    if (metrajeTotal <= 0) {
      setErrorMessage("Debe ingresar un valor válido en metros o yardas");
      setShowError(true);
      return;
    }

    // Validar cantidad para modo masivo
    if (isBulkMode && (bulkQuantity <= 0 || bulkQuantity > 1000)) {
      setErrorMessage("La cantidad debe ser entre 1 y 1000 rollos");
      setShowError(true);
      return;
    }

    try {
      const rolloData = {
        ...rollo,
        metraje: metrajeTotal,
        disponible: rollo.disponible === true,
        cliente_id: parseInt(rollo.cliente_id)
      };

      if (isBulkMode) {
        // Modo masivo: crear múltiples rollos
        setIsProcessingBulk(true);
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < bulkQuantity; i++) {
          try {
            await rollosApi.createRollo(rolloData);
            successCount++;
          } catch (err) {
            errorCount++;
            console.error(`Error al crear rollo ${i + 1}:`, err);
          }
        }

        setIsProcessingBulk(false);
        
        if (errorCount === 0) {
          setErrorMessage(`Se crearon ${successCount} rollos exitosamente`);
          setShowSuccess(true);
        } else {
          setErrorMessage(`Procesamiento completado. Éxitos: ${successCount}, Errores: ${errorCount}`);
          setShowError(true);
        }
      } else {
        // Modo individual: crear un solo rollo
        await rollosApi.createRollo(rolloData);
        setShowSuccess(true);
      }

      // Resetear formulario
      setRollo({
        numero_rollo: "",
        lote: "",
        tipo_tela: "",
        color: "",
        fecha: "",
        metraje: "",
        disponible: true,
        cliente_id: clienteId || ""
      });
      setYardas("");
      setBulkQuantity(1);
      
    } catch (err) {
      console.error("Error al crear rollo:", err);
      setErrorMessage(err.response?.data?.detail || "Error al agregar el rollo");
      setShowError(true);
      setIsProcessingBulk(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      setErrorMessage("Por favor selecciona un archivo CSV válido");
      setShowError(true);
    }
  };

  const processCSV = async () => {
    if (!csvFile) return;
    
    if (!rollo.cliente_id) {
      setErrorMessage("Debe seleccionar un cliente antes de procesar el CSV");
      setShowError(true);
      return;
    }
    
    setIsProcessingCSV(true);
    
    try {
      const text = await csvFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Validar headers esperados (con soporte para yardas)
      const expectedHeaders = ['numero_rollo', 'lote', 'tipo_tela', 'color', 'fecha', 'metraje', 'disponible'];
      const hasValidHeaders = expectedHeaders.every(header => 
        headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
      );
      
      // Buscar si hay columna de yardas
      const yardasIndex = headers.findIndex(h => h.toLowerCase().includes('yarda'));
      const metrajeIndex = headers.findIndex(h => h.toLowerCase().includes('metraje'));
      
      if (!hasValidHeaders && yardasIndex === -1) {
        throw new Error("El CSV debe contener las columnas: numero_rollo, lote, tipo_tela, color, fecha, metraje/yardas, disponible");
      }
      
      const rollos = [];
      
      // Procesar cada línea (saltando el header)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim());
        
        // Determinar el metraje
        let metrajeTotal = 0;
        if (yardasIndex !== -1 && values[yardasIndex]) {
          metrajeTotal = convertirYardasAMetros(parseFloat(values[yardasIndex]) || 0);
        } else if (metrajeIndex !== -1 && values[metrajeIndex]) {
          metrajeTotal = parseFloat(values[metrajeIndex]) || 0;
        } else {
          metrajeTotal = parseFloat(values[5]) || 0; // Fallback al índice 5
        }
        
        const rolloData = {
          numero_rollo: values[0] || "",
          lote: values[1] || "",
          tipo_tela: values[2] || "",
          color: values[3] || "",
          fecha: values[4] || "",
          metraje: metrajeTotal,
          disponible: values[6]?.toLowerCase() === 'true' || values[6] === '1',
          cliente_id: parseInt(rollo.cliente_id)
        };
        
        rollos.push(rolloData);
      }
      
      // Enviar cada rollo al servidor
      let successCount = 0;
      let errorCount = 0;
      
      for (const rolloData of rollos) {
        try {
          await rollosApi.createRollo(rolloData);
          successCount++;
        } catch (err) {
          errorCount++;
          console.error("Error al procesar rollo:", rolloData, err);
        }
      }
      
      setErrorMessage(`Procesamiento completado. Éxitos: ${successCount}, Errores: ${errorCount}`);
      if (errorCount === 0) {
        setShowSuccess(true);
      } else {
        setShowError(true);
      }
      
      // Limpiar el archivo
      setCsvFile(null);
      document.getElementById('csvInput').value = '';
      
    } catch (err) {
      console.error("Error al procesar CSV:", err);
      setErrorMessage(err.message || "Error al procesar el archivo CSV");
      setShowError(true);
    } finally {
      setIsProcessingCSV(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-start pt-16 justify-center bg-gray-900 p-4">
      <div className="space-y-4 max-w-md w-full relative">
        <h1 className="text-2xl font-bold text-white text-center">Agregar Rollo</h1>
        
        {/* Selector de Cliente */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
          <label className="block text-white font-semibold mb-2">Cliente *</label>
          <div className="flex gap-2">
            <select
              name="cliente_id"
              value={rollo.cliente_id}
              onChange={handleChange}
              className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selector de Modo de Agregado */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
          <label className="block text-white font-semibold mb-2">Modo de Agregado</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                checked={!isBulkMode}
                onChange={() => setIsBulkMode(false)}
                className="text-blue-600"
              />
              <span className="text-white">Individual</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                checked={isBulkMode}
                onChange={() => setIsBulkMode(true)}
                className="text-blue-600"
              />
              <span className="text-white">Masivo</span>
            </label>
          </div>
          
          {isBulkMode && (
            <div className="mt-3">
              <label className="block text-white text-sm mb-1">Cantidad de rollos a crear</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={bulkQuantity}
                onChange={(e) => setBulkQuantity(parseInt(e.target.value) || 1)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="Ej: 50"
              />
              <p className="text-gray-400 text-xs mt-1">
                Se crearán {bulkQuantity} rollos idénticos con los datos especificados
              </p>
            </div>
          )}
        </div>

        {/* Sección de carga masiva CSV */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
          <h3 className="text-white font-semibold mb-2">Carga Masiva desde CSV</h3>
          <p className="text-gray-400 text-sm mb-2">
            Seleccione primero un cliente. Todos los rollos del CSV se asignarán a ese cliente.
            El CSV puede contener una columna 'metraje' o 'yardas' (se convertirá automáticamente).
          </p>
          <div className="space-y-2">
            <input
              id="csvInput"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={!rollo.cliente_id}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50"
            />
            {csvFile && (
              <div className="flex items-center gap-2">
                <span className="text-green-400 text-sm">Archivo seleccionado: {csvFile.name}</span>
                <button
                  onClick={processCSV}
                  disabled={isProcessingCSV}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-white text-sm"
                >
                  {isProcessingCSV ? "Procesando..." : "Procesar CSV"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Divisor visual */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-600"></div>
          <span className="text-gray-400 text-sm">
            {isBulkMode ? "Datos del rollo base" : "O agregar individualmente"}
          </span>
          <div className="flex-1 h-px bg-gray-600"></div>
        </div>
        
        {/* Formulario individual */}
        {/* Campo lote con placeholder "factura" */}
        <input
          name="lote"
          type="text"
          placeholder="factura"
          value={rollo.lote}
          onChange={handleChange}
          className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
        />
        
        {/* Resto de campos */}
        {["tipo_tela", "color", "fecha"].map((campo) => (
          <input
            key={campo}
            name={campo}
            type={campo === "fecha" ? "date" : "text"}
            placeholder={campo.replace("_", " ")}
            value={rollo[campo]}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
          />
        ))}
        
        {/* Campos de medidas */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-white text-sm mb-1">Metros</label>
            <input
              type="number"
              step="0.01"
              placeholder="Metraje"
              value={rollo.metraje}
              onChange={handleMetrajeChange}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-white text-sm mb-1">Yardas</label>
            <input
              type="number"
              step="0.01"
              placeholder="Yardas"
              value={yardas}
              onChange={handleYardasChange}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
            />
          </div>
        </div>
        
        {/* Mostrar conversión */}
        {yardas && (
          <p className="text-green-400 text-sm text-center">
            {parseFloat(yardas).toFixed(2)} yardas = {convertirYardasAMetros(yardas).toFixed(2)} metros
          </p>
        )}
        
        {/* Mostrar información del modo masivo */}
        {isBulkMode && bulkQuantity > 1 && (
          <div className="bg-blue-900 bg-opacity-50 p-3 rounded border border-blue-600">
            <p className="text-blue-300 text-sm">
              🔢 Se crearán <strong>{bulkQuantity} rollos</strong> con los datos especificados
            </p>
            <p className="text-blue-300 text-xs mt-1">
              Total de metraje: {(yardas ? convertirYardasAMetros(yardas) : parseFloat(rollo.metraje) || 0) * bulkQuantity} metros
            </p>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="disponible"
            name="disponible"
            checked={rollo.disponible}
            onChange={handleChange}
            className="h-5 w-5"
          />
          <label htmlFor="disponible" className="text-white">
            Disponible
          </label>
        </div>
        
        <button 
          onClick={handleSubmit} 
          disabled={!rollo.cliente_id || isProcessingBulk}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white"
        >
          {isProcessingBulk ? (
            `Creando rollos... (${bulkQuantity})`
          ) : (
            isBulkMode ? `Crear ${bulkQuantity} Rollos` : "Agregar Rollo"
          )}
        </button>

        {showSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full">
              <h3 className="text-xl font-bold text-green-500 mb-2">¡Éxito!</h3>
              <p className="text-white mb-4">Rollo(s) agregado(s) correctamente</p>
              <button
                onClick={() => setShowSuccess(false)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
              >
                Aceptar
              </button>
            </div>
          </div>
        )}

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
    </div>
  );
}