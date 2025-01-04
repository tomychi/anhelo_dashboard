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
			// Primero priorizamos por envioExpress
			if (a.envioExpress && !b.envioExpress) return -1;
			if (!a.envioExpress && b.envioExpress) return 1;

			// Si el envioExpress es igual, entonces miramos cookNow
			if (a.cookNow && !b.cookNow) return -1;
			if (!a.cookNow && b.cookNow) return 1;

			return 0;
		});
	};

	useEffect(() => {
		console.log("Pedidos originales:", pedidosPorHacer);
		const ordenados = reorderPedidos(pedidosPorHacer);
		console.log("Pedidos reordenados:", ordenados);
		setPedidosOrdenados(ordenados);
	}, [pedidosPorHacer]);

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
