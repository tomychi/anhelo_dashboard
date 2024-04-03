import axios from 'axios';

const accessToken = import.meta.env.VITE_ACCESS_TOKEN;

const optimizedTripsApi = axios.create({
  baseURL: 'https://api.mapbox.com/optimized-trips/v2',
  headers: {
    'Content-Type': 'application/json',
  },
  params: {
    access_token: accessToken,
  },
});

// Función para obtener todos los resultados de viajes optimizados
export const getAllOptimizedTrips = async () => {
  try {
    const response = await optimizedTripsApi.get('');
    return response.data;
  } catch (error) {
    throw new Error(
      `Error al obtener todos los resultados de viajes optimizados: ${error}`
    );
  }
};
