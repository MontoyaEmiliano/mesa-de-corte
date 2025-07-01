import axios from 'axios';

const API_URL = 'http://localhost:8000/rollos/'; // Asegúrate que el backend esté corriendo

export const fetchRollos = () => axios.get(API_URL);

export const createRollo = (data) => axios.post(API_URL, data);
