import { useState } from "react";
import axios from "axios";

export default function FormularioRollo() {
  const [rollo, setRollo] = useState({
    numero_rollo: "",
    lote: "",
    tipo_tela: "",
    color: "",
    fecha: "",
    metraje: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleChange = (e) => {
    setRollo({ ...rollo, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await axios.post("http://localhost:8001/rollos/", {
        ...rollo,
        metraje: parseFloat(rollo.metraje),
      });
      setShowSuccess(true);
      setRollo({
        numero_rollo: "",
        lote: "",
        tipo_tela: "",
        color: "",
        fecha: "",
        metraje: "",
      });
    } catch (err) {
      setShowError(true);
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="space-y-4 max-w-md w-full relative">
        <h1 className="text-2xl font-bold text-white text-center">Agregar Rollo</h1>
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
        <button 
          onClick={handleSubmit} 
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
        >
          Agregar Rollo
        </button>

        {/* Modal de éxito */}
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

        {/* Modal de error */}
        {showError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full">
              <h3 className="text-xl font-bold text-red-500 mb-2">Error</h3>
              <p className="text-white mb-4">No se pudo agregar el rollo</p>
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