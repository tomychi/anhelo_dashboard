import { createContext } from 'react';
import { PedidoProps } from '../../types/types';
import { CustomFeature } from './placesReducer';
import { Feature } from '../../interfaces/places';

export interface PlacesContextProps {
  isLoading: boolean;
  userLocation?: [number, number];
  isLoadingPlaces: boolean;
  isLoadingPlacesOrder: boolean;
  places: CustomFeature[];
  placesOrder: Feature[];

  // methods
  searchPlacesByTerm: (
    query: string,
    order: PedidoProps
  ) => Promise<CustomFeature[]>;
  searchPlacesByOrder: (queryy: string) => Promise<Feature[]>;
}

export const PlacesContext = createContext<PlacesContextProps>(
  {} as PlacesContextProps
);
