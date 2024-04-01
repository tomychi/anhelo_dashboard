import { createContext } from 'react';
import { Feature } from '../../interfaces/places';

export interface PlacesContextProps {
  isLoading: boolean;
  userLocation?: [number, number];
  isLoadingPlaces: boolean;
  isLoadingPlacesOrder: boolean;
  places: Feature[];
  placesOrder: Feature[];

  // methods
  searchPlacesByTerm: (query: string) => Promise<Feature[]>;
  searchPlacesByOrder: (queryy: string) => Promise<Feature[]>;
}

export const PlacesContext = createContext<PlacesContextProps>(
  {} as PlacesContextProps
);
