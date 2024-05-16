import { PedidoProps } from '../../types/types';
import { CardComanda } from './Card/CardComanda';

interface OrderSectionProps {
  orders: PedidoProps[];
  cadetes: string[];
}

export const OrderSection: React.FC<OrderSectionProps> = ({
  orders,
  cadetes,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {orders.map(
        ({
          aclaraciones,
          detallePedido,
          direccion,
          elaborado,
          envio,
          fecha,
          hora,
          metodoPago,
          subTotal,
          telefono,
          total,
          referencias,
          id,
          piso,
          cadete,
          dislike,
          delay,
          tiempoElaborado,
          tiempoEntregado,
          entregado,
          map,
          kms,
          minutosDistancia,
        }) => (
          <div key={id}>
            <CardComanda
              aclaraciones={aclaraciones}
              direccion={direccion}
              hora={hora}
              metodoPago={metodoPago}
              total={total}
              telefono={telefono}
              detallePedido={detallePedido}
              elaborado={elaborado}
              referencias={referencias}
              piso={piso}
              fecha={fecha}
              cadete={cadete}
              tiempoElaborado={tiempoElaborado}
              tiempoEntregado={tiempoEntregado}
              entregado={entregado}
              id={id}
              subTotal={subTotal}
              dislike={dislike}
              delay={delay}
              map={map}
              kms={kms}
              minutosDistancia={minutosDistancia}
              envio={envio}
              cadetes={cadetes}
            />
          </div>
        )
      )}
    </div>
  );
};
