import React, { useEffect, useState, useMemo } from "react";
import { RootState } from "../redux/configureStore";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { GeneralStats, OrderList } from "../components/comandera";
import { NavButtons } from "../components/comandera/NavButtons";
import CadeteSelect from "../components/Cadet/CadeteSelect";
import { EmpleadosProps, readEmpleados } from "../firebase/registroEmpleados";
import { ReadOrdersForToday } from "../firebase/ReadData";
import { PedidoProps } from "../types/types";
import { readOrdersData } from "../redux/data/dataAction";
import { DeliveryMap } from "../components/maps/DeliveryMap";
import RegistroEmpleado from "./Empleados";

export const Comandera = () => {
	const [seccionActiva, setSeccionActiva] = useState("porHacer");
	const dispatch = useDispatch();
	const [sumaTotalPedidos, setSumaTotalPedidos] = useState(0);
	const [sumaTotalEfectivo, setSumaTotalEfectivo] = useState(0);
	const [selectedCadete, setSelectedCadete] = useState<string | null>(null);
	const [cadetes, setCadetes] = useState<string[]>([]);
	const [empleados, setEmpleados] = useState<EmpleadosProps[]>([]);
	const { orders } = useSelector((state: RootState) => state.data);
	const location = useLocation();

	const filteredOrders = useMemo(() => {
		return orders
			.filter((o) => !selectedCadete || o.cadete === selectedCadete)
			.sort((a, b) => {
				const [horaA, minutosA] = a.hora.split(":").map(Number);
				const [horaB, minutosB] = b.hora.split(":").map(Number);
				return horaA * 60 + minutosA - (horaB * 60 + minutosB);
			});
	}, [orders, selectedCadete]);

	const pedidosPorHacer = useMemo(() => {
		return filteredOrders.filter((o) => !o.elaborado && !o.entregado);
	}, [filteredOrders]);

	const pedidosHechos = useMemo(() => {
		return filteredOrders.filter((o) => o.elaborado && !o.entregado);
	}, [filteredOrders]);

	const pedidosEntregados = useMemo(() => {
		return filteredOrders.filter((o) => o.entregado);
	}, [filteredOrders]);

	useEffect(() => {
		const obtenerCadetes = async () => {
			try {
				const empleados = await readEmpleados();
				setEmpleados(empleados);
				const cadetesFiltrados = empleados
					.filter((empleado) => empleado.category === "cadete")
					.map((empleado) => empleado.name);
				setCadetes(cadetesFiltrados);
			} catch (error) {
				console.error("Error al obtener los cadetes:", error);
			}
		};
		obtenerCadetes();
		if (location.pathname === "/comandas") {
			const unsubscribe = ReadOrdersForToday(async (pedidos: PedidoProps[]) => {
				dispatch(readOrdersData(pedidos));
			});
			return () => {
				unsubscribe();
			};
		}
	}, [dispatch, location]);

	const handleCadeteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const nuevoCadeteSeleccionado = event.target.value;
		if (nuevoCadeteSeleccionado === "") {
			setSelectedCadete(null);
			return;
		}
		setSelectedCadete(nuevoCadeteSeleccionado);
		const totalPedidosCadete = orders.reduce((total, pedido) => {
			if (pedido.cadete === nuevoCadeteSeleccionado) {
				return total + 1;
			} else {
				return total;
			}
		}, 0);
		setSumaTotalPedidos(totalPedidosCadete);
		const totalEfectivoCadete = orders.reduce((total, pedido) => {
			if (
				pedido.cadete === nuevoCadeteSeleccionado &&
				pedido.metodoPago === "efectivo"
			) {
				return total + pedido.total;
			} else {
				return total;
			}
		}, 0);
		setSumaTotalEfectivo(totalEfectivoCadete);
	};

	const customerSuccess =
		100 -
		(orders.filter((order) => order.dislike || order.delay).length * 100) /
			orders.length;

	return (
		<div className="p-4 flex flex-col">
			<CadeteSelect
				cadetes={cadetes}
				handleCadeteChange={handleCadeteChange}
				selectedCadete={selectedCadete}
				orders={pedidosHechos}
			/>
			<button
				className="bg-red-main text-white font-coolvetica font-bold p-2 rounded-lg"
				onClick={() => {
					const ordersByDate = orders.reduce((acc, order) => {
						const date = order.fecha;
						if (!acc[date]) {
							acc[date] = [];
						}
						acc[date].push(order.direccion);
						return acc;
					}, {} as Record<string, string[]>);
					navigator.clipboard.writeText(JSON.stringify(ordersByDate));
				}}
			>
				Copiar direcciones
			</button>
			<GeneralStats
				customerSuccess={customerSuccess}
				orders={orders}
				cadeteSeleccionado={selectedCadete}
				sumaTotalPedidos={sumaTotalPedidos}
				sumaTotalEfectivo={sumaTotalEfectivo}
				empleados={empleados}
			/>
			<NavButtons
				seccionActiva={seccionActiva}
				setSeccionActiva={setSeccionActiva}
			/>
			<OrderList
				seccionActiva={seccionActiva}
				pedidosPorHacer={pedidosPorHacer}
				pedidosHechos={pedidosHechos}
				pedidosEntregados={seccionActiva !== "mapa" ? pedidosEntregados : []}
				cadetes={cadetes}
			/>
			<div className="mt-2">
				{seccionActiva === "mapa" &&
					(location.pathname === "/comandas" ? (
						<DeliveryMap orders={[...pedidosHechos, ...pedidosPorHacer]} />
					) : (
						<DeliveryMap orders={orders} />
					))}
			</div>
			<div className="mt-2">
				{seccionActiva === "registro" && <RegistroEmpleado />}
			</div>
		</div>
	);
};
