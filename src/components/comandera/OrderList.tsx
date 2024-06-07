import { VueltaInfo } from '../../firebase/Cadetes';
import { PedidoProps } from '../../types/types';
import { OrderSection } from './OrderSection';

interface OrderListProps {
  seccionActiva: string;
  pedidosPorHacer: PedidoProps[];
  pedidosHechos: PedidoProps[];
  pedidosEntregados: PedidoProps[];
  cadetes: string[];
  vueltas: VueltaInfo[];
}

export const OrderList: React.FC<OrderListProps> = ({
  seccionActiva,
  pedidosPorHacer,
  pedidosHechos,
  pedidosEntregados,
  cadetes,
  vueltas,
}) => {
  return (
    <div>
      {seccionActiva === 'porHacer' ? (
        <OrderSection
          orders={pedidosPorHacer}
          cadetes={cadetes}
          vueltas={vueltas}
        />
      ) : seccionActiva === 'hechos' ? (
        <OrderSection
          orders={pedidosHechos}
          cadetes={cadetes}
          vueltas={vueltas}
        />
      ) : (
        seccionActiva === 'entregados' && (
          <OrderSection
            orders={pedidosEntregados}
            cadetes={cadetes}
            vueltas={vueltas}
          />
        )
      )}
    </div>
  );
};
