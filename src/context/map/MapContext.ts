import { createContext } from 'react';
import { Map } from 'mapbox-gl';

interface MapContextProps {
  isMapReady: boolean;
  map?: Map;

  // methods
  setMap: (map: Map) => void;
  getRouteBetweenPoints: (
    start: [number, number],
    end: [number, number]
  ) => Promise<{ kms: number; minutes: number }>;
}

export const MapContext = createContext({} as MapContextProps);
