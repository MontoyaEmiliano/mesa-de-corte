import { useState, useEffect } from "react";
import axios from "axios";

export default function Cortes() {
  const [tipoTela, setTipoTela] = useState("");
  const [color, setColor] = useState("");
  const [metrosRequeridos, setMetrosRequeridos] = useState("");
  const [rollos, setRollos] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [rollosUsados, setRollosUsados] = useState([]);

  useEffect(() => {
    const fetchRollos = async () => {
      try {
        const res = await axios.get("/rollos/");
        setRollos(res.data);
      } catch (error) {
        console.error("Error al obtener rollos:", error);
      }
    };
    fetchRollos();
  }, []);

  const verificarDisponibilidad = () => {
    const disponibles = rollos
      .filter(r =>
        r.disponible &&
        r.tipo_tela?.toLowerCase().includes(tipoTela.toLowerCase()) &&
        r.color?.toLowerCase().includes(color.toLowerCase())
      )
      .sort((a, b) => parseFloat(b.metraje) - parseFloat(a.metraje)); // orden ascendente

    const requerido = parseFloat(metrosRequeridos);
    if (isNaN(requerido) || requerido <= 0) {
      setResultado("⚠️ Ingresa una cantidad válida de metros.");
      setRollosUsados([]);
      return;
    }

    let acumulado = 0;
    const usados = [];

    for (const rollo of disponibles) {
      if (acumulado >= requerido) break;
      acumulado += parseFloat(rollo.metraje || 0);
      usados.push(rollo);
    }

    if (acumulado >= requerido) {
      setResultado(`✅ ¡Sí hay suficiente! Hay ${acumulado.toFixed(2)} m disponibles con ${usados.length} rollo(s).`);
      setRollosUsados(usados);
    } else {
      setResultado(`❌ No hay suficiente. Solo hay ${acumulado.toFixed(2)} m disponibles.`);
      setRollosUsados(usados);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-900 p-6 text-white">
      <div className="w-full max-w-xl bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
        <h1 className="text-2xl font-bold text-center">Verificar Corte de Tela</h1>

        <input
          type="text"
          placeholder="Tipo de tela (ej. gabardina)"
          value={tipoTela}
          onChange={(e) => setTipoTela(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
        />
        <input
          type="text"
          placeholder="Color (ej. azul)"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
        />
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

        {rollosUsados.length > 0 && (
          <div className="mt-6 border-t border-gray-600 pt-4">
            <h2 className="text-lg font-semibold mb-2">Rollos utilizados:</h2>
            <table className="w-full text-sm border border-gray-600">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-2 border border-gray-600">Lote</th>
                  <th className="p-2 border border-gray-600">Fecha</th>
                  <th className="p-2 border border-gray-600">Metraje</th>
                </tr>
              </thead>
              <tbody>
                {rollosUsados.map((r) => (
                  <tr key={r.id} className="border-t border-gray-700">
                    <td className="p-2 border border-gray-600">{r.lote}</td>
                    <td className="p-2 border border-gray-600">{r.fecha}</td>
                    <td className="p-2 border border-gray-600">{r.metraje} m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
