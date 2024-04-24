import { useReducer, useContext, useEffect, useState } from 'react';
import { AnySourceData, LngLatBounds, Map, Marker, Popup } from 'mapbox-gl';

import { MapContext } from './MapContext';
import { mapReducer } from './mapReducer';
import { PlacesContext } from '../';
import { directionsApi } from '../../apis';
import { DirectionsResponse } from '../../interfaces/directions';
import { Feature } from '../../interfaces/places';
import { readCadetes } from '../../firebase/Cadetes';
import { updateCadeteForOrder } from '../../firebase/UploadOrder';
import Swal from 'sweetalert2';
import customMarkerImage from '../../assets/anheloLogoResized.png';
export interface MapState {
  isMapReady: boolean;
  map?: Map;
  markers: Marker[];
}

const INITIAL_STATE: MapState = {
  isMapReady: false,
  map: undefined,
  markers: [],
};

interface Props {
  children: JSX.Element | JSX.Element[];
}

export const MapProvider = ({ children }: Props) => {
  const [state, dispatch] = useReducer(mapReducer, INITIAL_STATE);
  const { places, userLocation } = useContext(PlacesContext);
  const [cadetes, setCadetes] = useState<string[]>([]);
  const [isLoadingCadetes, setIsLoadingCadetes] = useState(true);

  useEffect(() => {
    const getCadetes = async () => {
      const cade = await readCadetes();
      setCadetes(cade);
      setIsLoadingCadetes(false);
    };
    getCadetes();
  }, []);

  const getRout = async (place: Feature) => {
    if (!userLocation) throw new Error('No hay ubicación del usuario');
    const [lng, lat] = place.center;
    const results = await getRouteBetweenPoints(userLocation, [lng, lat]);
    return results;
  };

  function handleCadeteSelection(
    fecha: string,
    id: string,
    nuevoCadete: string
  ) {
    updateCadeteForOrder(fecha, id, nuevoCadete)
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'CADETE ASIGNADO',
          text: `El viaje lo lleva: ${nuevoCadete} `,
        });
        // TRAER PEDIDOS ACTUALIZADOS
      })
      .catch((error) => {
        console.error(error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al asignar el cadete',
        });
      });
  }

  // eslint-disable-next-line
  useEffect(() => {
    state.markers.forEach((marker) => marker.remove());
    const newMarkers: Marker[] = [];

    for (const place of places) {
      const [lng, lat] = place.center;
      const popup = new Popup();

      // Obtén la hora actual
      const now = new Date();

      // Extrae la hora y los minutos de la cadena de texto place.order.hora
      const [hour, minute] = place.order.hora.split(':');

      // Crea un nuevo objeto Date con la fecha actual y la hora y minutos del pedido
      const orderTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        parseInt(hour),
        parseInt(minute)
      );

      // Calcula la diferencia en minutos entre la hora actual y la hora del pedido
      const diffMilliseconds = now.getTime() - orderTime.getTime();
      const diffMinutes = Math.floor(diffMilliseconds / (1000 * 60)); // Convertir milisegundos a minutos

      let newMarker;
      // Verifica si han pasado más de 20 minutos desde que se realizó el pedido
      if (diffMinutes > 20) {
        // Marca el pedido de manera especial si han pasado más de 20 minutos
        newMarker = new Marker({
          color: '#ff0011', // Color rojo para identificar los pedidos retrasados
        });
      } else if (place.order.cadete) {
        // Marca el pedido con color azul si hay un cadete asignado
        newMarker = new Marker({
          color: '#00ff11',
        });
      } else {
        // Marca el pedido con color azul si no hay cadete asignado y no ha pasado el tiempo límite
        newMarker = new Marker({
          color: '#0000ff',
        });
      }

      // Luego puedes utilizar el marcador aquí fuera del bloque if-else
      newMarker.setPopup(popup).setLngLat([lng, lat]).addTo(state.map!);
      const markerElement = newMarker.getElement(); // Obtener el elemento DOM del marcador

      if (markerElement) {
        markerElement.addEventListener('click', async () => {
          // Manejar el evento de clic
          try {
            const info = await getRout(place); // Llamar a la función getRout con el lugar seleccionado
            if (!isLoadingCadetes) {
              const defaultCadeteOption = place.order.cadete
                ? `<option value="${place.order.cadete}" selected>${place.order.cadete}</option>`
                : '';
              const cadeteOptions = cadetes
                .map(
                  (cadete, index) => `
                <option value="${cadete}" key="${index}">
                  ${cadete}
                </option>
              `
                )
                .join('');

              const allCadeteOptions = defaultCadeteOption + cadeteOptions;

              popup.setHTML(`
              <p>${place.place_name_es.split(',')[0]}</p>
              <p>Hay: ${info.kms} km</p>
              <p>
                Seleccionar cadete:
                <select id="cadeteSelector">
                  ${allCadeteOptions}
                </select>
              </p>
              <p>Tarda: ${info.minutes} m</p>
            `);
              // Agrega el evento onchange al selector de cadetes después de establecer el contenido del popup
              const cadeteSelector = document.getElementById(
                'cadeteSelector'
              ) as HTMLSelectElement;
              cadeteSelector?.addEventListener('change', () => {
                const nuevoCadete = cadeteSelector.value;
                handleCadeteSelection(
                  place.order.fecha,
                  place.order.id,
                  nuevoCadete
                );
              });
            } else {
              popup.setHTML(`
                <p>${place.place_name_es.split(',')[0]}</p>
                <p>Hay: ${info.kms} km</p>
                <p>Cargando cadetes...</p>
                <p>Tarda: ${info.minutes} m</p>
              `);
            }
          } catch (error) {
            console.error(error);
          }
        });
      }
      newMarkers.push(newMarker);
    }
    console.log('usee');
    dispatch({ type: 'setMarkers', payload: newMarkers });
  }, [places, state.map, isLoadingCadetes, cadetes]);

  // Función para crear un marcador con una imagen de tus activos
  const createCustomMarker = (imagePath: string) => {
    const container = document.createElement('div');
    container.className = 'custom-marker';
    container.style.backgroundImage = `url(${imagePath})`;
    container.style.width = '50px'; // Ajusta el tamaño del icono según sea necesario
    container.style.height = '50px'; // Ajusta el tamaño del icono según sea necesario

    return container;
  };
  const setMap = (map: Map) => {
    const myLocationPopup = new Popup().setHTML(`
                <h4>Aqui estoy</h4>
                <p>En algun lugar del mundo</p>
                `);

    new Marker({
      color: '#00ff11',
      element: createCustomMarker(customMarkerImage),
    })
      .setLngLat(map.getCenter()) // setea el marcador en el centro del mapa (o usuario)
      .setPopup(myLocationPopup)
      .addTo(map); // agrega el marcador al mapa

    dispatch({
      type: 'setMap',
      payload: map,
    });
  };

  const getRouteBetweenPoints = async (
    start: [number, number],
    end: [number, number]
  ) => {
    const resp = await directionsApi.get<DirectionsResponse>(
      `/${start.join(',')};${end.join(',')}`
    );
    const { distance, duration, geometry } = resp.data.routes[0];
    const { coordinates: coords } = geometry;

    let kms = distance / 1000;
    kms = Math.round(kms * 100);
    kms /= 100;
    const minutes = Math.floor(duration / 60);

    const bounds = new LngLatBounds(start, start);

    for (const coord of coords) {
      const newCoord: [number, number] = [coord[0], coord[1]];
      bounds.extend(newCoord);
    }

    state.map?.fitBounds(bounds, {
      padding: 200,
    });

    // pintar polyline

    const sourceData: AnySourceData = {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coords,
            },
          },
        ],
      },
    };

    // remover polyline si existe
    if (state.map?.getLayer('RouteString')) {
      state.map.removeLayer('RouteString');
      state.map.removeSource('RouteString');
    }

    state.map?.addSource('RouteString', sourceData);
    state.map?.addLayer({
      id: 'RouteString',
      type: 'line',
      source: 'RouteString',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#11E00D',
        'line-width': 5,
      },
    });
    return Promise.resolve({ kms, minutes });
  };
  return (
    <MapContext.Provider
      value={{
        ...state,

        // methods
        setMap,
        getRouteBetweenPoints,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};
