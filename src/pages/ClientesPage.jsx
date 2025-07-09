// src/pages/ClientesPage.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

axios.defaults.baseURL = "http://localhost:8000";

export default function ClientesPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 p-6 flex flex-col items-center justify-center">
      {/* Encabezado con título del sistema */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-2">Sistema de Rollos MTT</h1>
        <p className="text-xl text-blue-300">Gestión de clientes y rollos</p>
      </div>

      {/* Botón de bienvenida centrado que redirige a /clientes/nuevo */}
      <button
        onClick={() => navigate("/clientes/nuevo")}
        className="bg-blue-600 hover:bg-blue-700 text-white text-5xl font-bold py-8 px-16 rounded-xl shadow-2xl transition-all transform hover:scale-105"
      >
        BIENVENIDO
      </button>
    </div>
  );
}