import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Agregar from "../pages/Agregar";
import Consultar from "../pages/Consultar";
import CortesPage from "../pages/CortesPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <div className="bg-gray-900 text-white min-h-screen p-4">
        <nav className="flex gap-4 mb-6">
          <Link to="/" className="hover:underline">Agregar Rollo</Link>
          <Link to="/consultar" className="hover:underline">Consultar Rollos</Link>
          <Link to="/cortes" className="hover:underline">Cortes</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Agregar />} />
          <Route path="/consultar" element={<Consultar />} />
          <Route path="/cortes" element={<CortesPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
