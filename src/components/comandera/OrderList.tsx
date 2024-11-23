import React, { useEffect, useState } from "react";
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
	// Estado para almacenar los pedidos reordenados
	const [pedidosOrdenados, setPedidosOrdenados] = useState<PedidoProps[]>([]);

	// Función para reordenar los pedidos
	const reorderPedidos = (pedidos: PedidoProps[]): PedidoProps[] => {
		return pedidos.sort((a, b) => {
			if (a.cookNow && !b.cookNow) return -1;
			if (!a.cookNow && b.cookNow) return 1;
			return 0;
		});
	};

	// Observa cambios en la longitud del array de pedidos
	useEffect(() => {
		setPedidosOrdenados(reorderPedidos(pedidosPorHacer));
	}, [pedidosPorHacer.length]); // Dependencia: solo la longitud del array

	return (
		<div>
			{seccionActiva === "porHacer" ? (
				<OrderSection orders={pedidosOrdenados} cadetes={cadetes} />
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
