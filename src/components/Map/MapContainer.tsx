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
import { PedidoProps } from '../../types/types';
import Swal from 'sweetalert2';
import { handleAddressSave } from '../../firebase/UploadOrder';

interface MapContainerProps {
  restaurantLocation: [number, number];
  children?: ReactNode;
  dropoffs: FeatureCollection;
  pedidos: PedidoProps[];
  cadete: string | null;
  addWaypoints: (map: mapboxgl.Map) => void; // Agrega esta prop
  cadetes: string[];
  clickMap: { value: boolean; id: string; fecha: string };
  setClickMap: (value: { value: boolean; id: string; fecha: string }) => void;
}
mapboxgl.accessToken = import.meta.env.VITE_ACCESS_TOKEN || '';

const MapContainer: React.FC<MapContainerProps> = ({
  restaurantLocation,
  dropoffs,
  pedidos,
  cadete,
  addWaypoints,
  cadetes,
  clickMap,
  setClickMap,
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
      addWarehouseLayers(map, pedidos, cadetes, setClickMap);
      addDropoffLayer(map, dropoffs);
      addRoutes(map, nothing);
    });

    map.addControl(new mapboxgl.NavigationControl());

    if (clickMap.value) {
      map.setStyle('mapbox://styles/mapbox/streets-v11');

      map.on('click', (e) => {
        const coords = [e.lngLat.lng, e.lngLat.lat] as [number, number];

        // poner un marker en el mapa
        new mapboxgl.Marker().setLngLat(coords).addTo(map);

        // posicionar el mapa en las coordenadas y hacer zoom

        map.flyTo({ center: coords, zoom: 15 });

        // preguntar si desea cambiar las coordenadas

        // cambiar la ubicacion de la alerta
        Swal.fire({
          title: '¿Desea cambiar las coordenadas?',
          icon: 'question',
          position: 'top',

          showDenyButton: true,
          confirmButtonText: `Si`,
          denyButtonText: `No`,
        }).then((result) => {
          if (result.isConfirmed) {
            handleAddressSave(clickMap.fecha, clickMap.id, coords)
              .then(() => {
                setClickMap({ value: false, id: '', fecha: '' });
              })
              .catch((error) => {
                console.log('Error al guardar las coordenadas', error);
              });
          } else if (result.isDenied) {
            setClickMap({ value: false, id: '', fecha: '' });
          }
        });
      });
    } else {
      map.setStyle('mapbox://styles/mapbox/dark-v11');
    }

    if (cadete && pedidos.length > 0 && cadete !== 'NO ASIGNADO') {
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
