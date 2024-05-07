import axios from 'axios';

const accessToken = import.meta.env.VITE_ACCESS_TOKEN;

const minLon = -64.5; // Longitud mínima
const minLat = -33.5; // Latitud mínima
const maxLon = -64.0; // Longitud máxima
const maxLat = -33.0; // Latitud máxima

const boundingBox = `${minLon},${minLat},${maxLon},${maxLat}`;

// estemetodo se encarga de buscar la ubicacion de un lugar en base a la direccion que se le pasa   y te devuelve las coordenadas
const getCoords = axios.create({
  baseURL: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
  params: {
    limit: 1,
    language: 'es',
    access_token: accessToken,
    country: 'AR',
    autocomplete: true,
    bbox: boundingBox,
  },
});

export const buscarCoordenadas = async (direccion: string) => {
  try {
    // Realizar la solicitud a la API de geocodificación de Mapbox
    const response = await getCoords.get(
      `/${encodeURIComponent(direccion)}.json`
    );

    // Verificar si se encontraron resultados
    if (response.data.features && response.data.features.length > 0) {
      // Obtener las coordenadas del primer resultado
      const coordenadas = response.data.features[0].geometry.coordinates;
      return coordenadas; // Devolver las coordenadas [longitud, latitud]
    } else {
      console.error(
        'No se encontraron resultados para la dirección proporcionada.'
      );
      return null;
    }
  } catch (error) {
    console.error('Error al obtener las coordenadas:', error);
    return null;
  }
};
