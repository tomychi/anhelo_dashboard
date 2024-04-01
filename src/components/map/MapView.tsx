import { useContext, useLayoutEffect, useRef } from 'react';
import { Map } from 'mapbox-gl';
import { Loading } from './';
import { MapContext, PlacesContext } from '../../context';

export const MapView = () => {
  const { isLoading, userLocation } = useContext(PlacesContext);
  const { setMap } = useContext(MapContext);

  // mantener la referencia al elemento
  const mapDiv = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isLoading) {
      const map = new Map({
        container: mapDiv.current!, // SE ASEGURA QUE NO SEA NULO (!)
        style: 'mapbox://styles/mapbox/dark-v10',
        center: userLocation,
        zoom: 14,
      });

      setMap(map);
    }
  }, [isLoading]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div
      style={{
        height: '91vh',
        left: 0,
        top: 0,
        width: '100vw',
      }}
      className="overflow-y-hidden"
      ref={mapDiv}
    >
      {userLocation?.join(',')}
    </div>
  );
};
