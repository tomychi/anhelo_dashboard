import { featureCollection } from '@turf/turf';
import MapContainer from '../components/Map/MapContainer';
import '../map.css';
import mapboxgl from 'mapbox-gl';
import { newDropoff, updateDropoffs } from '../services/deliveryService';
import { PointHopper } from '../types/map';
import CadeteSelect from '../components/Cadet/CadeteSelect';
import { useEffect, useState } from 'react';
import { restaurantLocation } from '../data/restaurantLocation';
import { PedidoProps } from '../types/types';
import { readEmpleados } from '../firebase/registroEmpleados';
import { PedidosSinCords } from '../components/Map';

interface DeliveryProps {
  orders: PedidoProps[];
}

const DeliveryMap = ({ orders }: DeliveryProps) => {
  const [clickMap, setClickMap] = useState<{
    value: boolean;
    id: string;
    fecha: string;
  }>({
    value: false,
    id: '',
    fecha: '',
  });

  const [selectedCadete, setSelectedCadete] = useState<string | null>(null);
  const [cadetes, setCadetes] = useState<string[]>([]);

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

  useEffect(() => {
    const obtenerCadetes = async () => {
      try {
        const empleados = await readEmpleados();
        const cadetesFiltrados = empleados
          .filter((empleado) => empleado.category === 'cadete')
          .map((empleado) => empleado.name);
        setCadetes(cadetesFiltrados);
      } catch (error) {
        console.error('Error al obtener los cadetes:', error);
      }
    };

    obtenerCadetes();
  }, []);

  return (
    <div>
      <CadeteSelect
        cadetes={cadetes}
        onChange={(cadete) => setSelectedCadete(cadete)}
      />{' '}
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
