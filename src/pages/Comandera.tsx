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
	const [tiempoMaximo, setTiempoMaximo] = useState(40);

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

	const customerSuccess =
		100 -
		(orders.filter((order) => order.dislike || order.delay).length * 100) /
			orders.length;

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

	const pedidosDisponibles = useMemo(() => {
		return orders.filter((order) => {
			if (order.cadete === "NO ASIGNADO" || order.cadete === "no asignado") {
				return true;
			}

			const cadeteAsignado = empleados.find(
				(empleado) =>
					empleado.name.toLowerCase() === order.cadete.toLowerCase() &&
					empleado.category === "cadete"
			);

			return cadeteAsignado && cadeteAsignado.available;
		});
	}, [orders, empleados]);

	useEffect(() => {
		console.log("Pedidos disponibles para barajar:", pedidosDisponibles);
	}, [pedidosDisponibles]);

	// Factor de corrección para ajustar la distancia lineal a la distancia real en la ciudad
	const FACTOR_CORRECCION = 1.5;

	// Función para calcular la distancia entre dos puntos usando la fórmula del haversine
	function calcularDistancia(lat1, lon1, lat2, lon2) {
		const R = 6371; // Radio de la Tierra en kilómetros
		const dLat = ((lat2 - lat1) * Math.PI) / 180;
		const dLon = ((lon2 - lon1) * Math.PI) / 180;
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos((lat1 * Math.PI) / 180) *
				Math.cos((lat2 * Math.PI) / 180) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		const distanciaLineal = R * c; // Distancia en kilómetros
		const distanciaAjustada = distanciaLineal * FACTOR_CORRECCION;
		return distanciaAjustada;
	}

	// Coordenadas del punto de partida (Neri Guerra 352, Río Cuarto)
	const LATITUD_INICIO = -33.0957994;
	const LONGITUD_INICIO = -64.3337817;

	// Función para calcular y agregar distancias a los pedidos
	function agregarDistanciasAPedidos(pedidos) {
		return pedidos.map((pedido) => {
			const [latitud, longitud] = pedido.map;
			const distancia = calcularDistancia(
				LATITUD_INICIO,
				LONGITUD_INICIO,
				latitud,
				longitud
			);
			return {
				...pedido,
				distancia: distancia.toFixed(2), // Distancia en km con 2 decimales
			};
		});
	}

	// Uso en el componente Comandera
	const pedidosConDistancias = useMemo(() => {
		return agregarDistanciasAPedidos(pedidosDisponibles);
	}, [pedidosDisponibles]);

	useEffect(() => {
		console.log("Pedidos disponibles con distancias:", pedidosConDistancias);
	}, [pedidosConDistancias]);

	function encontrarPedidoMasCercano(pedidos) {
		return pedidos.reduce((pedidoMasCercano, pedidoActual) => {
			return parseFloat(pedidoActual.distancia) <
				parseFloat(pedidoMasCercano.distancia)
				? pedidoActual
				: pedidoMasCercano;
		});
	}

	// Uso en el componente
	const pedidoMasCercano = useMemo(() => {
		return encontrarPedidoMasCercano(pedidosConDistancias);
	}, [pedidosConDistancias]);

	useEffect(() => {
		console.log("Pedido más cercano:", pedidoMasCercano);
	}, [pedidoMasCercano]);

	// Nueva función para armar grupos óptimos
	function armarGruposOptimos(pedidos) {
		if (pedidos.length === 0) return [];

		const gruposOptimos = [];
		let pedidosRestantes = [...pedidos];

		while (pedidosRestantes.length > 0) {
			const grupoActual = [];

			// Encuentra el pedido más cercano al punto de origen
			const pedidoMasCercano = encontrarPedidoMasCercano(pedidosRestantes);
			grupoActual.push(pedidoMasCercano);
			pedidosRestantes = pedidosRestantes.filter(
				(p) => p.id !== pedidoMasCercano.id
			);

			if (pedidosRestantes.length > 0) {
				// Encuentra el pedido más cercano al pedido más cercano
				const segundoPedido = pedidosRestantes.reduce(
					(masCercano, pedidoActual) => {
						const distancia = calcularDistancia(
							pedidoMasCercano.map[0],
							pedidoMasCercano.map[1],
							pedidoActual.map[0],
							pedidoActual.map[1]
						);
						if (!masCercano || distancia < masCercano.distancia) {
							return { ...pedidoActual, distancia };
						}
						return masCercano;
					},
					null
				);

				if (segundoPedido) {
					grupoActual.push(segundoPedido);
					pedidosRestantes = pedidosRestantes.filter(
						(p) => p.id !== segundoPedido.id
					);
				}
			}

			gruposOptimos.push(grupoActual);
		}

		return gruposOptimos;
	}

	// Uso de la función para armar grupos óptimos
	const gruposOptimos = useMemo(() => {
		return armarGruposOptimos(pedidosConDistancias);
	}, [pedidosConDistancias]);

	useEffect(() => {
		console.log("Grupos óptimos de pedidos:", gruposOptimos);
	}, [gruposOptimos]);

	return (
		<div className="p-4 flex flex-col">
			{/* Aca el algoritmo de entregas eficientes a traves de grupos optimos */}
			<div>
				<div className="mb-4 flex flex-row gap-2 items-center justify-center">
					<label htmlFor="tiempoMaximo" className="  font-medium text-gray-700">
						Tiempo máximo de entrega:
					</label>
					<select
						id="tiempoMaximo"
						value={tiempoMaximo}
						onChange={(e) => setTiempoMaximo(parseInt(e.target.value))}
						className="  bg-gray-300  pt-2 pb-3 px-2.5 font-medium border-gray-300 rounded-full"
					>
						<option value={30}>30 minutos</option>
						<option value={40}>40 minutos</option>
						<option value={50}>50 minutos</option>
						<option value={60}>60 minutos</option>
					</select>
				</div>
				<div className="flex flex-row gap-4">
					{gruposOptimos.map((grupo, index) => (
						<div
							key={index}
							className="bg-gray-300 shadow-black w-1/4  shadow-lg p-4 mb-4 rounded-lg"
						>
							<div className="flex justify-center">
								<h3 className="font-bold mt-4 ">Grupo óptimo {index + 1}</h3>
							</div>
							{grupo.map((pedido, pedidoIndex) => (
								<div key={pedido.id} className="bg-white p-2 mb-2 rounded">
									<p>
										<strong>Pedido {pedidoIndex + 1}:</strong>
									</p>
									<p>Dirección: {pedido.direccion}</p>
									<p>Distancia: {pedido.distancia} km</p>
								</div>
							))}
						</div>
					))}
				</div>
			</div>
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
