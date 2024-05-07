import mapboxgl from 'mapbox-gl';
import { ReactNode, useEffect } from 'react';
import {
  addDropoffLayer,
  addRoutes,
  addTruckMarker,
  addWarehouseLayers,
} from '../../utils/layers';
import { FeatureCollection } from 'geojson';
import { featureCollection } from '@turf/turf';
import { PedidoProps } from '../../types/map';

interface MapContainerProps {
  restaurantLocation: [number, number];
  children?: ReactNode;
  dropoffs: FeatureCollection;
  pedidos: PedidoProps[];
  cadete: string | null;
  addWaypoints: (map: mapboxgl.Map) => void; // Agrega esta prop
  cadetes: string[];
}
mapboxgl.accessToken = import.meta.env.VITE_ACCESS_TOKEN || '';

const MapContainer: React.FC<MapContainerProps> = ({
  restaurantLocation,
  dropoffs,
  pedidos,
  cadete,
  addWaypoints,
  cadetes,
}) => {
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v11',
      center: restaurantLocation,
      zoom: 12,
    });
    const nothing = featureCollection([]);

    map.on('load', () => {
      addTruckMarker(map, restaurantLocation);
      addWarehouseLayers(map, pedidos, cadetes);
      addDropoffLayer(map, dropoffs);
      addRoutes(map, nothing);
    });

    map.addControl(new mapboxgl.NavigationControl());
    // map.on('click', (e) => {
    //   console.log(e);
    // });

    if (cadete) {
      addWaypoints(map);
    }

    return () => {
      map.remove();
    };
  }, [restaurantLocation, pedidos, dropoffs, addWaypoints, cadete]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div id="map" style={{ position: 'absolute', inset: '0' }}></div>
    </div>
  );
};

export default MapContainer;
