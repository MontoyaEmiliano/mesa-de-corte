import { useEffect, useState } from 'react';
import { rollosApi } from '../api/rollosApi';

export default function ConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState('Probando conexión...');
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Primero probamos obtener el token CSRF
        await rollosApi.get('/csrf/');
        
        // Luego probamos obtener clientes
        const response = await rollosApi.fetchClientes();
        
        if (response.data) {
          setConnectionStatus(' Conexión exitosa con el backend');
          setClientes(response.data);
        } else {
          setConnectionStatus(' La respuesta no contiene datos');
        }
      } catch (error) {
        console.error('Error de conexión:', error);
        setConnectionStatus(` Error de conexión: ${error.message}`);
      }
    };
    
    testConnection();
  }, []);

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg">
      <h2 className="text-xl font-bold mb-4">Prueba de Conexión</h2>
      <p className="mb-4">{connectionStatus}</p>
      
      {clientes.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Clientes obtenidos:</h3>
          <ul className="list-disc pl-5">
            {clientes.map(cliente => (
              <li key={cliente.id}>{cliente.nombre} (ID: {cliente.id})</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}