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

export const getOptimizedTripInfo = async (tripId: string) => {
  try {
    const response = await optimizedTripsApi.get(`/${tripId}`);
    return response;
  } catch (error) {
    throw new Error(`Error retrieving optimized trip information: ${error}`);
  }
};

// const pintarRutaOptimizada = (ruta) => {
//   const layerId = 'ruta-optimizada';

//   // Verifica si la capa ya existe en el mapa y, si es así, la elimina
//   if (map?.getLayer(layerId)) {
//     map.removeLayer(layerId);
//   }

//   // Verifica si la fuente de datos ya existe en el mapa y, si es así, la elimina
//   if (map?.getSource(layerId)) {
//     map.removeSource(layerId);
//   }

//   // Extrae las coordenadas de las paradas que no son en cocina
//   const coordenadas = ruta.stops
//     .filter((parada) => parada.location !== 'cocina')
//     .map((parada) => [
//       parada.location_metadata.snapped_coordinate[0],
//       parada.location_metadata.snapped_coordinate[1],
//     ]);

//   // Agrega la primera y última coordenada como punto de partida y llegada respectivamente
//   coordenadas.unshift([
//     ruta.stops[0].location_metadata.snapped_coordinate[0],
//     ruta.stops[0].location_metadata.snapped_coordinate[1],
//   ]);
//   coordenadas.push([
//     ruta.stops[ruta.stops.length - 1].location_metadata.snapped_coordinate[0],
//     ruta.stops[ruta.stops.length - 1].location_metadata.snapped_coordinate[1],
//   ]);

//   // Crea una nueva capa de línea en el mapa
//   map?.addLayer(
//     {
//       id: layerId,
//       type: 'line',
//       source: {
//         type: 'geojson',
//         data: {
//           type: 'Feature',
//           properties: {},
//           geometry: {
//             type: 'LineString',
//             coordinates: coordenadas,
//           },
//         },
//       },
//       layout: {
//         'line-join': 'round',
//         'line-cap': 'round',
//       },
//       paint: {
//         'line-color': '#0E3464',
//         'line-width': ['interpolate', ['linear'], ['zoom'], 12, 3, 22, 12],
//       },
//     },
//     'waterway-label'
//   );
// };
