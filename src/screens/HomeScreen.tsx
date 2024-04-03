import optimizedTripsApi from '../apis/routingApi';
import {
  MapView,
  ReactLogo,
  SearchBar,
  ListOrderAddress,
} from '../components/map';
import data from '../apis/problem.json';
import { getOptimizedTripInfo } from '../apis/getRoutingApi';
import { getAllOptimizedTrips } from '../apis/getAllRouteApi';
//
export const HomeScreen = () => {
  // Funcion para solucionar un problema
  // optimizedTripsApi
  //   .post('', data)
  //   .then((response) => {
  //     // Maneja la respuesta aquí
  //     console.log('Ruta optimizada obtenida:', response.data);

  //   })
  //   .catch((error) => {
  //     // Maneja los errores aquí
  //     console.error('Error al obtener la ruta optimizada:', error);
  //   });

  // Llamada a la función para obtener la información del viaje optimizado por su ID
  const tripId = 'f3d7335d-da59-46d4-9cce-7e1052021765';
  getOptimizedTripInfo(tripId)
    .then((tripInfo) => {
      console.log('Información del viaje optimizado:', tripInfo);
    })
    .catch((error) => {
      console.error(
        'Error al obtener la información del viaje optimizado:',
        error
      );
    });

  // Llamada a la función para obtener todos los resultados de viajes optimizados
  getAllOptimizedTrips()
    .then((optimizedTrips) => {
      console.log(
        'Todos los resultados de viajes optimizados:',
        optimizedTrips
      );
    })
    .catch((error) => {
      console.error(
        'Error al obtener todos los resultados de viajes optimizados:',
        error
      );
    });

  return (
    <div className="relative overflow-hidden">
      <MapView />
      {/* Posicionamiento arriba a la derecha */}
      <div className="absolute top-2 right-2">
        {/* <BtnMyLocation /> */}
        <SearchBar />
      </div>
      {/* Posicionamiento arriba al medio */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2"></div>
      {/* Posicionamiento abajo a la derecha */}
      <div className="absolute bottom-4 right-2">
        <ReactLogo />
      </div>
      {/* Posicionamiento arriba a la izquierda */}
      <div className="absolute top-2 left-1">
        <ListOrderAddress />
      </div>
    </div>
  );
};
