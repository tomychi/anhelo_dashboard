import { useEffect, useReducer } from 'react';
import { searchApi } from '../../apis';
import { getUserLocation } from '../../helpers';
import { PlacesContext } from './PlacesContext';
import { CustomFeature, placesReducer } from './placesReducer';

import { Feature, PlacesResponse } from '../../interfaces/places';
import { PedidoProps } from '../../types/types';

export interface PlacesState {
  isLoading: boolean;
  userLocation?: [number, number];
  isLoadingPlaces: boolean;
  isLoadingPlacesOrder: boolean;
  places: Feature[];
  placesOrder: Feature[];
}

const INITIAL_STATE: PlacesState = {
  isLoading: true,
  userLocation: [-64.3337858210026, -33.0957943618745],
  isLoadingPlaces: false,
  isLoadingPlacesOrder: false,
  places: [],
  placesOrder: [],
};

interface Props {
  children: JSX.Element | JSX.Element[];
}

export const PlacesProvider = ({ children }: Props) => {
  const [state, dispatch] = useReducer(placesReducer, INITIAL_STATE);

  useEffect(() => {
    getUserLocation().then((lngLat) =>
      dispatch({ type: 'setUserLocation', payload: lngLat })
    );
  }, []);

  const searchPlacesByTerm = async (
    query: string,
    order: PedidoProps
  ): Promise<CustomFeature[]> => {
    if (query.length === 0) {
      dispatch({ type: 'setPlaces', payload: [] });
      return [];
    }
    if (!state.userLocation) throw new Error('No hay ubicacion del usuario');

    dispatch({ type: 'setLoadingPlaces' });

    const resp = await searchApi.get<PlacesResponse>(`/${query}.json`, {
      params: {
        proximity: state.userLocation.join(','),
      },
    });
    // Aquí puedes agregar la dirección y el pedido a los resultados si lo necesitas
    const placesWithOrderInfo = resp.data.features.map((feature) => ({
      ...feature,
      order: order,
    }));

    dispatch({ type: 'setPlaces', payload: placesWithOrderInfo });
    return placesWithOrderInfo;
  };

  const searchPlacesByOrder = async (query: string): Promise<Feature[]> => {
    if (query.length === 0) {
      dispatch({ type: 'setPlacesOrder', payload: [] });
      return [];
    }
    if (!state.userLocation) throw new Error('No hay ubicacion del usuario');

    dispatch({ type: 'setLoadingPlacesOrder' });

    const resp = await searchApi.get<PlacesResponse>(`/${query}.json`, {
      params: {
        proximity: state.userLocation.join(','),
      },
    });
    dispatch({ type: 'setPlacesOrder', payload: resp.data.features });
    return resp.data.features;
  };

  return (
    <PlacesContext.Provider
      value={{
        ...state,

        // methods
        searchPlacesByTerm,
        searchPlacesByOrder,
      }}
    >
      {children}
    </PlacesContext.Provider>
  );
};
