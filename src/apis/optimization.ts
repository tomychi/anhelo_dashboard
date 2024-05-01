import axios from 'axios';

const accessToken = import.meta.env.VITE_ACCESS_TOKEN;

const optimizationApi = axios.create({
  baseURL: 'https://api.mapbox.com/optimized-trips/v1/mapbox/driving', // Quita las coordenadas de la URL base
  params: {
    steps: false,
    access_token: accessToken,
  },
});

export async function obtenerRutaOptimizada(coordinates: string) {
  try {
    const response = await optimizationApi.get(`/${coordinates}`);
    if (response.data.code !== 'Ok') {
      throw new Error(response.data.message);
    }
    return response.data;
  } catch (error) {
    console.error('Error al obtener la ruta optimizada:', error);
    return null;
  }
}
