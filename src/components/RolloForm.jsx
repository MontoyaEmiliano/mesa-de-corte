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

  const handleChange = (e) => {
    setRollo({ ...rollo, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await axios.post("http://localhost:8000/rollos/", {
        ...rollo,
        metraje: parseFloat(rollo.metraje),
      });
      alert("Rollo agregado correctamente");
      setRollo({
        numero_rollo: "",
        lote: "",
        tipo_tela: "",
        color: "",
        fecha: "",
        metraje: "",
      });
    } catch (err) {
      alert("Error al agregar");
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      {["numero_rollo", "lote", "tipo_tela", "color", "fecha", "metraje"].map((campo) => (
        <input
          key={campo}
          name={campo}
          type={campo === "fecha" ? "date" : "text"}
          placeholder={campo.replace("_", " ")}
          value={rollo[campo]}
          onChange={handleChange}
          className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
        />
      ))}
      <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">
        Agregar Rollo
      </button>
    </div>
  );
}
