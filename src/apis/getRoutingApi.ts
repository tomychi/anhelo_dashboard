import axios from 'axios';
// Token de acceso
const accessToken = import.meta.env.VITE_ACCESS_TOKEN;

const optimizedTripsApi = axios.create({
  baseURL: 'https://api.mapbox.com/optimized-trips/v2/',
  headers: {
    'Content-Type': 'application/json',
  },
  params: {
    access_token: accessToken,
  },
});

// Función para obtener la información de un viaje optimizado por su ID
export const getOptimizedTripInfo = async (tripId: string) => {
  try {
    const response = await optimizedTripsApi.get(`/${tripId}`);
    return response.data;
  } catch (error) {
    throw new Error(
      `Error al obtener la información del viaje optimizado: ${error}`
    );
  }
};
