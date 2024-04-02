import { useReducer, useContext, useEffect } from 'react';
import { AnySourceData, LngLatBounds, Map, Marker, Popup } from 'mapbox-gl';

import { MapContext } from './MapContext';
import { mapReducer } from './mapReducer';
import { PlacesContext } from '../';
import { directionsApi } from '../../apis';
import { DirectionsResponse } from '../../interfaces/directions';
import { Feature } from '../../interfaces/places';

export interface MapState {
  isMapReady: boolean;
  map?: Map;
  markers: Marker[];
  info: { kms: number; minutes: number };
}

const INITIAL_STATE: MapState = {
  isMapReady: false,
  map: undefined,
  markers: [],
  info: { kms: 0, minutes: 0 },
};

interface Props {
  children: JSX.Element | JSX.Element[];
}

export const MapProvider = ({ children }: Props) => {
  const [state, dispatch] = useReducer(mapReducer, INITIAL_STATE);
  const { places, userLocation } = useContext(PlacesContext);

  const getRout = async (place: Feature) => {
    if (!userLocation) throw new Error('No hay ubicación del usuario');
    const [lng, lat] = place.center;
    const results = await getRouteBetweenPoints(userLocation, [lng, lat]);
    return results;
  };

  // eslint-disable-next-line
  useEffect(() => {
    state.markers.forEach((marker) => marker.remove());
    const newMarkers: Marker[] = [];

    for (const place of places) {
      const [lng, lat] = place.center;
      const popup = new Popup().setHTML(`
              <p>${place.place_name_es.split(',')[0]}</p>

                `);

      const newMarker = new Marker({
        color: '#ff0011',
      })
        .setPopup(popup)
        .setLngLat([lng, lat])
        .addTo(state.map!);

      const markerElement = newMarker.getElement(); // Obtener el elemento DOM del marcador

      if (markerElement) {
        markerElement.addEventListener('click', async () => {
          // Manejar el evento de clic
          try {
            const info = await getRout(place); // Llamar a la función getRout con el lugar seleccionado
            dispatch({ type: 'setInfoDireccion', payload: info });
          } catch (error) {
            console.error(error);
          }
        });
      }
      newMarkers.push(newMarker);
    }

    dispatch({ type: 'setMarkers', payload: newMarkers });
  }, [places, state.map]);

  const setMap = (map: Map) => {
    const myLocationPopup = new Popup().setHTML(`
                <h4>Aqui estoy</h4>
                <p>En algun lugar del mundo</p>
                `);

    new Marker({
      color: '#00ff11',
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

    const bounds = new LngLatBounds([start[0], start[1]], [end[0], end[1]]);

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
