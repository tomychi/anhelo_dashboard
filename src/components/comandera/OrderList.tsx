import { PedidoProps } from "../../types/types";
import { OrderSection } from "./OrderSection";

interface OrderListProps {
  seccionActiva: string;
  pedidosPorHacer: PedidoProps[];
  pedidosHechos: PedidoProps[];
  pedidosCerca: PedidoProps[];
  pedidosEntregados: PedidoProps[];
  cadetes: string[];
}

export const OrderList: React.FC<OrderListProps> = ({
  seccionActiva,
  pedidosPorHacer,
  pedidosHechos,
  pedidosCerca,
  pedidosEntregados,
  cadetes,
}) => {
  return (
    <div>
      {seccionActiva === "porHacer" ? (
        <OrderSection orders={pedidosPorHacer} cadetes={cadetes} />
      ) : seccionActiva === "hechos" ? (
        <OrderSection orders={pedidosHechos} cadetes={cadetes} />
      ) : seccionActiva === "cerca" ? (
        <OrderSection orders={pedidosCerca} cadetes={cadetes} />
      ) : (
        seccionActiva === "entregados" && (
          <OrderSection orders={pedidosEntregados} cadetes={cadetes} />
        )
      )}
    </div>
  );
};
