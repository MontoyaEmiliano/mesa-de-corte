import { useEffect, useState } from "react";
import axios from "axios";

export default function ListaRollos() {
  const [rollos, setRollos] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/rollos/")
      .then((res) => setRollos(res.data))
      .catch((err) => console.error("Error al obtener rollos", err));
  }, []);

  return (
    <table className="w-full text-left mt-4 border border-gray-600">
      <thead className="bg-gray-800">
        <tr>
          <th className="p-2">#</th>
          <th className="p-2">Número</th>
          <th className="p-2">Lote</th>
          <th className="p-2">Tipo Tela</th>
          <th className="p-2">Color</th>
          <th className="p-2">Fecha</th>
          <th className="p-2">Metraje</th>
        </tr>
      </thead>
      <tbody>
        {rollos.map((r, i) => (
          <tr key={r.id} className="border-t border-gray-700">
            <td className="p-2">{i + 1}</td>
            <td className="p-2">{r.numero_rollo}</td>
            <td className="p-2">{r.lote}</td>
            <td className="p-2">{r.tipo_tela}</td>
            <td className="p-2">{r.color}</td>
            <td className="p-2">{r.fecha}</td>
            <td className="p-2">{r.metraje} m</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
