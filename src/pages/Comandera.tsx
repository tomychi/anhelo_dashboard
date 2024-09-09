import React, { useEffect, useState, useMemo, useCallback } from "react";
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
	const isNotAssigned = (cadete) => {
		return (
			cadete === "NO ASIGNADO" || cadete === "no asignado" || cadete === null
		);
	};
	const cadetesDisponibles = useMemo(() => {
		return empleados.filter(
			(empleado) =>
				empleado.category === "cadete" && empleado.available === true
		);
	}, [empleados]);
	const shouldIncludeOrder = useCallback(
		(orden) => {
			if (isNotAssigned(orden.cadete)) return true;
			const cadete = cadetesDisponibles.find(
				(c) => c.name.toLowerCase() === orden.cadete.toLowerCase()
			);
			return cadete && cadete.available;
		},
		[cadetesDisponibles]
	);
	const ordersNotDelivered = useMemo(() => {
		return orders.filter(
			(order) => !order.entregado && shouldIncludeOrder(order)
		);
	}, [orders, shouldIncludeOrder]);
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
	const armarGruposOptimos = useCallback(
		(ordersNotDelivered, puntoPartida) => {
			const TIEMPO_MAXIMO_RECORRIDO = 30;
			let ordenesRestantes = ordersNotDelivered.filter((orden) => {
				const demora = calcularMinutosTranscurridos(orden.hora);
				return demora !== null && shouldIncludeOrder(orden);
			});
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
				grupos.push(
					recalcularGrupo(
						{
							grupo: grupoActual,
							tiempoTotal: tiempoTotalRecorrido,
						},
						puntoPartida
					)
				);
			}
			return optimizarGruposGlobal(grupos, puntoPartida);
		},
		[shouldIncludeOrder]
	);
	const nuevosGrupos = useMemo(() => {
		return armarGruposOptimos(ordersNotDelivered, puntoPartida);
	}, [ordersNotDelivered, puntoPartida, armarGruposOptimos]);
	useEffect(() => {
		if (JSON.stringify(nuevosGrupos) !== JSON.stringify(gruposOptimos)) {
			setGruposOptimos(nuevosGrupos);
		}
	}, [nuevosGrupos, gruposOptimos]);
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
	function optimizarGruposGlobal(grupos, puntoPartida) {
		let mejorConfiguracion = [...grupos];
		let mejorPuntuacion = evaluarConfiguracion(grupos);
		// Intentar mover cada orden a cada grupo
		for (let i = 0; i < grupos.length; i++) {
			for (let j = 0; j < grupos[i].grupo.length; j++) {
				for (let k = 0; k < grupos.length; k++) {
					if (i !== k) {
						let nuevaConfiguracion = JSON.parse(JSON.stringify(grupos));
						const orden = nuevaConfiguracion[i].grupo.splice(j, 1)[0];
						nuevaConfiguracion[k].grupo.push(orden);
						// Recalcular tiempos y distancias
						nuevaConfiguracion[i] = recalcularGrupo(
							nuevaConfiguracion[i],
							puntoPartida
						);
						nuevaConfiguracion[k] = recalcularGrupo(
							nuevaConfiguracion[k],
							puntoPartida
						);
						const nuevaPuntuacion = evaluarConfiguracion(nuevaConfiguracion);
						if (nuevaPuntuacion > mejorPuntuacion) {
							mejorConfiguracion = nuevaConfiguracion;
							mejorPuntuacion = nuevaPuntuacion;
						}
					}
				}
			}
		}
		// Eliminar grupos vacíos
		return mejorConfiguracion.filter((grupo) => grupo.grupo.length > 0);
	}
	function evaluarConfiguracion(grupos) {
		const numGrupos = grupos.length;
		const tiempoTotalTodos = grupos.reduce(
			(total, grupo) => total + grupo.tiempoTotal,
			0
		);
		const tamañoPromedio =
			grupos.reduce((total, grupo) => total + grupo.grupo.length, 0) /
			numGrupos;
		// Calcular la varianza en los tiempos de los grupos
		const varianzaTiempos =
			grupos.reduce((varianza, grupo) => {
				return (
					varianza +
					Math.pow(grupo.tiempoTotal - tiempoTotalTodos / numGrupos, 2)
				);
			}, 0) / numGrupos;
		// Calcular la varianza en el número de órdenes por grupo
		const varianzaTamaños =
			grupos.reduce((varianza, grupo) => {
				return varianza + Math.pow(grupo.grupo.length - tamañoPromedio, 2);
			}, 0) / numGrupos;
		// Puntuar la configuración (ajusta estos pesos según tus prioridades)
		const puntuacion =
			(1 / numGrupos) * 100 + // Menos grupos es mejor
			(1 / tiempoTotalTodos) * 1000 + // Menos tiempo total es mejor
			(1 / varianzaTiempos) * 10 + // Menos varianza en tiempos es mejor
			(1 / varianzaTamaños) * 10; // Menos varianza en tamaños es mejor
		return puntuacion;
	}
	function recalcularGrupo(grupo, puntoPartida) {
		let tiempoTotal = 0;
		let distanciaTotal = 0;
		let puntoAnterior = puntoPartida;
		let pedidoMayorDemora = { orden: null, demoraTotalPedido: 0 };
		grupo.grupo.forEach((orden, index) => {
			const distancia = calcularDistancia(
				puntoAnterior.lat,
				puntoAnterior.lon,
				orden.map[0],
				orden.map[1]
			);
			const tiempoViaje = calcularTiempoEnMoto(distancia);
			tiempoTotal += tiempoViaje;
			distanciaTotal += distancia;
			const demoraPedido = calcularMinutosTranscurridos(orden.hora);
			const demoraTotalPedido = demoraPedido + tiempoTotal;
			if (demoraTotalPedido > pedidoMayorDemora.demoraTotalPedido) {
				pedidoMayorDemora = { orden, demoraTotalPedido };
			}
			puntoAnterior = { lat: orden.map[0], lon: orden.map[1] };
		});
		return {
			grupo: grupo.grupo,
			tiempoTotal: Math.round(tiempoTotal),
			distanciaTotal: parseFloat(distanciaTotal.toFixed(2)),
			pedidoMayorDemora,
		};
	}
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
	function calcularMinutosTranscurridos(horaString) {
		const [horas, minutos] = horaString.split(":").map(Number);
		const fechaPedido = new Date();
		fechaPedido.setHours(horas, minutos, 0, 0);
		const ahora = new Date();
		const diferencia = ahora - fechaPedido;
		const minutosTranscurridos = Math.floor(diferencia / 60000); // Convertir milisegundos a minutos
		return minutosTranscurridos >= 0 ? minutosTranscurridos : null; // Retorna null solo si es una reserva futura
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
	return (
		<div className="p-4 flex flex-col">
			<div className="flex flex-col gap-2">
				<div className="flex items-center flex-row overflow-hidden">
					{/* Contenido de ScrollContainer comentado */}
				</div>
			</div>
			{/* Mostrar todos los grupos óptimos */}
			<div className="flex flex-row gap-4 ">
				{gruposOptimos.map((grupo, index) => (
					<div
						key={index}
						className=" bg-gray-300  w-1/4 rounded-lg shadow-black shadow-lg "
					>
						<div className="flex  justify-center gap-2  border-black border-opacity-20 ">
							<h3 className="font-bold text-xl pb-6 pt-6">
								Grupo óptimo {index + 1}
							</h3>
						</div>
						<div className="flex flex-col px-4  bg-gray-100  mx-4 mb-4 rounded-lg ">
							{grupo.grupo.map((orden, ordenIndex) => (
								<div
									key={orden.id}
									className=" border-b flex pt-3 pb-4 flex-row justify-between items-center gap-2  text-black  "
								>
									<div>
										<p className="font-semibold">
											{ordenIndex + 1}. {orden.direccion.split(",")[0]}
										</p>
										<p className="text-xs">
											Pidio hace:{" "}
											{calcularMinutosTranscurridos(orden.hora) ??
												"Reserva futura"}{" "}
											minutos
										</p>
										<p className="text-xs">Percibe entrega de 28 minutos</p>
									</div>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										className="h-6 w-6"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
										/>
									</svg>
								</div>
							))}
						</div>
						<div className="pt-2 px-4 border-t border-opacity-20 border-black mt-2  pt-2">
							<p className="font-semibold">
								Tiempo del recorrido: {grupo.tiempoTotal} minutos
							</p>
							<p className="font-semibold">
								Distancia del recorrido:{" "}
								{calcularDistanciaTotal(grupo.grupo, puntoPartida)} km
							</p>
						</div>
						{grupo.pedidoMayorDemora.orden && (
							<div className=" px-4">
								<p className="font-semibold">
									Pedido con peor entrega:{" "}
									{grupo.pedidoMayorDemora.demoraTotalPedido} minutos (
									{grupo.pedidoMayorDemora.orden.direccion.split(",")[0]})
								</p>
							</div>
						)}
						<div className="px-4 pb-4">
							<div className="bg-black flex w-full  pt-2.5 pb-4 rounded-lg text-gray-100 items-center text-center justify-center font-medium mt-4 text-2xl  gap-2">
								<p>Listo</p>
							</div>
						</div>
					</div>
				))}
			</div>
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
