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
import arrowIcon from "../assets/arrowIcon.png";

export const Comandera = () => {
	const [seccionActiva, setSeccionActiva] = useState("porHacer");
	const dispatch = useDispatch();
	const [sumaTotalPedidos, setSumaTotalPedidos] = useState(0);
	const [sumaTotalEfectivo, setSumaTotalEfectivo] = useState(0);
	const [selectedCadete, setSelectedCadete] = useState<string | null>(null);
	const [cadetes, setCadetes] = useState<string[]>([]);
	const [empleados, setEmpleados] = useState<EmpleadosProps[]>([]);
	const [, setTick] = useState(0);
	const [gruposOptimos, setGruposOptimos] = useState([]);

	const { orders } = useSelector((state: RootState) => state.data);
	const location = useLocation();

	// Coordenadas del punto de partida (Neri Guerra 352, Río Cuarto)
	const puntoPartida = { lat: -33.0957994, lon: -64.3337817 };

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

	const ordersNotDelivered = useMemo(() => {
		return orders.filter(
			(order) => !order.entregado && order.cadete === "NO ASIGNADO"
		);
	}, [orders]);

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

	useEffect(() => {
		const timer = setInterval(() => {
			setTick((prev) => prev + 1);
		}, 60000); // Actualizar cada minuto

		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		// Efecto para rearmar los grupos cada vez que cambian las órdenes
		const armarGrupos = () => {
			const nuevosGrupos = armarGruposOptimos(ordersNotDelivered, puntoPartida);
			setGruposOptimos(nuevosGrupos);
		};

		armarGrupos();
	}, [ordersNotDelivered]);

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

	const cadetesDisponibles = empleados.filter(
		(empleado) => empleado.category === "cadete" && empleado.available === true
	);

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
		const distanciaLineal = R * c; // Distancia en línea recta en kilómetros

		// Aplicar factor de corrección para aproximar la distancia de manejo
		const factorCorreccion = 1.3; // Puedes ajustar este valor según sea necesario
		const distanciaEstimada = distanciaLineal * factorCorreccion;

		return parseFloat(distanciaEstimada.toFixed(2));
	}

	function calcularTiempoEnMoto(distanciaKm) {
		const velocidadPromedioKmPorHora = 32;
		const tiempoHoras = distanciaKm / velocidadPromedioKmPorHora;
		const tiempoMinutos = Math.round(tiempoHoras * 60);
		const factorCorreccion = 1.5; // Factor de corrección para acercarnos a estimaciones de Google Maps
		return Math.round(tiempoMinutos * factorCorreccion);
	}

	function obtenerOrdenMasCercana(grupoActual, ordenes) {
		let ordenMasCercana = null;
		let distanciaMinima = Infinity;

		ordenes.forEach((orden) => {
			let distanciaMinAGrupo = Infinity;

			// Calcular la distancia mínima a cualquier orden del grupo actual
			grupoActual.forEach((ordenGrupo) => {
				const distancia = calcularDistancia(
					ordenGrupo.map[0],
					ordenGrupo.map[1],
					orden.map[0],
					orden.map[1]
				);
				if (distancia < distanciaMinAGrupo) {
					distanciaMinAGrupo = distancia;
				}
			});

			if (distanciaMinAGrupo < distanciaMinima) {
				distanciaMinima = distanciaMinAGrupo;
				ordenMasCercana = {
					orden: orden,
					distancia: distanciaMinAGrupo,
					tiempoEstimado: calcularTiempoEnMoto(distanciaMinAGrupo),
				};
			}
		});

		return ordenMasCercana;
	}

	function armarGruposOptimos(ordersNotDelivered, puntoPartida) {
		const TIEMPO_MAXIMO_RECORRIDO = 40;
		let ordenesRestantes = [...ordersNotDelivered];
		let grupos = [];

		while (ordenesRestantes.length > 0) {
			let grupoActual = [];
			let tiempoTotalRecorrido = 0;

			// Agregar la primera orden (la más cercana al punto de partida)
			const primeraOrden = obtenerOrdenMasCercana(
				[{ map: [puntoPartida.lat, puntoPartida.lon] }],
				ordenesRestantes
			);
			grupoActual.push(primeraOrden.orden);
			tiempoTotalRecorrido += primeraOrden.tiempoEstimado;
			ordenesRestantes = ordenesRestantes.filter(
				(orden) => orden.id !== primeraOrden.orden.id
			);

			while (
				ordenesRestantes.length > 0 &&
				tiempoTotalRecorrido < TIEMPO_MAXIMO_RECORRIDO
			) {
				const ordenMasCercana = obtenerOrdenMasCercana(
					grupoActual,
					ordenesRestantes
				);

				if (
					tiempoTotalRecorrido + ordenMasCercana.tiempoEstimado >
					TIEMPO_MAXIMO_RECORRIDO
				) {
					break;
				}

				grupoActual.push(ordenMasCercana.orden);
				tiempoTotalRecorrido += ordenMasCercana.tiempoEstimado;
				ordenesRestantes = ordenesRestantes.filter(
					(orden) => orden.id !== ordenMasCercana.orden.id
				);
			}

			const pedidoMayorDemora = calcularPedidoMayorDemora(
				grupoActual,
				puntoPartida
			);

			grupos.push({
				grupo: grupoActual,
				tiempoTotal: tiempoTotalRecorrido,
				pedidoMayorDemora: pedidoMayorDemora,
			});
		}

		return optimizarGrupos(grupos, puntoPartida);
	}

	function calcularPedidoMayorDemora(grupo, puntoPartida) {
		let tiempoAcumulado = 0;
		let puntoAnterior = puntoPartida;

		return grupo.reduce(
			(mayorDemora, orden, index) => {
				const tiempoEspera = calcularMinutosTranscurridos(orden.hora);

				// Calcular el tiempo de viaje hasta esta orden
				const distancia = calcularDistancia(
					puntoAnterior.lat,
					puntoAnterior.lon,
					orden.map[0],
					orden.map[1]
				);
				const tiempoViaje = calcularTiempoEnMoto(distancia);
				tiempoAcumulado += tiempoViaje;

				const demoraTotalPedido = tiempoEspera + tiempoAcumulado;

				puntoAnterior = { lat: orden.map[0], lon: orden.map[1] };

				if (demoraTotalPedido > mayorDemora.demoraTotalPedido) {
					return { orden, demoraTotalPedido };
				}
				return mayorDemora;
			},
			{ orden: null, demoraTotalPedido: 0 }
		);
	}

	function optimizarGrupos(grupos, puntoPartida) {
		let huboMejora = true;
		while (huboMejora) {
			huboMejora = false;
			for (let i = 0; i < grupos.length; i++) {
				for (let j = i + 1; j < grupos.length; j++) {
					const mejora = intentarIntercambio(
						grupos[i],
						grupos[j],
						puntoPartida
					);
					if (mejora) {
						grupos[i] = mejora.grupo1;
						grupos[j] = mejora.grupo2;
						huboMejora = true;
					}
				}
			}
		}
		return grupos;
	}

	function intentarIntercambio(grupo1, grupo2, puntoPartida) {
		for (let i = 0; i < grupo1.grupo.length; i++) {
			for (let j = 0; j < grupo2.grupo.length; j++) {
				const nuevoGrupo1 = [
					...grupo1.grupo.slice(0, i),
					grupo2.grupo[j],
					...grupo1.grupo.slice(i + 1),
				];
				const nuevoGrupo2 = [
					...grupo2.grupo.slice(0, j),
					grupo1.grupo[i],
					...grupo2.grupo.slice(j + 1),
				];

				const tiempoNuevoGrupo1 = calcularTiempoTotalGrupo(
					nuevoGrupo1,
					puntoPartida
				);
				const tiempoNuevoGrupo2 = calcularTiempoTotalGrupo(
					nuevoGrupo2,
					puntoPartida
				);

				if (
					tiempoNuevoGrupo1 <= 40 &&
					tiempoNuevoGrupo2 <= 40 &&
					tiempoNuevoGrupo1 + tiempoNuevoGrupo2 <
						grupo1.tiempoTotal + grupo2.tiempoTotal
				) {
					return {
						grupo1: { grupo: nuevoGrupo1, tiempoTotal: tiempoNuevoGrupo1 },
						grupo2: { grupo: nuevoGrupo2, tiempoTotal: tiempoNuevoGrupo2 },
					};
				}
			}
		}
		return null;
	}

	function calcularTiempoTotalGrupo(grupo, puntoPartida) {
		let tiempoTotal = 0;
		let puntoAnterior = puntoPartida;
		grupo.forEach((orden) => {
			const distancia = calcularDistancia(
				puntoAnterior.lat,
				puntoAnterior.lon,
				orden.map[0],
				orden.map[1]
			);
			tiempoTotal += calcularTiempoEnMoto(distancia);
			puntoAnterior = { lat: orden.map[0], lon: orden.map[1] };
		});
		return tiempoTotal;
	}

	function calcularDistanciaTotal(grupoOrdenes, puntoPartida) {
		let distanciaTotal = 0;
		let puntoAnterior = puntoPartida;

		grupoOrdenes.forEach((orden) => {
			distanciaTotal += calcularDistancia(
				puntoAnterior.lat,
				puntoAnterior.lon,
				orden.map[0],
				orden.map[1]
			);
			puntoAnterior = { lat: orden.map[0], lon: orden.map[1] };
		});

		return parseFloat(distanciaTotal.toFixed(2));
	}

	const calcularMinutosTranscurridos = (horaString) => {
		const [horas, minutos] = horaString.split(":").map(Number);
		const fechaPedido = new Date();
		fechaPedido.setHours(horas, minutos, 0, 0);
		const ahora = new Date();
		const diferencia = ahora - fechaPedido;
		return Math.floor(diferencia / 60000); // Convertir milisegundos a minutos
	};

	return (
		<div className="p-4 flex flex-col">
			<div className="flex flex-col gap-2">
				<div className="flex items-center flex-row overflow-hidden">
					{/* Contenido de ScrollContainer comentado */}
				</div>
			</div>
			{/* Mostrar todos los grupos óptimos */}
			{gruposOptimos.map((grupo, index) => (
				<div
					key={index}
					className=" bg-gray-300  w-1/4 rounded-lg shadow-black shadow-lg"
				>
					<div className="flex flex-row justify-center gap-2 border-b border-black border-opacity-20 relative">
						<h3 className="font-bold text-lg pb-4 pt-4">
							Grupo óptimo {index + 1} en proceso...
						</h3>
						<div className="absolute left-12 top-1/2 transform -translate-y-1/2">
							<svg
								className="w-4 h-4 animate-spin text-gray-100"
								viewBox="0 0 64 64"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
							>
								<path
									d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
									stroke="currentColor"
									strokeWidth="5"
									strokeLinecap="round"
									strokeLinejoin="round"
								></path>
								<path
									d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
									stroke="currentColor"
									strokeWidth="5"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="text-gray-900"
								></path>
							</svg>
						</div>
					</div>
					{grupo.grupo.map((orden, ordenIndex) => (
						<div key={orden.id} className="pt-3  px-4">
							<p className="font-semibold">
								{ordenIndex + 1}. {orden.direccion.split(",")[0]}
							</p>
							<p>Demora: {calcularMinutosTranscurridos(orden.hora)} minutos</p>
						</div>
					))}
					<div className="pt-2 px-4">
						<p>
							<strong>Tiempo total estimado del recorrido:</strong>{" "}
							{grupo.tiempoTotal} minutos
						</p>
						<p>
							<strong>Distancia total del recorrido:</strong>{" "}
							{calcularDistanciaTotal(grupo.grupo, puntoPartida)} km
						</p>
					</div>
					{grupo.pedidoMayorDemora.orden && (
						<div className="mt-2 border-t pt-2">
							<p className="font-semibold">Pedido con mayor demora total:</p>
							<p>Dirección: {grupo.pedidoMayorDemora.orden.direccion}</p>
							<p>
								Demora total estimada:{" "}
								{grupo.pedidoMayorDemora.demoraTotalPedido} minutos
							</p>
						</div>
					)}
					<div className="px-4 pb-4">
						<div className="bg-black flex w-full  pt-2.5 pb-4 rounded-lg text-gray-100 items-center text-center justify-center font-medium mt-4 text-2xl  gap-2">
							<p>Asignar cadete</p>
							<img src={arrowIcon} className="h-2 rotate-90 invert" />
						</div>
					</div>
				</div>
			))}
			<CadeteSelect
				cadetes={cadetes}
				handleCadeteChange={handleCadeteChange}
				selectedCadete={selectedCadete}
				orders={pedidosHechos}
			/>
			{/* Botón para copiar direcciones */}
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
