import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Agregar from "../pages/Agregar";
import Consultar from "../pages/Consultar";
import CortesPage from "../pages/CortesPage";

function NavLink({ to, children, isActive }) {
  return (
    <Link
      to={to}
      className={`
        relative px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105
        ${isActive 
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
          : 'text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm'
        }
        before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-blue-500 before:to-purple-600 before:opacity-0 before:transition-opacity before:duration-300
        hover:before:opacity-20
      `}
    >
      <span className="relative z-10">{children}</span>
    </Link>
  );
}

function Navigation() {
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { path: '/', label: 'Agregar Rollo' },
    { path: '/consultar', label: 'Consultar Rollos' },
    { path: '/cortes', label: 'Cortes' }
  ];

  return (
    <nav className="relative mb-8">
      {/* Fondo con efecto glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-lg rounded-2xl border border-white/10"></div>
      
      {/* Contenido del navbar */}
      <div className="relative z-10 flex items-center p-6">
        {/* Logo/Título */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform hover:rotate-12 transition-transform duration-300">
            <span className="text-xl font-bold">💥</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Sistema de Rollos MTT
          </h1>
        </div>

        {/* Links de navegación */}
        <div className="flex items-center space-x-2 ml-8">
          {navItems.map((item, index) => (
            <div
              key={item.path}
              className={`transform transition-all duration-500 ${
                mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <NavLink
                to={item.path}
                isActive={location.pathname === item.path}
              >
                <span>{item.label}</span>
              </NavLink>
            </div>
          ))}
        </div>
      </div>

      {/* Indicador de página activa */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
      </div>
    </nav>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white min-h-screen">
        {/* Efectos de fondo */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Contenido principal */}
        <div className="relative z-10 p-6">
          <Navigation />
          
          {/* Contenedor de páginas con animación */}
          <div className="transition-all duration-300 ease-in-out">
            <Routes>
              <Route path="/" element={<Agregar />} />
              <Route path="/consultar" element={<Consultar />} />
              <Route path="/cortes" element={<CortesPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}