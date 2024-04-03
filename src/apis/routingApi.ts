import axios, { AxiosInstance } from 'axios';
// Token de acceso
const accessToken = import.meta.env.VITE_ACCESS_TOKEN;

// Crea una instancia de Axios con la configuración base
const optimizedTripsApi: AxiosInstance = axios.create({
  baseURL: 'https://api.mapbox.com/optimized-trips/v2',
  params: {
    access_token: accessToken,
  },
});

// Función para realizar la solicitud de ruta optimizada
const getOptimizedTrip = async (data: any) => {
  try {
    // Realiza la solicitud POST con los datos proporcionados
    const response = await optimizedTripsApi.post('', data);
    // Devuelve los datos de la respuesta
    return response.data;
  } catch (error) {
    // Captura y maneja los errores
    console.error('Error al obtener la ruta optimizada:', error);
    throw error;
  }
};

export default optimizedTripsApi;
