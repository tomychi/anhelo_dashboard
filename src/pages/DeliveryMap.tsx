import { featureCollection } from '@turf/turf';
import MapContainer from '../components/Map/MapContainer';
import '../map.css';
import mapboxgl from 'mapbox-gl';
import { newDropoff, updateDropoffs } from '../services/deliveryService';
import { PointHopper } from '../types/map';
import { useState } from 'react';
import { restaurantLocation } from '../data/restaurantLocation';
import { PedidoProps } from '../types/types';
import { PedidosSinCords } from '../components/Map';

interface DeliveryProps {
  orders: PedidoProps[];
  selectedCadete: string | null;
  cadetes: string[];
}

const DeliveryMap = ({ orders, selectedCadete, cadetes }: DeliveryProps) => {
  const [clickMap, setClickMap] = useState<{
    value: boolean;
    id: string;
    fecha: string;
  }>({
    value: false,
    id: '',
    fecha: '',
  });

  const filteredPedidos = selectedCadete
    ? orders.filter((pedido) => pedido.cadete === selectedCadete)
    : orders;

  // pedidos sin coords map=[0,0]
  const pedidosSinCoords = orders.filter(
    (pedido) => pedido.map[0] === 0 && pedido.map[1] === 0
  );

  const warehouseLocations = filteredPedidos.map((p) => p.map);

  const dropoffs = featureCollection([]);

  const lastAtRestaurant = 0;
  const pointHopper: PointHopper = {};

  const addWaypoints = async (map: mapboxgl.Map) => {
    await newDropoff(
      map.unproject(new mapboxgl.Point(135.96739604171614, 389.9065033549213)),
      restaurantLocation,
      warehouseLocations,
      dropoffs,
      lastAtRestaurant,
      pointHopper,
      map
    );
    updateDropoffs(map, dropoffs);
  };

  return (
    <div>
      <PedidosSinCords pedidos={pedidosSinCoords} setClickMap={setClickMap} />
      <MapContainer
        clickMap={clickMap}
        setClickMap={setClickMap}
        restaurantLocation={restaurantLocation}
        cadetes={cadetes}
        dropoffs={dropoffs}
        pedidos={filteredPedidos}
        cadete={selectedCadete}
        addWaypoints={addWaypoints}
      ></MapContainer>
    </div>
  );
};

export default DeliveryMap;
