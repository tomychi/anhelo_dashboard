import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { PedidoProps } from '../../types/types';
import { useState } from 'react';
import { SelectCadete } from '../comandera';

const APIKEY = import.meta.env.VITE_API_GOOGLE_MAPS;

const position = { lat: -33.117142, lng: -64.347756 };

interface MapsProps {
  orders: PedidoProps[];
}

export const DeliveryMap = ({ orders }: MapsProps) => {
  const [selectedOrder, setSelectedOrder] = useState<PedidoProps | null>(null);

  const handleMarkerClick = (order: PedidoProps) => {
    setSelectedOrder(order);
  };

  // Filtrar los pedidos que tienen coordenadas [0,0]
  const invalidOrders = orders.filter(
    (order) => order.map[0] === 0 && order.map[1] === 0
  );

  // Filtrar los pedidos que tienen coordenadas válidas
  const validOrders = orders.filter(
    (order) => !(order.map[0] === 0 && order.map[1] === 0)
  );

  return (
    <APIProvider apiKey={APIKEY}>
      <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
        {/* Lista de pedidos con coordenadas [0,0] */}
        {invalidOrders.length > 0 && (
          <div className="absolute top-0 left-0 w-full p-4 bg-red-500 text-white z-10">
            <h2 className="text-lg font-bold mb-2">Pedidos sin ubicación</h2>
            {invalidOrders.map((order, index) => (
              <div
                key={index}
                className="mb-2 p-2 border border-white rounded-md"
                onClick={() => handleMarkerClick(order)}
              >
                <p>
                  <strong>Dirección:</strong> {order.direccion}
                </p>
                <p>
                  <strong>Teléfono:</strong> {order.telefono}
                </p>
                <p>
                  <strong>Hora:</strong> {order.hora}
                </p>
                <SelectCadete
                  cadete={order.cadete}
                  fecha={order.fecha}
                  id={order.id}
                  elaborado={order.elaborado}
                />
              </div>
            ))}
          </div>
        )}

        {/* Mapa con marcadores de pedidos con coordenadas válidas */}
        <Map
          defaultZoom={13}
          defaultCenter={position}
          mapId={'bf51a910020fa25a'}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
        >
          {validOrders.map((order, index) => (
            <Marker
              key={index}
              position={{ lat: order.map[0], lng: order.map[1] }}
              title={`Pedido en ${order.direccion}`}
              onClick={() => handleMarkerClick(order)}
            />
          ))}

          {selectedOrder && (
            <InfoWindow
              position={{
                lat: selectedOrder.map[0],
                lng: selectedOrder.map[1],
              }}
              onCloseClick={() => setSelectedOrder(null)}
            >
              <div>
                <h2>{selectedOrder.direccion}</h2>
                <p>Teléfono: {selectedOrder.telefono}</p>
                <p>Hora: {selectedOrder.hora}</p>
                <SelectCadete
                  cadete={selectedOrder.cadete}
                  fecha={selectedOrder.fecha}
                  id={selectedOrder.id}
                  elaborado={selectedOrder.elaborado}
                />
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>
    </APIProvider>
  );
};
