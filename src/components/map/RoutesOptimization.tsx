// import { useContext } from 'react';
// import { getAllOptimizedTrips } from '../../apis/getAllRouteApi';
// import { getOptimizedTripInfo } from '../../apis/getRoutingApi';
// import data from '../../apis/problem.json';
// import { MapContext } from '../../context';
// import optimizedTripsApi from '../../apis/routingApi';
// import { directionsApi } from '../../apis';
// import mapboxgl from 'mapbox-gl';

// const getBearing = (start: number[], end: number[]): number => {
//   const startLat = toRadians(start[1]);
//   const startLng = toRadians(start[0]);
//   const endLat = toRadians(end[1]);
//   const endLng = toRadians(end[0]);

//   const y = Math.sin(endLng - startLng) * Math.cos(endLat);
//   const x =
//     Math.cos(startLat) * Math.sin(endLat) -
//     Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
//   let brng = Math.atan2(y, x);
//   brng = toDegrees(brng);
//   brng = (brng + 360) % 360;

//   return brng;
// };

// // Función para convertir grados a radianes
// const toRadians = (degrees: number): number => {
//   return degrees * (Math.PI / 180);
// };

// // Función para convertir radianes a grados
// const toDegrees = (radians: number): number => {
//   return radians * (180 / Math.PI);
// };

// export const RoutesOptimization = () => {
//   const { map } = useContext(MapContext);

//   const getRouteBetweenPoints = async (start, end) => {
//     const resp = await directionsApi.get(
//       `/${start.join(',')};${end.join(',')}`
//     );
//     const { distance, duration, geometry } = resp.data.routes[0];
//     const { coordinates: coords } = geometry;
//     let kms = distance / 1000;
//     kms = Math.round(kms * 100) / 100;
//     const minutes = Math.floor(duration / 60);

//     return { kms, minutes, coords };
//   };

//   const pintarRutaOptimizada = async (ruta) => {
//     const layerIdPrefix = 'ruta-optimizada';
//     // Remover capas y fuentes con identificadores similares
//     for (let i = 0; i < ruta.stops.length; i++) {
//       const layerId = `${layerIdPrefix}-${i}`;
//       if (map?.getLayer(layerId)) {
//         map.removeLayer(layerId);
//       }
//       if (map?.getSource(layerId)) {
//         map.removeSource(layerId);
//       }
//     }

//     // Extrae las coordenadas de las paradas que no son en cocina
//     const coordenadas = ruta.stops
//       .filter((parada) => parada.location !== 'cocina')
//       .map((parada) => [
//         parada.location_metadata.snapped_coordinate[0],
//         parada.location_metadata.snapped_coordinate[1],
//       ]);

//     // Agrega la primera y última coordenada como punto de partida y llegada respectivamente
//     coordenadas.unshift([
//       ruta.stops[0].location_metadata.snapped_coordinate[0],
//       ruta.stops[0].location_metadata.snapped_coordinate[1],
//     ]);
//     coordenadas.push([
//       ruta.stops[ruta.stops.length - 1].location_metadata.snapped_coordinate[0],
//       ruta.stops[ruta.stops.length - 1].location_metadata.snapped_coordinate[1],
//     ]);
//     // Agrega marcadores en cada parada
//     coordenadas.forEach((coordenada, index) => {
//       const markerId = `marker-${index}-${Date.now()}`; // ID único para el marcador
//       const marker = new mapboxgl.Marker()
//         .setLngLat(coordenada)
//         .addTo(map!)
//         .setPopup(
//           new mapboxgl.Popup().setHTML(`<h3>${ruta.stops[index].location}</h3>`)
//         ); // Popup con el nombre de la parada
//       marker.getElement().id = markerId; // Asignar el ID al elemento del marcador para facilitar la eliminación posterior
//     });

//     // Llama a la función getRouteBetweenPoints para pintar las rutas entre las paradas
//     for (let i = 0; i < coordenadas.length - 1; i++) {
//       const start = coordenadas[i];
//       const end = coordenadas[i + 1];
//       const { coords } = await getRouteBetweenPoints(start, end);
//       const bearing = getBearing(start, end);

//       // Pintar la ruta entre los puntos
//       map?.addLayer({
//         id: `ruta-entre-puntos-${i}-${Date.now()}`, // Agregar Date.now() para hacer el ID único
//         type: 'line',
//         source: {
//           type: 'geojson',
//           data: {
//             type: 'Feature',
//             properties: {},
//             geometry: {
//               type: 'LineString',
//               coordinates: coords,
//             },
//           },
//         },
//         layout: {
//           'line-join': 'round',
//           'line-cap': 'round',
//         },
//         paint: {
//           'line-color': '#11E00D',
//           'line-width': 5,
//         },
//       });
//     }
//   };

//   // Función para pintar una ruta optimizada en el mapa
//   //   Funcion para solucionar un problema
//   //   optimizedTripsApi
//   //     .post('', data)
//   //     .then((response) => {
//   //       // Maneja la respuesta aquí
//   //       console.log('Ruta optimizada obtenida:', response.data);
//   //     })
//   //     .catch((error) => {
//   //       // Maneja los errores aquí
//   //       console.error('Error al obtener la ruta optimizada:', error);
//   //     });

//   // Llamada a la función para obtener la información del viaje optimizado por su ID
//   const tripId = '1d6ee9fb-e52c-42ee-bf06-1428ba9b7f20';
//   getOptimizedTripInfo(tripId)
//     .then((tripInfo) => {
//       // Itera sobre las rutas y píntalas en el mapa
//       tripInfo.data.routes.forEach((ruta) => {
//         pintarRutaOptimizada(ruta);
//       });
//     })
//     .catch((error) => {
//       console.error(
//         'Error al obtener la información del viaje optimizado:',
//         error
//       );
//     });

//   // Llamada a la función para obtener todos los resultados de viajes optimizados
//   //   getAllOptimizedTrips()
//   //     .then((optimizedTrips) => {
//   //       console.log(
//   //         'Todos los resultados de viajes optimizados:',
//   //         optimizedTrips
//   //       );
//   //     })
//   //     .catch((error) => {
//   //       console.error(
//   //         'Error al obtener todos los resultados de viajes optimizados:',
//   //         error
//   //       );
//   //     });

//   return <div>RoutesOptimization</div>;
// };
