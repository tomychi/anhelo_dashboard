// import { useMemo, useState } from 'react';
// import mapboxgl from 'mapbox-gl';
// import { RootState } from '../../redux/configureStore';
// import { useSelector } from 'react-redux';
// import { EditableAddress } from './EditableAddress';
// import { PedidoProps } from '../../types/types';

// const accessToken = import.meta.env.VITE_ACCESS_TOKEN;

// interface DataMapsProps {
//   address: string;
//   coordinates: number[];
// }

// export const MapStats = () => {
//   const [mapLoaded, setMapLoaded] = useState(false);
//   const { orders } = useSelector((state: RootState) => state.data);
//   const [unprocessedAddresses, setUnprocessedAddresses] = useState<
//     PedidoProps[]
//   >([]);

//   const tuCiudadCoordinates = useMemo(() => [-64.347558, -33.117876], []);
//   const ciudadLongitud = tuCiudadCoordinates[0];
//   const ciudadLatitud = tuCiudadCoordinates[1];
//   const radio = 0.1;

//   const bbox = [
//     ciudadLongitud - radio,
//     ciudadLatitud - radio,
//     ciudadLongitud + radio,
//     ciudadLatitud + radio,
//   ].join(',');

//   const cargarMapa = () => {
//     mapboxgl.accessToken = accessToken;

//     const saveMapData = (data: DataMapsProps[]) => {
//       localStorage.setItem('mapData', JSON.stringify(data));
//     };

//     const geocodeAddresses = async () => {
//       const map = new mapboxgl.Map({
//         container: 'map',
//         style: 'mapbox://styles/mapbox/dark-v11',
//         center: [tuCiudadCoordinates[0], tuCiudadCoordinates[1]],
//         zoom: 9,
//       });

//       const geocodedData = [];

//       for (const item of orders) {
//         if (!item.direccion) {
//           console.warn('Pedido sin dirección:', item);
//           continue; // Salta a la siguiente iteración del bucle si no hay dirección
//         }

//         const address = encodeURIComponent(item.direccion);
//         const endpoint = 'mapbox.places';
//         const proximity = `${tuCiudadCoordinates[0]},${tuCiudadCoordinates[1]}`;
//         const url = `https://api.mapbox.com/geocoding/v5/${endpoint}/${address}.json?access_token=${mapboxgl.accessToken}&proximity=${proximity}&bbox=${bbox}`;

//         try {
//           const response = await fetch(url);
//           const geodata = await response.json();

//           // Verifica si hay datos de geometría disponibles
//           if (
//             geodata.features &&
//             geodata.features.length > 0 &&
//             geodata.features[0].geometry
//           ) {
//             const coordinates = geodata.features[0].geometry.coordinates;

//             geocodedData.push({
//               coordinates: coordinates,
//               address: item.direccion,
//             });

//             new mapboxgl.Marker({
//               color: '#ff0000',
//               scale: 0.2,
//             })
//               .setLngLat(coordinates)
//               .setPopup(
//                 new mapboxgl.Popup().setHTML(`<h3>${item.direccion}</h3>`)
//               )
//               .addTo(map);
//           } else {
//             console.error('Error al obtener coordenadas:', item.direccion);
//             setUnprocessedAddresses((prev) => [...prev, item]);
//           }
//         } catch (error) {
//           console.error('Error al obtener coordenadas:', error);
//         }
//       }

//       saveMapData(geocodedData); // Guardar los datos del mapa en el localStorage
//       setMapLoaded(true); // Marcar el mapa como cargado
//     };

//     geocodeAddresses();
//   };

//   return (
//     <div className="">
//       <button
//         className="p-4 border-2 border-red-main text-custom-red  text-black font-black uppercase"
//         onClick={() => cargarMapa()}
//       >
//         Cargar Mapa
//       </button>
//       <div id="map" className="h-[80vh] w-full border-2 border-red-main"></div>
//       {unprocessedAddresses.length > 0 && (
//         <div>
//           {unprocessedAddresses.map((pedido) => (
//             <div key={pedido.id}>
//               <p>
//                 No se encontró geometría para la dirección: {pedido.direccion}
//               </p>
//               <EditableAddress pedido={pedido} />
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };
