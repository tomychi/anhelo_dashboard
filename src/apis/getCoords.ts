import axios from 'axios';
import directionsApi from './directionsApi';

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

export const obtenerDistanciaYMinuto = async (
  origen: number[],
  destino: number[]
): Promise<{ kms: number; minutosDistancia: number }> => {
  console.log(origen, destino);
  try {
    // Realizar la solicitud a la API de direcciones de Mapbox
    const response = await directionsApi.get(
      `/${origen.join(',')};${destino.join(',')}`
    );

    // Verificar si se encontraron resultados
    if (response.data.routes && response.data.routes.length > 0) {
      // Obtener la geometría de la ruta
      const { distance, duration } = response.data.routes[0];

      let kms = distance / 1000;
      kms = Math.round(kms * 100);
      kms /= 100;

      const minutes = Math.floor(duration / 60);

      return {
        kms: kms, // Devolver la distancia en kilómetros
        minutosDistancia: minutes,
      }; // Devolver la geometría de la ruta
    } else {
      console.error('No se encontraron rutas para los puntos proporcionados.');
      return {
        kms: 0,
        minutosDistancia: 0,
      };
    }
  } catch (error) {
    console.error('Error al obtener la ruta:', error);
    return {
      kms: 0,
      minutosDistancia: 0,
    };
  }
};
