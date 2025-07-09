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
  const [clientes, setClientes] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [isProcessingCSV, setIsProcessingCSV] = useState(false);
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState("");

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

  const handleSubmit = async () => {
    if (!rollo.cliente_id) {
      setErrorMessage("Debe seleccionar un cliente");
      setShowError(true);
      return;
    }

    try {
      await rollosApi.createRollo({
        ...rollo,
        metraje: parseFloat(rollo.metraje),
        disponible: rollo.disponible === true,
        cliente_id: parseInt(rollo.cliente_id)
      });
      setShowSuccess(true);
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
    } catch (err) {
      console.error("Error al crear rollo:", err);
      setErrorMessage(err.response?.data?.detail || "Error al agregar el rollo");
      setShowError(true);
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
      
      // Validar headers esperados (sin cliente_id porque se toma del formulario)
      const expectedHeaders = ['numero_rollo', 'lote', 'tipo_tela', 'color', 'fecha', 'metraje', 'disponible'];
      const hasValidHeaders = expectedHeaders.every(header => 
        headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
      );
      
      if (!hasValidHeaders) {
        throw new Error("El CSV debe contener las columnas: numero_rollo, lote, tipo_tela, color, fecha, metraje, disponible");
      }
      
      const rollos = [];
      
      // Procesar cada línea (saltando el header)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim());
        
        const rolloData = {
          numero_rollo: values[0] || "",
          lote: values[1] || "",
          tipo_tela: values[2] || "",
          color: values[3] || "",
          fecha: values[4] || "",
          metraje: parseFloat(values[5]) || 0,
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
            <button
              onClick={() => setShowClienteForm(true)}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm"
            >
              Nuevo
            </button>
          </div>
        </div>

        {/* Formulario para nuevo cliente */}
        {showClienteForm && (
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
            <h3 className="text-white font-semibold mb-2">Crear Nuevo Cliente</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nombre del cliente"
                value={nuevoCliente}
                onChange={(e) => setNuevoCliente(e.target.value)}
                className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
              <button
                onClick={crearCliente}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
              >
                Crear
              </button>
              <button
                onClick={() => {
                  setShowClienteForm(false);
                  setNuevoCliente("");
                }}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
        
        {/* Sección de carga masiva CSV */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
          <h3 className="text-white font-semibold mb-2">Carga Masiva desde CSV</h3>
          <p className="text-gray-400 text-sm mb-2">
            Seleccione primero un cliente. Todos los rollos del CSV se asignarán a ese cliente.
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
          <span className="text-gray-400 text-sm">O agregar individualmente</span>
          <div className="flex-1 h-px bg-gray-600"></div>
        </div>
        
        {/* Formulario individual */}
        {["numero_rollo", "lote", "tipo_tela", "color", "fecha", "metraje"].map((campo) => (
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
          disabled={!rollo.cliente_id}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white"
        >
          Agregar Rollo
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