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
      // Resetear formulario...
    } catch (err) {
      console.error("Error al crear rollo:", err);
      setErrorMessage(err.response?.data?.detail || "Error al agregar el rollo");
      setShowError(true);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-start pt-16 justify-center bg-gray-900 p-4">
      <div className="space-y-4 max-w-md w-full relative">
        <h1 className="text-2xl font-bold text-white text-center">Agregar Rollo</h1>
        
        {["numero_orden", "lote", "tipo_tela", "color", "fecha", "metraje"].map((campo) => (
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
              <p className="text-white mb-4">Rollo agregado correctamente</p>
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