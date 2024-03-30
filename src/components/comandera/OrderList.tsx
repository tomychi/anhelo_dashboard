import { PedidoProps } from '../../types/types';
import { OrderSection } from './OrderSection';

interface OrderListProps {
  seccionActiva: string;
  pedidosPorHacer: PedidoProps[];
  pedidosHechos: PedidoProps[];
  pedidosEntregados: PedidoProps[];
}

export const OrderList: React.FC<OrderListProps> = ({
  seccionActiva,
  pedidosPorHacer,
  pedidosHechos,
  pedidosEntregados,
}) => {
  return (
    <div>
      {seccionActiva === 'porHacer' ? (
        <OrderSection orders={pedidosPorHacer} />
      ) : seccionActiva === 'hechos' ? (
        <OrderSection orders={pedidosHechos} />
      ) : (
        <OrderSection orders={pedidosEntregados} />
      )}
    </div>
  );
};
