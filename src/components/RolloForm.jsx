import { useState } from "react";
import axios from "axios";
import { rollosApi } from "../api/rollosApi";

// Configuración base de axios
axios.defaults.baseURL = "http://localhost:8000";
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

export default function FormularioRollo() {
  const [rollo, setRollo] = useState({
    numero_rollo: "",
    lote: "",
    tipo_tela: "",
    color: "",
    fecha: "",
    metraje: "",
    disponible: true
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [isProcessingCSV, setIsProcessingCSV] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setRollo({ ...rollo, [e.target.name]: value });
  };

  const handleSubmit = async () => {
    try {
      await rollosApi.createRollo({
        ...rollo,
        metraje: parseFloat(rollo.metraje),
        disponible: rollo.disponible === true
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
        disponible: true
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
    
    setIsProcessingCSV(true);
    
    try {
      const text = await csvFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Validar headers esperados
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
          disponible: values[6]?.toLowerCase() === 'true' || values[6] === '1'
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
        
        {/* Sección de carga masiva CSV */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
          <h3 className="text-white font-semibold mb-2">Carga Masiva desde CSV</h3>
          <div className="space-y-2">
            <input
              id="csvInput"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
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
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
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