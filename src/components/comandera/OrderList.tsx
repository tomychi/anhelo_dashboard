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
	// Función para reordenar los pedidos por hacer
	const reorderPedidosPorHacer = (pedidos: PedidoProps[]): PedidoProps[] => {
		if (pedidos.length <= 1) return pedidos;

		const [primerPedido, ...restosPedidos] = pedidos;

		// Ordenar el resto de pedidos poniendo primero los que tienen cookNow: true
		const pedidosOrdenados = restosPedidos.sort((a, b) => {
			if (a.cookNow && !b.cookNow) return -1;
			if (!a.cookNow && b.cookNow) return 1;
			return 0;
		});

		// Retornar el array con el primer pedido en su posición original
		return [primerPedido, ...pedidosOrdenados];
	};

	return (
		<div>
			{seccionActiva === "porHacer" ? (
				<OrderSection
					orders={reorderPedidosPorHacer(pedidosPorHacer)}
					cadetes={cadetes}
				/>
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
