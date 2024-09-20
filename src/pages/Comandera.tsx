import React, { useEffect, useState, useMemo, useRef } from "react";
import { RootState } from "../redux/configureStore";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { GeneralStats, OrderList } from "../components/comandera";
import { CardComanda } from "../components/comandera/Card/CardComanda";
import { NavButtons } from "../components/comandera/NavButtons";
import CadeteSelect from "../components/Cadet/CadeteSelect";
import { Unsubscribe } from "firebase/firestore";
import Sidebar from "../components/comandera/Sidebar";
import {
	EmpleadosProps,
	VueltasProps,
	listenToEmpleadosChanges,
} from "../firebase/registroEmpleados";
import { ReadOrdersForToday } from "../firebase/ReadData";
import { Cadete, PedidoProps, Vuelta } from "../types/types";
import { readOrdersData } from "../redux/data/dataAction";
import { DeliveryMap } from "../components/maps/DeliveryMap";
import arrowIcon from "../assets/arrowIcon.png";
import listoIcon from "../assets/listoIcon.png";
import Swal from "sweetalert2";
import { updateCadeteForOrder, updateOrderTime } from "../firebase/UploadOrder";
import { obtenerHoraActual } from "../helpers/dateToday";
import RegistroEmpleado from "./Empleados";
import {
	DragDropContext,
	Droppable,
	Draggable,
	DropResult,
} from "react-beautiful-dnd";
import { VueltaInfo } from "../firebase/Cadetes";

// Definición de tipos

interface PedidosGrupos extends PedidoProps {
	distancia?: number;
	tiempoPercibido?: number;
	tiempoEspera?: number;
}

type Grupo = {
	pedidos: PedidosGrupos[];
	tiempoTotal: number;
	distanciaTotal: number;
	peorTiempoPercibido: number;
	pedidoPeorTiempo: PedidoProps | null;
	horaRegreso?: string;
};

export const Comandera: React.FC = () => {
	const [seccionActiva, setSeccionActiva] = useState<string>("porHacer");
	const dispatch = useDispatch();
	const [sumaTotalPedidos, setSumaTotalPedidos] = useState<number>(0);
	const [sumaTotalEfectivo, setSumaTotalEfectivo] = useState<number>(0);
	const [selectedCadete, setSelectedCadete] = useState<string | null>(null);
	const [cadetes, setCadetes] = useState<string[]>([]);
	const [empleados, setEmpleados] = useState<EmpleadosProps[]>([]);

	const { orders } = useSelector((state: RootState) => state.data);
	const [pedidosPrioritarios, setPedidosPrioritarios] = useState<PedidoProps[]>(
		[]
	);

	const { user } = useSelector((state: RootState) => state.auth);
	const location = useLocation();
	const [tiempoMaximo, setTiempoMaximo] = useState<number | null>(null);

	const [tiempoMaximoRecorrido, setTiempoMaximoRecorrido] = useState<
		number | null
	>(null);

	const [modoAgrupacion, setModoAgrupacion] = useState<"entrega" | "recorrido">(
		"entrega"
	);
	const [tiempoActual, setTiempoActual] = useState<Date>(new Date());
	const [gruposListos, setGruposListos] = useState<Grupo[]>([]);
	const [gruposOptimos, setGruposOptimos] = useState<Grupo[]>([]);
	const [grupoManual, setGrupoManual] = useState<PedidoProps[]>([]);
	const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
		{}
	);
	const [tooltipVisibility, setTooltipVisibility] = useState<
		Record<string, boolean>
	>({});

	// Nuevo estado para la velocidad promedio
	const [velocidadPromedio, setVelocidadPromedio] = useState<number | null>(
		null
	);

	// Nueva función para obtener la velocidad actual
	const getVelocidadActual = () => {
		return velocidadPromedio || VELOCIDAD_PROMEDIO_MOTO;
	};

	useEffect(() => {
		const timer = setInterval(() => {
			setTiempoActual(new Date());
		}, 60000); // Actualiza cada minuto
		return () => clearInterval(timer);
	}, []);

	const calcularTiempoEspera = (horaPedido: string): number => {
		const [horas, minutos] = horaPedido.split(":").map(Number);
		const fechaPedido = new Date(tiempoActual);
		fechaPedido.setHours(horas, minutos, 0, 0);
		const diferencia = tiempoActual.getTime() - fechaPedido.getTime();
		const minutosEspera = Math.floor(diferencia / 60000);
		return minutosEspera;
	};

	const handleDeshacerGrupo = async (index: number) => {
		setLoadingStates((prev) => ({ ...prev, [index]: true }));
		try {
			const grupoActualizado = gruposListos[index];
			// Aquí iría la lógica para deshacer el grupo
			for (const pedido of grupoActualizado.pedidos) {
				await updateCadeteForOrder(pedido.fecha, pedido.id, "NO ASIGNADO");
			}
			setGruposListos((prevGrupos) => prevGrupos.filter((_, i) => i !== index));
			Swal.fire({
				icon: "success",
				title: "Grupo deshecho",
				text: "El grupo ha sido deshecho exitosamente.",
			});
		} catch (error) {
			Swal.fire({
				icon: "error",
				title: "Error",
				text: "Hubo un problema al deshacer el grupo.",
			});
			console.error("Error al deshacer el grupo:", error);
		} finally {
			setLoadingStates((prev) => ({ ...prev, [index]: false }));
		}
	};

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
		let unsubscribeEmpleados: Unsubscribe | null = null;
		let unsubscribeOrders: Unsubscribe | null = null;
		const iniciarEscuchas = async () => {
			unsubscribeEmpleados = listenToEmpleadosChanges(
				(empleadosActualizados) => {
					setEmpleados(empleadosActualizados);
					const cadetesFiltrados = empleadosActualizados
						.filter((empleado) => empleado.category === "cadete")
						.map((empleado) => empleado.name);
					setCadetes(cadetesFiltrados);
				}
			);
			if (location.pathname === "/comandas") {
				unsubscribeOrders = ReadOrdersForToday(
					async (pedidos: PedidoProps[]) => {
						dispatch(readOrdersData(pedidos));
					}
				);
			}
		};
		iniciarEscuchas();
		return () => {
			if (unsubscribeEmpleados) {
				unsubscribeEmpleados();
			}
			if (unsubscribeOrders) {
				unsubscribeOrders();
			}
		};
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

	const pedidosReserva = useMemo(() => {
		return orders.filter((order) => order.hora > obtenerHoraActual());
	}, [orders, tiempoActual]);

	const pedidosDisponibles = useMemo(() => {
		return orders.filter((order) => {
			if (order.hora > obtenerHoraActual()) {
				return false; // Este es un pedido de reserva
			}
			if (order.cadete === "NO ASIGNADO" || order.cadete === "no asignado") {
				return true;
			}
			if (order.entregado) {
				return false;
			}
			const cadeteAsignado = empleados.find(
				(empleado) =>
					empleado.name.toLowerCase() === order.cadete.toLowerCase() &&
					empleado.category === "cadete"
			);
			return cadeteAsignado && cadeteAsignado.available;
		});
	}, [orders, empleados, tiempoActual]);

	const FACTOR_CORRECCION = 1.455;
	function calcularDistancia(
		lat1: number,
		lon1: number,
		lat2: number,
		lon2: number
	): number {
		const R = 6371;
		const dLat = ((lat2 - lat1) * Math.PI) / 180;
		const dLon = ((lon2 - lon1) * Math.PI) / 180;
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos((lat1 * Math.PI) / 180) *
				Math.cos((lat2 * Math.PI) / 180) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		const distanciaLineal = R * c;
		const distanciaAjustada = distanciaLineal * FACTOR_CORRECCION;
		return distanciaAjustada;
	}

	const LATITUD_INICIO = -33.0957994;
	const LONGITUD_INICIO = -64.3337817;
	function agregarDistanciasAPedidos(pedidos: PedidoProps[]): PedidoProps[] {
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
				distancia: distancia.toFixed(2),
			};
		});
	}

	const pedidosConDistancias = useMemo(() => {
		return agregarDistanciasAPedidos(pedidosDisponibles);
	}, [pedidosDisponibles]);

	const VELOCIDAD_PROMEDIO_MOTO = 27.3425;
	// const VELOCIDAD_PROMEDIO_MOTO = 35;
	// Esto lo reemplazamos por el promedio de los cadetes disponibles
	const TIEMPO_POR_ENTREGA = 0;
	// const TIEMPO_POR_ENTREGA = 3;
	// Esto lo quitamos porque las demoras por entrega ya se ven reflejadas en la velocidad promedio de cada cadete
	function calcularTiempoYDistanciaRecorrido(
		grupo: PedidoProps[],
		latitudInicio: number,
		longitudInicio: number
	): { tiempoTotal: number; distanciaTotal: number } {
		let tiempoTotal = 0;
		let distanciaTotal = 0;
		let latitudActual = latitudInicio;
		let longitudActual = longitudInicio;
		const velocidadActual = getVelocidadActual();
		grupo.forEach((pedido, index) => {
			const distancia = calcularDistancia(
				latitudActual,
				longitudActual,
				pedido.map[0],
				pedido.map[1]
			);
			distanciaTotal += distancia;
			const tiempoViaje = (distancia / velocidadActual) * 60;
			tiempoTotal += tiempoViaje;
			if (index < grupo.length - 1) {
				tiempoTotal += TIEMPO_POR_ENTREGA;
			}
			latitudActual = pedido.map[0];
			longitudActual = pedido.map[1];
		});
		const factorAjuste = 1;
		// const factorAjuste = 1.1;
		// Esto lo quitamos porque las demoras por 'factor ajuste' ya se ven reflejadas en la velocidad promedio de cada cadete
		tiempoTotal *= factorAjuste;
		return {
			tiempoTotal: Math.round(tiempoTotal),
			distanciaTotal: Number(distanciaTotal.toFixed(2)),
		};
	}

	const calcularVelocidadPromedio = (cadete: EmpleadosProps) => {
		if (!cadete.vueltas || cadete.vueltas.length === 0) {
			// console.log("No hay vueltas registradas, usando velocidad por defecto.");
			return VELOCIDAD_PROMEDIO_MOTO;
		}

		const ultimasVueltas = cadete.vueltas.slice(-5);
		// console.log(`Número de vueltas consideradas: ${ultimasVueltas.length}`);

		let distanciaTotal = 0;
		let tiempoTotal = 0;

		ultimasVueltas.forEach((vuelta: VueltasProps) => {
			if (vuelta.totalDistance && vuelta.totalDuration) {
				distanciaTotal += vuelta.totalDistance;
				tiempoTotal += vuelta.totalDuration;
				// console.log(
				// 	`Vuelta ${index + 1}: Distancia = ${vuelta.totalDistance.toFixed(
				// 		2
				// 	)} km, Tiempo = ${vuelta.totalDuration.toFixed(2)} min`
				// );
			} else {
				// console.log(`Vuelta ${index + 1}: Datos incompletos`);
			}
		});

		// console.log(`Distancia total: ${distanciaTotal.toFixed(2)} km`);
		// console.log(`Tiempo total: ${tiempoTotal.toFixed(2)} min`);

		if (tiempoTotal === 0) {
			// console.log("Tiempo total es cero, usando velocidad por defecto.");
			return VELOCIDAD_PROMEDIO_MOTO;
		}

		const velocidadPromedio = (distanciaTotal / tiempoTotal) * 60;
		// console.log(
		// 	`Velocidad promedio calculada: ${velocidadPromedio.toFixed(2)} km/h`
		// );

		return Number(velocidadPromedio.toFixed(2));
	};

	const handleCadeteVelocidadChange = (
		e: React.ChangeEvent<HTMLSelectElement>
	) => {
		const selectedCadeteId = e.target.value;
		const selectedCadete = cadetesDisponibles.find(
			(cadete) => cadete.name === selectedCadeteId
		);
		if (selectedCadete) {
			const velocidad = calcularVelocidadPromedio(selectedCadete);
			setVelocidadPromedio(velocidad);
		} else {
			setVelocidadPromedio(null);
		}
	};

	function armarGruposOptimos(
		pedidos: PedidoProps[],
		tiempoMaximo: number | null,
		modoAgrupacion: string,
		pedidosPrioritarios: PedidoProps[]
	): Grupo[] {
		const pedidosDisponibles = pedidos.filter(
			(pedido) =>
				!gruposListos.some((grupo) =>
					grupo.pedidos.some((p) => p.id === pedido.id)
				) && !(pedido.map[0] === 0 && pedido.map[1] === 0)
		);

		const pedidosManuales = pedidos.filter(
			(pedido) =>
				pedido.map[0] === 0 &&
				pedido.map[1] === 0 &&
				!gruposListos.some((grupo) =>
					grupo.pedidos.some((p) => p.id === pedido.id)
				)
		);
		setGrupoManual(pedidosManuales);

		if (pedidosDisponibles.length === 0) return [];

		const gruposOptimos: Grupo[] = [];
		let pedidosRestantes = [...pedidosDisponibles];

		while (pedidosRestantes.length > 0) {
			const grupo = formarGrupo(
				pedidosRestantes,
				tiempoMaximo,
				modoAgrupacion,
				pedidosPrioritarios
			);
			gruposOptimos.push(grupo);
			pedidosRestantes = pedidosRestantes.filter(
				(pedido) => !grupo.pedidos.some((p) => p.id === pedido.id)
			);
			// Actualizar pedidosPrioritarios eliminando los que ya se han incluido en un grupo
			pedidosPrioritarios = pedidosPrioritarios.filter(
				(pedido) => !grupo.pedidos.some((p) => p.id === pedido.id)
			);
		}

		return gruposOptimos;
	}

	function formarGrupo(
		pedidosDisponibles: PedidoProps[],
		tiempoMaximo: number | null,
		modoAgrupacion: string,
		pedidosPrioritarios: PedidoProps[]
	): Grupo {
		const grupoActual: PedidosGrupos[] = [];
		let tiempoTotalGrupo = 0;
		let distanciaTotalGrupo = 0;
		let peorTiempoPercibido = 0;
		let pedidoPeorTiempo: PedidoProps | null = null;
		let latitudActual = LATITUD_INICIO;
		let longitudActual = LONGITUD_INICIO;

		// Comenzar con un pedido prioritario si existe
		let pedidoInicial =
			pedidosPrioritarios.length > 0 ? pedidosPrioritarios[0] : null;

		if (!pedidoInicial) {
			pedidoInicial = encontrarMejorPedido(
				pedidosDisponibles,
				latitudActual,
				longitudActual
			);
		}

		if (pedidoInicial) {
			const tiempoEspera = calcularTiempoEspera(pedidoInicial.hora);
			const distancia = calcularDistancia(
				latitudActual,
				longitudActual,
				pedidoInicial.map[0],
				pedidoInicial.map[1]
			);
			const tiempoViaje = (distancia / getVelocidadActual()) * 60;
			const tiempoPercibido = tiempoEspera + tiempoViaje;

			grupoActual.push({
				...pedidoInicial,
				tiempoPercibido: Math.round(tiempoPercibido),
			});

			tiempoTotalGrupo = tiempoViaje;
			distanciaTotalGrupo = distancia;
			peorTiempoPercibido = tiempoPercibido;
			pedidoPeorTiempo = pedidoInicial;

			latitudActual = pedidoInicial.map[0];
			longitudActual = pedidoInicial.map[1];
			pedidosDisponibles = pedidosDisponibles.filter(
				(p) => p.id !== pedidoInicial!.id
			);
		}

		while (pedidosDisponibles.length > 0) {
			let mejorPedido = encontrarMejorPedido(
				pedidosDisponibles,
				latitudActual,
				longitudActual
			);
			if (!mejorPedido) break;

			const nuevaRuta = [...grupoActual, mejorPedido];
			const { tiempoTotal, distanciaTotal } = calcularTiempoYDistanciaRecorrido(
				nuevaRuta,
				LATITUD_INICIO,
				LONGITUD_INICIO
			);

			const distanciaRegreso = calcularDistancia(
				mejorPedido.map[0],
				mejorPedido.map[1],
				LATITUD_INICIO,
				LONGITUD_INICIO
			);
			const tiempoRegreso = (distanciaRegreso / getVelocidadActual()) * 60;
			const tiempoTotalConRegreso = tiempoTotal + tiempoRegreso;
			const distanciaTotalConRegreso = distanciaTotal + distanciaRegreso;

			const tiempoEspera = calcularTiempoEspera(mejorPedido.hora);
			const tiempoPercibido = tiempoEspera + tiempoTotal;

			const excedeTiempoMaximo =
				tiempoMaximo !== null &&
				(modoAgrupacion === "entrega"
					? tiempoPercibido > tiempoMaximo
					: tiempoTotalConRegreso > tiempoMaximo);

			if (excedeTiempoMaximo && grupoActual.length > 0) {
				break;
			}

			grupoActual.push({
				...mejorPedido,
				tiempoPercibido: Math.round(tiempoPercibido),
			});
			tiempoTotalGrupo = tiempoTotalConRegreso;
			distanciaTotalGrupo = distanciaTotalConRegreso;

			if (tiempoPercibido > peorTiempoPercibido) {
				peorTiempoPercibido = tiempoPercibido;
				pedidoPeorTiempo = mejorPedido;
			}

			latitudActual = mejorPedido.map[0];
			longitudActual = mejorPedido.map[1];
			pedidosDisponibles = pedidosDisponibles.filter(
				(p) => p.id !== mejorPedido!.id
			);
		}

		return {
			pedidos: grupoActual,
			tiempoTotal: Math.round(tiempoTotalGrupo),
			distanciaTotal: Number(distanciaTotalGrupo.toFixed(2)),
			peorTiempoPercibido: Math.round(peorTiempoPercibido),
			pedidoPeorTiempo,
		};
	}

	function encontrarMejorPedido(
		pedidosDisponibles: PedidoProps[],
		latitudActual: number,
		longitudActual: number
	): PedidoProps | null {
		let mejorPedido: PedidoProps | null = null;
		let mejorDistancia = Infinity;

		for (const pedido of pedidosDisponibles) {
			const distancia = calcularDistancia(
				latitudActual,
				longitudActual,
				pedido.map[0],
				pedido.map[1]
			);

			if (distancia < mejorDistancia) {
				mejorDistancia = distancia;
				mejorPedido = pedido;
			}
		}

		return mejorPedido;
	}

	const gruposOptimosMemo = useMemo(() => {
		const tiempoMaximoActual =
			modoAgrupacion === "entrega" ? tiempoMaximo : tiempoMaximoRecorrido;
		return armarGruposOptimos(
			pedidosConDistancias,
			tiempoMaximoActual,
			modoAgrupacion,
			pedidosPrioritarios
		);
	}, [
		pedidosConDistancias,
		tiempoMaximo,
		tiempoMaximoRecorrido,
		modoAgrupacion,
		gruposListos,
		pedidosPrioritarios,
		velocidadPromedio, // Agregamos velocidadPromedio como dependencia
	]);

	useEffect(() => {
		setGruposOptimos(gruposOptimosMemo);
	}, [gruposOptimosMemo]);

	const handleGrupoListo = (grupo: Grupo) => {
		const horaActual = new Date();
		const horaRegreso = new Date(
			horaActual.getTime() + grupo.tiempoTotal * 60000
		);
		const horaRegresoFormateada = horaRegreso.toLocaleTimeString("es-ES", {
			hour: "2-digit",
			minute: "2-digit",
		});
		setGruposListos([
			...gruposListos,
			{
				...grupo,
				horaRegreso: horaRegresoFormateada,
			},
		]);
	};
	const cadetesDisponibles = useMemo(() => {
		return empleados.filter(
			(empleado) => empleado.category === "cadete" && empleado.available
		);
	}, [empleados]);

	const handleAsignarCadete = async (
		grupoIndex: number,
		cadeteId: string,
		esGrupoListo: boolean = false
	) => {
		const loadingKey = `asignar-${grupoIndex}`;
		setLoadingStates((prev) => ({ ...prev, [loadingKey]: true }));

		try {
			let grupoActualizado: Grupo;
			if (esGrupoListo) {
				const nuevosGruposListos = [...gruposListos];
				grupoActualizado = { ...nuevosGruposListos[grupoIndex] };
				grupoActualizado.pedidos = grupoActualizado.pedidos.map((pedido) => ({
					...pedido,
					cadete: cadeteId,
				}));
				nuevosGruposListos[grupoIndex] = grupoActualizado;
				setGruposListos(nuevosGruposListos);

				for (const pedido of grupoActualizado.pedidos) {
					await updateCadeteForOrder(pedido.fecha, pedido.id, cadeteId);
				}

				Swal.fire({
					icon: "success",
					title: "CADETE ASIGNADO",
					text: `El viaje lo lleva: ${cadeteId}`,
				});
			} else {
				const nuevosGruposOptimos = [...gruposOptimos];
				grupoActualizado = { ...nuevosGruposOptimos[grupoIndex] };
				grupoActualizado.pedidos = grupoActualizado.pedidos.map((pedido) => ({
					...pedido,
					cadete: cadeteId,
				}));
				nuevosGruposOptimos[grupoIndex] = grupoActualizado;
				setGruposOptimos(nuevosGruposOptimos);
			}

			const nuevasOrdenes = orders.map((orden) => {
				const pedidoEnGrupo = grupoActualizado.pedidos.find(
					(p) => p.id === orden.id
				);
				if (pedidoEnGrupo) {
					return { ...orden, cadete: cadeteId };
				}
				return orden;
			});
			dispatch(readOrdersData(nuevasOrdenes));
		} catch (error) {
			Swal.fire({
				icon: "error",
				title: "Error",
				text: "Hubo un problema al asignar el cadete.",
			});
			console.error("Error al asignar el cadete:", error);
		} finally {
			setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }));
		}
	};

	useEffect(() => {
		const pedidosParaBarajar: PedidoProps[] = [];
		const pedidosManuales: PedidoProps[] = [];
		pedidosDisponibles.forEach((pedido) => {
			const pedidoInfo: PedidosGrupos = {
				id: pedido.id,
				direccion: pedido.direccion,
				cadete: pedido.cadete,
				distancia: pedido.kms,
				hora: pedido.hora,
				tiempoEspera: calcularTiempoEspera(pedido.hora),
				map: pedido.map,
				aclaraciones: pedido.aclaraciones || "", // Valor predeterminado si falta
				detallePedido: pedido.detallePedido || [], // Valor predeterminado si falta
				elaborado: pedido.elaborado || false, // Valor predeterminado si falta
				envio: pedido.envio || 0, // Valor predeterminado
				fecha: pedido.fecha || "", // Valor predeterminado
				metodoPago: pedido.metodoPago || "", // Valor predeterminado
				subTotal: pedido.subTotal || 0, // Valor predeterminado
				telefono: pedido.telefono || "", // Valor predeterminado
				total: pedido.total || 0, // Valor predeterminado
				efectivoCantidad: pedido.efectivoCantidad || 0, // Valor predeterminado
				referencias: pedido.referencias || "", // Valor predeterminado
				ubicacion: pedido.ubicacion || "", // Valor predeterminado
				dislike: pedido.dislike || false, // Valor predeterminado
				delay: pedido.delay || false, // Valor predeterminado
				tiempoElaborado: pedido.tiempoElaborado || "", // Valor predeterminado
				tiempoEntregado: pedido.tiempoEntregado || "", // Valor predeterminado
				entregado: pedido.entregado || false, // Valor predeterminado
				minutosDistancia: pedido.minutosDistancia || 0, // Valor predeterminado
				kms: pedido.kms,
			};

			if (pedido.map[0] === 0 && pedido.map[1] === 0) {
				pedidosManuales.push(pedidoInfo);
			} else {
				pedidosParaBarajar.push(pedidoInfo);
			}
		});
	}, [pedidosDisponibles]);

	const onDragEnd = (result: DropResult) => {
		const { source, destination } = result;
		console.log(result);
		if (!destination) {
			return;
		}
		if (
			source.droppableId === destination.droppableId &&
			source.index === destination.index
		) {
			return;
		}

		if (source.droppableId === "grupoManual") {
			const newGruposListos = [...gruposListos];
			const movedPedido = grupoManual[source.index];
			const destGroup = newGruposListos[parseInt(destination.droppableId)];

			if (!destGroup) {
				// If the destination group doesn't exist, create a new one
				const newGroup: Grupo = {
					pedidos: [movedPedido],
					tiempoTotal: 0,
					distanciaTotal: 0,
					peorTiempoPercibido: 0,
					pedidoPeorTiempo: null,
				};
				newGruposListos.push(newGroup);
			} else {
				destGroup.pedidos.splice(destination.index, 0, movedPedido);
			}

			const newGrupoManual = grupoManual.filter(
				(_, index) => index !== source.index
			);
			console.log(newGrupoManual);
			setGrupoManual(newGrupoManual);
			setGruposListos(newGruposListos);
		} else {
			const sourceGroup = gruposListos[parseInt(source.droppableId)];
			const destGroup = gruposListos[parseInt(destination.droppableId)];
			const newSourcePedidos = Array.from(sourceGroup.pedidos);
			const newDestPedidos =
				source.droppableId === destination.droppableId
					? newSourcePedidos
					: Array.from(destGroup.pedidos);
			const [movedPedido] = newSourcePedidos.splice(source.index, 1);
			newDestPedidos.splice(destination.index, 0, movedPedido);
			const newGruposListos = [...gruposListos];
			newGruposListos[parseInt(source.droppableId)] = {
				...sourceGroup,
				pedidos: newSourcePedidos,
			};
			if (source.droppableId !== destination.droppableId) {
				newGruposListos[parseInt(destination.droppableId)] = {
					...destGroup,
					pedidos: newDestPedidos,
				};
			}
			setGruposListos(newGruposListos);
		}
	};
	const [unlocking, setUnlocking] = useState<Record<number, boolean>>({});
	const lockTimerRef = useRef<NodeJS.Timeout | null>(null);

	const handleLockMouseDown = (index: number) => {
		setUnlocking((prev) => ({ ...prev, [index]: true }));
		lockTimerRef.current = setTimeout(() => {
			setUnlocking((prev) => ({ ...prev, [index]: false }));
			setTooltipVisibility((prev) => ({ ...prev, [index]: false }));
			updatePedidoReservaHora(index);
		}, 2000);
	};

	const handleLockMouseUp = (index: number) => {
		if (lockTimerRef.current) {
			clearTimeout(lockTimerRef.current);
		}
		setUnlocking((prev) => ({ ...prev, [index]: false }));
	};

	useEffect(() => {
		return () => {
			if (lockTimerRef.current) {
				clearTimeout(lockTimerRef.current);
			}
		};
	}, []);
	function sumar30Minutos(hora: string): string {
		const [horas, minutos] = hora.split(":").map(Number);
		let nuevosMinutos = minutos + 30;
		let nuevasHoras = horas;
		if (nuevosMinutos >= 60) {
			nuevasHoras = (nuevasHoras + 1) % 24;
			nuevosMinutos = nuevosMinutos - 60;
		}
		return `${nuevasHoras.toString().padStart(2, "0")}:${nuevosMinutos
			.toString()
			.padStart(2, "0")}`;
	}
	useEffect(() => {
		if (gruposListos.length > 0 && empleados.length > 0) {
			const gruposActualizados = gruposListos.filter((grupo) => {
				const cadeteName = grupo.pedidos[0]?.cadete;
				const empleado = empleados.find((emp) => emp.name === cadeteName);
				return empleado ? empleado.available : true;
			});
			if (gruposActualizados.length !== gruposListos.length) {
				setGruposListos(gruposActualizados);
			}
		}
	}, [empleados, gruposListos]);

	if (
		user.email === "cocina@anhelo.com" ||
		user.email === "cadetes@anhelo.com"
	) {
		return (
			<div>
				<CadeteSelect
					cadetes={cadetes}
					handleCadeteChange={handleCadeteChange}
					selectedCadete={selectedCadete}
					orders={pedidosHechos}
				/>
				{/* <button
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
				</button> */}
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
	}

	const togglePedidoPrioritario = (pedido: PedidoProps) => {
		setPedidosPrioritarios((prevPrioritarios) => {
			const isPrioritario = prevPrioritarios.some((p) => p.id === pedido.id);
			if (isPrioritario) {
				return prevPrioritarios.filter((p) => p.id !== pedido.id);
			} else {
				return [...prevPrioritarios, pedido];
			}
		});
	};

	const [modalIsOpen, setModalIsOpen] = useState(false);
	const [selectedPedido, setSelectedPedido] = useState<PedidoProps | null>(
		null
	);

	const handlePedidoClick = (pedido: PedidoProps) => {
		setSelectedPedido(pedido);
		setModalIsOpen(true);
	};

	const [starTooltipVisibility, setStarTooltipVisibility] = useState<
		Record<string, boolean>
	>({});

	const updatePedidoReservaHora = (index: number) => {
		const pedido = pedidosReserva[index];
		const nuevaHora = obtenerHoraActual();
		updateOrderTime(pedido.fecha, pedido.id, nuevaHora)
			.then(() => {
				Swal.fire({
					icon: "success",
					title: "Hora Actualizada",
					text: `La hora del pedido ha sido actualizada a ${nuevaHora}.`,
				});

				// Actualizar el estado global de orders
				const updatedOrders = orders.map((order) =>
					order.id === pedido.id ? { ...order, hora: nuevaHora } : order
				);
				dispatch(readOrdersData(updatedOrders));
			})
			.catch((error) => {
				console.error("Error al actualizar la hora del pedido:", error);
				Swal.fire({
					icon: "error",
					title: "Error",
					text: `No se pudo actualizar la hora: ${error.message}`,
				});
			});
	};

	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [showComandas, setShowComandas] = useState(false);

	return (
		<>
			<style>
				{`
      @keyframes pulse {
        0%, 100% {
          opacity: 0.2;
          transform: scale(0.8);
        }
        50% {
          opacity: 1;
          transform: scale(1);
        }
      }
      .animate-pulse {
        animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      .delay-75 {
        animation-delay: 0.25s;
      }
      .delay-150 {
        animation-delay: 0.5s;
      }
      @keyframes unlockAnimation {
        0% {
          clip-path: inset(0 100% 0 0);
        }
        100% {
          clip-path: inset(0 0 0 0);
        }
      }
      .tooltip-background {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #111827; /* bg-gray-900 */
        clip-path: inset(0 100% 0 0);
      }
      .unlocking .tooltip-background {
        animation: unlockAnimation 2s linear forwards;
      }
      .unlocking svg {
        opacity: 0.5;
        transition: opacity 0.3s ease;
      }
    `}
			</style>
			<div className="p-4 flex flex-col font-coolvetica w-screen max-w-screen overflow-x-hidden">
				<div className="md:hidden flex items-center gap-2.5  mt-2 mb-6">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="w-8"
						onClick={() => setSidebarOpen(true)}
					>
						<path d="M18.75 12.75h1.5a.75.75 0 0 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5ZM12 6a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 12 6ZM12 18a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 12 18ZM3.75 6.75h1.5a.75.75 0 1 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5ZM5.25 18.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 0 1.5ZM3 12a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 3 12ZM9 3.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM12.75 12a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0ZM9 15.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
					</svg>

					<h1 className="text-4xl font-bold">Grupos</h1>
				</div>

				<Sidebar
					isOpen={sidebarOpen}
					onClose={() => setSidebarOpen(false)}
					modoAgrupacion={modoAgrupacion}
					setModoAgrupacion={setModoAgrupacion}
					tiempoMaximo={tiempoMaximo}
					setTiempoMaximo={setTiempoMaximo}
					tiempoMaximoRecorrido={tiempoMaximoRecorrido}
					setTiempoMaximoRecorrido={setTiempoMaximoRecorrido}
					velocidadPromedio={velocidadPromedio}
					handleCadeteVelocidadChange={handleCadeteVelocidadChange}
					cadetesDisponibles={cadetesDisponibles}
					calcularVelocidadPromedio={calcularVelocidadPromedio}
				/>
				<div>
					<div className="hidden md:flex md:flex-row items-center w-full mb-8 mt-2">
						<p className="text-6xl  font-bold ">Grupos</p>

						<div className="md:w-[1px] md:h-16 h-[0px] mt-2 opacity-20 bg-black ml-4 mr-4 "></div>

						{/* Aca las opciones de agrupacion */}
						<div className="">
							<p className="mb-2 font-bold text-center md:text-left">
								Opciones de agrupación
							</p>
							<div className="flex w-full flex-col md:flex-row gap-2">
								<div
									className={`py-2 w-full text-center md:w-auto px-4 rounded-full font-medium cursor-pointer ${
										modoAgrupacion === "entrega"
											? "bg-black text-gray-100"
											: "text-black bg-gray-300"
									}`}
									onClick={() => setModoAgrupacion("entrega")}
								>
									Usar tiempo maximo de entrega
								</div>
								<div
									className={`py-2 px-4 mr-2 w-full text-center md:w-auto rounded-full font-medium cursor-pointer ${
										modoAgrupacion === "recorrido"
											? "bg-black text-gray-100"
											: "text-black bg-gray-300"
									}`}
									onClick={() => setModoAgrupacion("recorrido")}
								>
									Usar tiempo maximo de recorrido
								</div>
							</div>
						</div>

						<div className="md:w-[1px] md:h-16 h-[0px] mt-2 opacity-20 bg-black ml-2 mr-4 "></div>

						{/* Aca los parametros */}
						<div className="flex flex-col md:flex-row items-center md:items-start">
							{modoAgrupacion === "entrega" ? (
								<div className="flex flex-col">
									<p className="mb-2 font-bold text-center md:text-left mt-4 md:mt-0">
										Parametros
									</p>
									<div className="flex md:flex-row flex-col">
										<div className="relative inline-block mb-2 md:mb-0">
											<div className="relative inline-block">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
													className="h-6 absolute left-3 top-1/2 -translate-y-1/2"
													style={
														tiempoMaximo === null
															? {}
															: { filter: "invert(100%)" }
													}
												>
													<path
														fillRule="evenodd"
														d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
														clipRule="evenodd"
													/>
												</svg>
												<select
													id="tiempoMaximo"
													value={tiempoMaximo !== null ? tiempoMaximo : ""}
													onChange={(e) => {
														const value = e.target.value
															? parseInt(e.target.value)
															: null;
														setTiempoMaximo(value);
													}}
													className={`h-10 appearance-none pt-2 pl-11 pr-8 pb-3 px-3 font-medium rounded-full ${
														tiempoMaximo === null
															? "bg-gray-300 text-black"
															: "bg-black text-gray-100"
													}`}
													style={{
														WebkitAppearance: "none",
														MozAppearance: "none",
														width: "auto",
													}}
												>
													<option value="">¿Minutos maximos?</option>
													<option value={30}>30 minutos</option>
													<option value={40}>40 minutos</option>
													<option value={50}>50 minutos</option>
													<option value={60}>60 minutos</option>
													<option value={70}>70 minutos</option>
													<option value={80}>80 minutos</option>
													<option value={90}>90 minutos</option>
												</select>
												<img
													src={arrowIcon}
													alt="Arrow Icon"
													className="absolute right-3 top-1/2 h-2 rotate-90 -translate-y-1/2 pointer-events-none"
													style={
														tiempoMaximo === null
															? {}
															: { filter: "invert(100%)" }
													}
												/>
											</div>
										</div>
										<div className="relative inline-block md:ml-2 mb-6 md:mb-0">
											<div className="relative inline-block">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
													className="h-6 absolute left-3 top-1/2 -translate-y-1/2"
													style={
														velocidadPromedio === null
															? {}
															: { filter: "invert(100%)" }
													}
												>
													<path
														fill-rule="evenodd"
														d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
														clip-rule="evenodd"
													/>
												</svg>

												<select
													id="cadeteVelocidad"
													onChange={handleCadeteVelocidadChange}
													className={`h-10 appearance-none pt-2 pl-11 pr-8 pb-3 px-3 font-medium rounded-full ${
														velocidadPromedio === null
															? "bg-gray-300 text-black"
															: "bg-black text-gray-100"
													}`}
													style={{
														WebkitAppearance: "none",
														MozAppearance: "none",
														width: "auto",
													}}
												>
													<option value="">¿Velocidad promedio?</option>
													{cadetesDisponibles
														.filter((cadete) => cadete.name !== "NO ASIGNADO")
														.map((cadete) => {
															const cadeteNameFormatted =
																cadete.name.charAt(0).toUpperCase() +
																cadete.name.slice(1).toLowerCase();
															return (
																<option
																	key={`${cadete.name}-${cadete.id}-filter`}
																	value={cadete.name}
																>
																	{cadeteNameFormatted}:{" "}
																	{calcularVelocidadPromedio(cadete)} km/h
																</option>
															);
														})}
												</select>

												<img
													src={arrowIcon}
													alt="Arrow Icon"
													className="absolute right-3 top-1/2 h-2 rotate-90 -translate-y-1/2 pointer-events-none"
													style={
														velocidadPromedio === null
															? {}
															: { filter: "invert(100%)" }
													}
												/>
											</div>
										</div>
									</div>
								</div>
							) : (
								<div className="flex flex-col">
									<p className="mb-2 font-bold">Parametros</p>
									<div className="flex flex-row">
										<div className="relative inline-block mb-2 md:mb-0">
											<div className="relative inline-block">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
													className="h-6 absolute left-3 top-1/2 -translate-y-1/2"
													style={
														tiempoMaximoRecorrido === null
															? {}
															: { filter: "invert(100%)" }
													}
												>
													<path
														fillRule="evenodd"
														d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
														clipRule="evenodd"
													/>
												</svg>
												<select
													id="tiempoMaximoRecorrido"
													value={
														tiempoMaximoRecorrido !== null
															? tiempoMaximoRecorrido
															: ""
													}
													onChange={(e) => {
														const value = e.target.value
															? parseInt(e.target.value)
															: null;
														setTiempoMaximoRecorrido(value);
													}}
													className={`h-10 appearance-none pt-2 pl-11 pr-8 pb-3 px-3 font-medium rounded-full ${
														tiempoMaximoRecorrido === null
															? "bg-gray-300 text-black"
															: "bg-black text-gray-100"
													}`}
													style={{
														WebkitAppearance: "none",
														MozAppearance: "none",
														width: "auto",
													}}
												>
													<option value="">¿Minutos maximos?</option>
													<option value={30}>30 minutos</option>
													<option value={40}>40 minutos</option>
													<option value={50}>50 minutos</option>
													<option value={60}>60 minutos</option>
													<option value={70}>70 minutos</option>
													<option value={80}>80 minutos</option>
													<option value={90}>90 minutos</option>
												</select>
												<img
													src={arrowIcon}
													alt="Arrow Icon"
													className="absolute right-3 top-1/2 h-2 rotate-90 -translate-y-1/2 pointer-events-none"
													style={
														tiempoMaximoRecorrido === null
															? {}
															: { filter: "invert(100%)" }
													}
												/>
											</div>
										</div>
										<div className="relative inline-block md:ml-2 mb-6 md:mb-0">
											<div className="relative inline-block">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
													className="h-6 absolute left-3 top-1/2 -translate-y-1/2"
													style={
														velocidadPromedio === null
															? {}
															: { filter: "invert(100%)" }
													}
												>
													<path
														fill-rule="evenodd"
														d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
														clip-rule="evenodd"
													/>
												</svg>

												<select
													id="cadeteVelocidad"
													onChange={handleCadeteVelocidadChange}
													className={`h-10 appearance-none pt-2 pl-11 pr-8 pb-3 px-3 font-medium rounded-full ${
														velocidadPromedio === null
															? "bg-gray-300 text-black"
															: "bg-black text-gray-100"
													}`}
													style={{
														WebkitAppearance: "none",
														MozAppearance: "none",
														width: "auto",
													}}
												>
													<option value="">¿Velocidad promedio?</option>
													{cadetesDisponibles
														.filter((cadete) => cadete.name !== "NO ASIGNADO")
														.map((cadete) => {
															const cadeteNameFormatted =
																cadete.name.charAt(0).toUpperCase() +
																cadete.name.slice(1).toLowerCase();
															return (
																<option
																	key={`${cadete.name}-${cadete.id}-filter`}
																	value={cadete.name}
																>
																	{cadeteNameFormatted}:{" "}
																	{calcularVelocidadPromedio(cadete)} km/h
																</option>
															);
														})}
												</select>

												<img
													src={arrowIcon}
													alt="Arrow Icon"
													className="absolute right-3 top-1/2 h-2 rotate-90 -translate-y-1/2 pointer-events-none"
													style={
														velocidadPromedio === null
															? {}
															: { filter: "invert(100%)" }
													}
												/>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>

						<div className="md:w-[1px] md:h-16 h-[0px] mt-2 opacity-20 bg-black ml-4 mr-4 "></div>

						{/* Aca el ver como va todo */}
						<div
							className="flex flex-col"
							onClick={() => setShowComandas(!showComandas)}
						>
							<p className="text-2xl font-medium">Ver comandas</p>
							<img
								src={arrowIcon}
								className={`w-2 transform ${showComandas ? "rotate-180" : ""}`}
								alt=""
							/>
						</div>
					</div>
					<div className="flex-col md:grid md:grid-cols-4 gap-4 ">
						<DragDropContext onDragEnd={onDragEnd}>
							{(grupoManual.length > 0 || pedidosReserva.length > 0) && (
								<div className="flex flex-col">
									{grupoManual.length > 0 && (
										<div className="bg-gray-300 shadow-black h-min font-coolvetica w-full shadow-lg p-4 mb-4 rounded-lg">
											<h3 className="font-medium text-black  mt-4 mb-8  text-center">
												Asignar manualmente
											</h3>
											<div className="flex flex-col gap-2">
												<Droppable droppableId="grupoManual">
													{(provided) => (
														<div
															{...provided.droppableProps}
															ref={provided.innerRef}
														>
															{grupoManual.map((pedido, index) => (
																<Draggable
																	key={`manual-${pedido.id}-draggable`}
																	draggableId={`${pedido.id}-draggable`}
																	index={index}
																>
																	{(provided) => (
																		<div
																			ref={provided.innerRef}
																			{...provided.draggableProps}
																			{...provided.dragHandleProps}
																			key={`manual-${pedido.id}`}
																			className="bg-gray-100 rounded-lg flex justify-between flex-row mb-2"
																		>
																			<div className="flex flex-row items-center">
																				<div className="bg-black z-10 text-center ml-4 justify-center font-bold text-gray-100 h-6 w-6">
																					{index + 1}
																				</div>
																				<div className="pl-4 pb-3.5 pt-2">
																					<p className="font-bold text-lg leading-none mb-2 mt-1">
																						{pedido.direccion
																							.split(",")[0]
																							.toLowerCase()
																							.charAt(0)
																							.toUpperCase() +
																							pedido.direccion
																								.split(",")[0]
																								.toLowerCase()
																								.slice(1)}{" "}
																						<span className="text-xs font-normal">
																							(Distancia desconocida)
																						</span>
																					</p>

																					<p className="text-xs">
																						Pidió hace:{" "}
																						{calcularTiempoEspera(pedido.hora)}{" "}
																						minutos
																					</p>
																					<p className="text-xs">
																						Percibe entrega de: Desconocido
																					</p>
																				</div>
																			</div>
																			<div className="flex items-center relative">
																				<svg
																					xmlns="http://www.w3.org/2000/svg"
																					fill="none"
																					viewBox="0 0 24 24"
																					strokeWidth="1.5"
																					stroke="currentColor"
																					className="w-6 mr-4 opacity-50"
																					onMouseEnter={() =>
																						setTooltipVisibility((prev) => ({
																							...prev,
																							[`manual-${index}`]: true,
																						}))
																					}
																					onMouseLeave={() =>
																						setTooltipVisibility((prev) => ({
																							...prev,
																							[`manual-${index}`]: false,
																						}))
																					}
																				>
																					<path
																						strokeLinecap="round"
																						strokeLinejoin="round"
																						d="M3.75 9h16.5m-16.5 6.75h16.5"
																					/>
																				</svg>
																				{tooltipVisibility[
																					`manual-${index}`
																				] && (
																					<div className="absolute z-50 px-2 py-2 font-light text-white rounded-lg shadow-sm tooltip bg-black text-xs bottom-full mb-[-12px] left-1/2 transform -translate-x-1/2 whitespace-nowrap flex flex-row items-center gap-2 h-[30px]">
																						<p className="mb-[1.5px] text-xs">
																							Presiona para arrastrar este
																							pedido a un grupo listo.
																						</p>
																					</div>
																				)}
																			</div>
																		</div>
																	)}
																</Draggable>
															))}
															{provided.placeholder}
														</div>
													)}
												</Droppable>
											</div>
										</div>
									)}
									<div className="flex flex-col gap-2">
										{pedidosReserva.length > 0 && (
											<div className="bg-gray-300  shadow-black rounded-lg  p-4 mb-4   h-min font-coolvetica w-full shadow-lg  ">
												<h3 className="font-medium text-black mt-4 mb-8 text-center">
													Reservas
												</h3>
												<div className="flex flex-col gap-2">
													{pedidosReserva.map((pedido, index) => (
														<div
															key={`reserva-${pedido.id}-${index}`}
															className="bg-gray-100 h-[95px] rounded-lg flex items-center justify-between flex-row"
														>
															<div className="flex flex-row items-center">
																<div className="bg-black z-10 text-center ml-4 justify-center font-bold text-gray-100 h-6 w-6">
																	{index + 1}
																</div>
																<div className="pl-4 pb-3.5 pt-2">
																	<p className="font-bold text-lg">
																		{pedido.direccion
																			.split(",")[0]
																			.toLowerCase()
																			.charAt(0)
																			.toUpperCase() +
																			pedido.direccion
																				.split(",")[0]
																				.slice(1)
																				.toLowerCase()}
																	</p>

																	<p className="text-xs">
																		Pidio para las:{" "}
																		{sumar30Minutos(pedido.hora)}
																	</p>
																	<p className="text-xs">
																		Largar recien a las: {pedido.hora}
																	</p>
																</div>
															</div>
															<div className="relative">
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	version="1.0"
																	viewBox="0 0 1138.000000 1280.000000"
																	preserveAspectRatio="xMidYMid meet"
																	className={`h-5 pr-4 cursor-pointer ${
																		unlocking[index] ? "unlocking" : ""
																	}`}
																	onMouseEnter={() =>
																		setTooltipVisibility((prev) => ({
																			...prev,
																			[index]: true,
																		}))
																	}
																	onMouseLeave={() =>
																		setTooltipVisibility((prev) => ({
																			...prev,
																			[index]: false,
																		}))
																	}
																	onMouseDown={() => handleLockMouseDown(index)}
																	onMouseUp={() => handleLockMouseUp(index)}
																	onTouchStart={() =>
																		handleLockMouseDown(index)
																	}
																	onTouchEnd={() => handleLockMouseUp(index)}
																>
																	<g
																		transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
																		fill="#000000"
																		stroke="none"
																		className="opacity-50"
																	>
																		<path d="M5465 12794 c-207 -20 -279 -29 -402 -49 -971 -163 -1838 -722 -2402 -1550 -286 -419 -476 -887 -570 -1400 -55 -304 -61 -447 -61 -1582 l0 -1003 -189 0 c-143 0 -191 -3 -199 -13 -8 -9 -11 -960 -12 -3318 0 -1817 -1 -3309 0 -3316 0 -6 7 -19 16 -27 14 -14 136 -16 1172 -18 636 -1 1063 -5 947 -8 -115 -3 -203 -8 -195 -11 25 -11 284 -54 385 -65 28 -2 77 -9 110 -13 33 -5 63 -7 68 -4 4 2 31 0 60 -6 28 -5 93 -12 142 -15 50 -3 110 -7 135 -10 150 -18 757 -35 1220 -35 463 0 1070 17 1220 35 25 3 86 7 135 10 50 3 114 10 142 15 29 6 56 8 60 6 5 -3 35 -1 68 4 33 4 83 11 110 13 101 11 360 54 385 65 8 3 -79 8 -195 11 -115 3 311 7 947 8 1036 2 1158 4 1172 18 9 8 16 21 16 27 1 7 0 1499 0 3316 -1 2358 -4 3309 -12 3318 -8 10 -56 13 -199 13 l-189 0 0 1003 c0 1135 -6 1278 -61 1582 -133 725 -463 1369 -969 1889 -605 622 -1330 980 -2210 1091 -118 15 -554 28 -645 19z m645 -1043 c568 -97 1058 -348 1452 -744 434 -436 696 -995 758 -1616 6 -63 10 -504 10 -1142 l0 -1039 -2640 0 -2640 0 0 1039 c0 638 4 1079 10 1142 62 621 324 1180 758 1616 395 397 898 654 1452 742 177 29 187 29 465 26 199 -2 275 -7 375 -24z" />
																	</g>
																</svg>
																{tooltipVisibility[index] && (
																	<div
																		className={`absolute z-50 px-2 py-2 font-light text-white bg-black rounded-lg shadow-sm tooltip text-xs bottom-full left-1/2 transform -translate-x-1/2 mb-2 whitespace-nowrap flex flex-row items-center gap-2 overflow-hidden h-[30px] ${
																			unlocking[index] ? "unlocking" : ""
																		}`}
																	>
																		<div className="tooltip-background"></div>
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			version="1.0"
																			width="16"
																			height="16"
																			viewBox="0 0 838.000000 1280.000000"
																			preserveAspectRatio="xMidYMid meet"
																			className="relative z-10"
																		>
																			<g
																				transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
																				fill="#FFFFFF"
																				stroke="none"
																			>
																				<path d="M5925 12794 c-568 -60 -1036 -276 -1416 -654 -341 -339 -547 -740 -642 -1245 -20 -107 -21 -148 -24 -1452 l-4 -1343 -1917 -2 -1917 -3 0 -2070 0 -2070 1128 -5 1128 -5 -1 -315 c0 -173 -3 -345 -7 -381 l-6 -66 -96 0 c-109 1 -151 -14 -170 -61 -12 -28 -7 -51 18 -92 5 -8 26 -66 46 -129 20 -63 63 -181 96 -264 33 -82 59 -150 57 -152 -2 -1 -39 -23 -83 -50 -304 -182 -515 -471 -610 -836 -21 -83 -28 -136 -32 -258 -8 -228 21 -391 104 -574 70 -154 139 -256 256 -376 502 -515 1321 -520 1828 -10 148 149 254 323 325 536 52 153 68 254 67 423 -1 277 -77 505 -242 728 -103 139 -267 288 -419 381 -28 18 -52 39 -52 46 0 8 18 87 40 176 61 248 101 453 103 532 l2 70 -143 71 c-160 79 -148 63 -127 162 7 30 1 36 -147 164 -84 74 -155 135 -157 136 -1 2 2 34 9 73 l12 71 1048 0 c954 0 1049 1 1061 16 20 25 21 4093 0 4117 -12 15 -45 17 -292 17 l-279 0 0 1264 c0 1065 2 1283 15 1378 65 496 344 924 775 1191 282 174 649 259 983 229 411 -38 735 -188 1023 -476 278 -279 430 -595 473 -988 7 -59 11 -348 11 -727 l0 -630 22 -20 c72 -68 325 -89 480 -41 76 23 108 44 108 71 0 10 5 19 11 19 7 0 9 207 6 703 -5 755 -5 758 -62 994 -216 896 -949 1565 -1870 1708 -97 15 -438 27 -520 19z m-3070 -11601 c109 -38 209 -146 235 -254 39 -160 -42 -339 -176 -389 -194 -72 -397 2 -495 182 -32 60 -34 68 -34 163 0 118 15 155 90 224 100 92 247 121 380 74z m215 -120 c43 -59 70 -141 70 -208 0 -60 -17 -142 -31 -151 -4 -2 -2 17 6 43 18 58 19 104 4 175 -15 72 -42 121 -97 181 -38 40 -41 46 -15 27 17 -12 46 -42 63 -67z" />
																			</g>
																		</svg>
																		<p className="mb-[1.5px] relative z-10 text-xs">
																			Mantén presionado para distribuir en
																			grupos
																		</p>
																	</div>
																)}
															</div>
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								</div>
							)}
							{gruposListos.map((grupo, index) => (
								<Droppable
									droppableId={index.toString()}
									key={`listo-${index}`}
								>
									{(provided) => (
										<div
											{...provided.droppableProps}
											ref={provided.innerRef}
											className="bg-gray-300 shadow-black h-min font-coolvetica w-full shadow-lg p-4 mb-4 rounded-lg"
										>
											<div className="flex flex-col mt-4 mb-8 text-center justify-center">
												<div className="flex flex-row items-center justify-center gap-2">
													<img src={listoIcon} className="h-3 mb-1" alt="" />
													<h3 className="font-medium text-2xl md:text-3xl mb-2">
														Grupo {index + 1}
													</h3>
												</div>
												<p className="text-xs">
													Peor entrega: {grupo.peorTiempoPercibido} minutos (
													{grupo.pedidoPeorTiempo?.direccion.split(",")[0] ||
														"N/A"}
													)
												</p>
												<p className="text-xs">
													Duracion: {grupo.tiempoTotal} minutos
												</p>
												<p className="text-xs">
													Distancia: {grupo.distanciaTotal} km
												</p>
												<p className="text-xs">
													El cadete regresa a ANHELO a las {grupo.horaRegreso}{" "}
													hs
												</p>
												<p className="text-xs">
													Costo por entrega aproximado: $
													{Math.round(
														(grupo.distanciaTotal * 200 +
															grupo.pedidos.length * 1200) /
															grupo.pedidos.length
													)}
												</p>
											</div>
											<button
												className="bg-gray-400 bg-opacity-50 w-full h-[64px] mb-2 text-red-main rounded-lg flex justify-center items-center text-2xl md:text-3xl font-coolvetica"
												onClick={() => handleDeshacerGrupo(index)}
											>
												{loadingStates[index] ? (
													<div className="flex flex-row gap-1">
														<div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse"></div>
														<div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse delay-75"></div>
														<div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse delay-150"></div>
													</div>
												) : (
													"Deshacer"
												)}
											</button>
											<div className="relative mt-8 mb-2 flex items-center">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
													className="h-6 absolute left-3 "
												>
													<path
														fill-rule="evenodd"
														d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
														clip-rule="evenodd"
													/>
												</svg>

												<select
													className="bg-gray-100 appearance-none w-full pl-10 py-2 rounded-full capitalize"
													style={{
														WebkitAppearance: "none",
														MozAppearance: "none",
													}}
													onChange={(e) =>
														handleAsignarCadete(index, e.target.value, true)
													}
													value={grupo.pedidos[0]?.cadete || ""}
													disabled={loadingStates[`asignar-${index}`]}
												>
													{cadetesDisponibles.map((cadete) => (
														<option
															key={`${cadete.id}-${cadete.name}`}
															value={cadete.id}
															className="capitalize"
														>
															{cadete.name}
														</option>
													))}
												</select>
												<img
													src={arrowIcon}
													alt="Arrow Icon"
													className="absolute right-3 top-1/2 h-2 rotate-90 -translate-y-1/2 pointer-events-none"
												/>
												{loadingStates[`asignar-${index}`] && (
													<div className="absolute inset-0 bg-gray-100 rounded-full flex items-center justify-center">
														<div className="flex flex-row gap-1">
															<div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse"></div>
															<div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse delay-75"></div>
															<div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse delay-150"></div>
														</div>
													</div>
												)}
											</div>
											{grupo.pedidos.map((pedido, pedidoIndex) => (
												<Draggable
													key={`manual-${pedido.id}-xd`}
													draggableId={pedido.id}
													index={pedidoIndex}
												>
													{(provided) => (
														<div
															ref={provided.innerRef}
															{...provided.draggableProps}
															{...provided.dragHandleProps}
															className={`bg-gray-100 relative flex flex-row items-center ${
																pedidoIndex === 0
																	? "rounded-t-lg"
																	: pedidoIndex === grupo.pedidos.length - 1
																	? "rounded-b-lg"
																	: ""
															}`}
															onClick={() => handlePedidoClick(pedido)}
														>
															<div className="bg-black z-10 text-center ml-4 justify-center font-bold text-gray-100 h-6 w-6">
																{pedidoIndex + 1}
															</div>
															{grupo.pedidos.length > 1 && (
																<div
																	className={`w-1.5 bg-black absolute left-[23.5px]  ${
																		pedidoIndex === 0
																			? "h-1/2 bottom-0"
																			: pedidoIndex === grupo.pedidos.length - 1
																			? "h-1/2 top-0"
																			: "h-full"
																	}`}
																></div>
															)}
															<div
																className={`flex flex-row justify-between ${
																	pedidoIndex !== grupo.pedidos.length - 1
																		? "border-b border-black border-opacity-20"
																		: ""
																} w-full ml-4 pb-3.5 pt-2`}
															>
																<div>
																	<p className="font-bold text-lg leading-none mb-2 mt-1">
																		{pedido.direccion
																			.split(",")[0]
																			.toLowerCase()
																			.charAt(0)
																			.toUpperCase() +
																			pedido.direccion
																				.split(",")[0]
																				.slice(1)
																				.toLowerCase()}{" "}
																		<span className="text-xs font-normal">
																			(
																			{pedido.map[0] === 0 &&
																			pedido.map[1] === 0
																				? "Desconocido"
																				: `${pedido.distancia} km`}
																			)
																		</span>
																	</p>

																	<div className="flex flex-row items-center gap-1.5">
																		{calcularTiempoEspera(pedido.hora) > 20 && (
																			<svg
																				xmlns="http://www.w3.org/2000/svg"
																				viewBox="0 0 200 500"
																				className="h-3"
																			>
																				<rect
																					x="75"
																					y="400"
																					width="100"
																					height="75"
																					rx="20"
																					ry="20"
																					fill={
																						calcularTiempoEspera(pedido.hora) >
																						30
																							? "#FF0000"
																							: "#F59E0B"
																					}
																				/>
																				<rect
																					x="75"
																					y="50"
																					width="100"
																					height="300"
																					rx="20"
																					ry="20"
																					fill={
																						calcularTiempoEspera(pedido.hora) >
																						30
																							? "#FF0000"
																							: "#F59E0B"
																					}
																				/>
																			</svg>
																		)}

																		<p className="text-xs">
																			Pidió hace:{" "}
																			{calcularTiempoEspera(pedido.hora)}{" "}
																			minutos
																		</p>
																	</div>

																	<div className="flex flex-row gap-1.5 items-center">
																		{pedido.map[0] !== 0 ||
																		pedido.map[1] !== 0 ? (
																			<>
																				<div
																					className={`text-xs h-1.5 w-1.5 rounded-full ${
																						(pedido.tiempoPercibido ?? 0) < 30
																							? "bg-black"
																							: (pedido.tiempoPercibido ?? 0) <
																							  50
																							? "bg-yellow-500"
																							: "bg-red-main"
																					}`}
																				></div>
																				<p className="text-xs">
																					Percibe entrega de:{" "}
																					{pedido.tiempoPercibido ?? 0} minutos
																				</p>
																			</>
																		) : (
																			<p className="text-xs">
																				Percibe entrega de: Desconocido
																			</p>
																		)}
																	</div>
																</div>
																<div className="flex items-center relative">
																	<button
																		className="ml-2 p-1 rounded-full relative"
																		onMouseEnter={() =>
																			setStarTooltipVisibility((prev) => ({
																				...prev,
																				[pedido.id]: true,
																			}))
																		}
																		onMouseLeave={() =>
																			setStarTooltipVisibility((prev) => ({
																				...prev,
																				[pedido.id]: false,
																			}))
																		}
																	>
																		{pedidosPrioritarios.some(
																			(p) => p.id === pedido.id
																		) ? (
																			<svg
																				xmlns="http://www.w3.org/2000/svg"
																				viewBox="0 0 24 24"
																				fill="currentColor"
																				className="w-4 text-red-main"
																			>
																				<path
																					fillRule="evenodd"
																					d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
																					clipRule="evenodd"
																				/>
																			</svg>
																		) : (
																			<svg
																				xmlns="http://www.w3.org/2000/svg"
																				fill="none"
																				viewBox="0 0 24 24"
																				strokeWidth="1.5"
																				stroke="currentColor"
																				className="w-4 text-black opacity-50"
																			>
																				<path
																					strokeLinecap="round"
																					strokeLinejoin="round"
																					d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
																				/>
																			</svg>
																		)}
																		{starTooltipVisibility[pedido.id] && (
																			<div className="absolute z-50 px-2 py-2 font-light text-white bg-black rounded-lg shadow-sm tooltip text-xs bottom-full left-1/2 transform -translate-x-1/2 mb-2 whitespace-nowrap flex flex-row items-center gap-2 h-[30px]">
																				<svg
																					xmlns="http://www.w3.org/2000/svg"
																					fill="none"
																					viewBox="0 0 24 24"
																					strokeWidth="1.5"
																					stroke="currentColor"
																					className="w-3 h-3"
																				>
																					<path
																						strokeLinecap="round"
																						strokeLinejoin="round"
																						d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
																					/>
																				</svg>
																				<p className="mb-[1.5px] text-xs">
																					Para priorizar un pedido debes
																					deshacer el grupo
																				</p>
																			</div>
																		)}
																	</button>
																	<svg
																		xmlns="http://www.w3.org/2000/svg"
																		fill="none"
																		viewBox="0 0 24 24"
																		strokeWidth="1.5"
																		stroke="currentColor"
																		className="w-6 mr-4 cursor-pointer opacity-50"
																		onMouseEnter={() =>
																			setTooltipVisibility((prev) => ({
																				...prev,
																				[`listo-${index}-${pedidoIndex}`]: true,
																			}))
																		}
																		onMouseLeave={() =>
																			setTooltipVisibility((prev) => ({
																				...prev,
																				[`listo-${index}-${pedidoIndex}`]:
																					false,
																			}))
																		}
																	>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			d="M3.75 9h16.5m-16.5 6.75h16.5"
																		/>
																	</svg>
																	{tooltipVisibility[
																		`listo-${index}-${pedidoIndex}`
																	] && (
																		<div className="absolute z-50 px-2 py-2 font-light text-white rounded-lg shadow-sm tooltip bg-black text-xs bottom-full mb-[-12px] left-1/2 transform -translate-x-1/2 whitespace-nowrap flex  flex-row items-center gap-2 h-[30px]">
																			<p className="mb-[1.5px] text-xs">
																				Presiona para arrastrar este pedido
																			</p>
																		</div>
																	)}
																</div>
															</div>
														</div>
													)}
												</Draggable>
											))}
											{provided.placeholder}
										</div>
									)}
								</Droppable>
							))}
						</DragDropContext>
						{gruposOptimos.length > 0 ? (
							gruposOptimos.map((grupo, index) => {
								const horaActual = new Date();
								const horaRegreso = new Date(
									horaActual.getTime() + grupo.tiempoTotal * 60000
								);
								const horaRegresoFormateada = horaRegreso.toLocaleTimeString(
									"es-ES",
									{ hour: "2-digit", minute: "2-digit" }
								);
								const uniqueKey = `${grupo.tiempoTotal}-${grupo.distanciaTotal}-${index}`;

								return (
									<div
										key={uniqueKey}
										className="bg-gray-300 shadow-black h-min font-coolvetica w-full shadow-lg p-4 mb-4 rounded-lg"
									>
										<div className="flex flex-col mt-4 mb-8 text-center items-center justify-center">
											<h3 className="font-medium  text-2xl md:text-3xl mb-2 items-center gap-2.5  flex flex-row">
												<svg
													className="w-3 h-3  text-gray-100 animate-spin   dark:fill-black"
													viewBox="0 0 100 101"
												>
													<path
														d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
														fill="currentColor"
													/>
													<path
														d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
														fill="currentFill"
													/>
												</svg>
												Grupo {index + 1} en proceso
											</h3>
											<p className="text-xs">
												Peor entrega: {grupo.peorTiempoPercibido} minutos (
												{grupo.pedidoPeorTiempo?.direccion?.split(",")[0] ||
													"N/A"}
												)
											</p>
											<p className="text-xs">
												Duracion: {grupo.tiempoTotal} minutos
											</p>
											<p className="text-xs">
												Distancia: {grupo.distanciaTotal} km
											</p>
											<p className="text-xs">
												El cadete regresa a ANHELO a las {horaRegresoFormateada}{" "}
												hs
											</p>
											<p className="text-xs">
												Costo por entrega aproximado: $
												{Math.round(
													(grupo.distanciaTotal * 200 +
														grupo.pedidos.length * 1200) /
														grupo.pedidos.length
												)}
											</p>
										</div>
										<button
											className="bg-black w-full h-[64px] mb-8 text-gray-100 rounded-lg flex justify-center items-center text-2xl md:text-3xl font-coolvetica"
											onClick={() => handleGrupoListo(grupo)}
										>
											Listo
										</button>
										{grupo.pedidos.map((pedido, pedidoIndex) => (
											<div className="flex flex-row ">
												<div
													key={`${pedido.id}-gruposDepedidos`}
													className={`bg-gray-100 relative w-full flex flex-row items-center ${
														pedidoIndex === 0
															? "rounded-t-lg "
															: pedidoIndex === grupo.pedidos.length - 1
															? "rounded-b-lg"
															: ""
													}`}
													onClick={() => handlePedidoClick(pedido)}
												>
													<div className="bg-black z-10 text-center ml-4 justify-center font-bold text-gray-100 h-6 w-6">
														{pedidoIndex + 1}
													</div>
													{grupo.pedidos.length > 1 && (
														<div
															className={`w-1.5 bg-black absolute left-[23.5px] ${
																pedidoIndex === 0
																	? "h-1/2 bottom-0"
																	: pedidoIndex === grupo.pedidos.length - 1
																	? "h-1/2 top-0"
																	: "h-full"
															}`}
														></div>
													)}
													<div
														className={`flex flex-row justify-between items-center ${
															pedidoIndex !== grupo.pedidos.length - 1
																? "border-b border-black border-opacity-20"
																: ""
														} w-full ml-4 pb-3.5 pt-2`}
													>
														<div className="flex flex-col">
															<p className="font-bold text-lg leading-none mb-2 mt-1">
																{pedido.direccion
																	.split(",")[0]
																	.toLowerCase()
																	.charAt(0)
																	.toUpperCase() +
																	pedido.direccion
																		.split(",")[0]
																		.slice(1)
																		.toLowerCase()}{" "}
																<span className="text-xs font-normal">
																	({pedido.distancia} km)
																</span>
															</p>

															<div className="flex flex-row items-center gap-1.5">
																{calcularTiempoEspera(pedido.hora) > 20 && (
																	<svg
																		xmlns="http://www.w3.org/2000/svg"
																		viewBox="0 0 200 500"
																		className="h-3"
																	>
																		<rect
																			x="75"
																			y="400"
																			width="100"
																			height="75"
																			rx="20"
																			ry="20"
																			fill={
																				calcularTiempoEspera(pedido.hora) > 30
																					? "#FF0000"
																					: "#F59E0B"
																			}
																		/>
																		<rect
																			x="75"
																			y="50"
																			width="100"
																			height="300"
																			rx="20"
																			ry="20"
																			fill={
																				calcularTiempoEspera(pedido.hora) > 30
																					? "#FF0000"
																					: "#F59E0B"
																			}
																		/>
																	</svg>
																)}

																<p className="text-xs">
																	Pidió hace:{" "}
																	{calcularTiempoEspera(pedido.hora)} minutos (
																	{pedido.hora} hs)
																</p>
															</div>

															<div className="flex flex-row gap-1.5 items-center">
																{pedido.tiempoPercibido != null &&
																	pedido.tiempoPercibido >= 30 && (
																		<div
																			className={`text-xs h-1.5 w-1.5 rounded-full ${
																				pedido.tiempoPercibido < 50
																					? "bg-yellow-500"
																					: "bg-red-main"
																			}`}
																		></div>
																	)}
																<p className="text-xs">
																	Percibe entrega de:{" "}
																	{pedido.tiempoPercibido ?? 0} minutos (
																	{new Date(
																		Date.now() -
																			calcularTiempoEspera(pedido.hora) *
																				60000 +
																			(pedido.tiempoPercibido ?? 0) * 60000
																	).toLocaleTimeString([], {
																		hour: "2-digit",
																		minute: "2-digit",
																	})}{" "}
																	hs)
																</p>
															</div>
														</div>
														<div className="flex items-center relative">
															<button
																onClick={() => togglePedidoPrioritario(pedido)}
																className="ml-2 p-1 rounded-full relative"
																onMouseEnter={() =>
																	setStarTooltipVisibility((prev) => ({
																		...prev,
																		[`process-${pedido.id}`]: true,
																	}))
																}
																onMouseLeave={() =>
																	setStarTooltipVisibility((prev) => ({
																		...prev,
																		[`process-${pedido.id}`]: false,
																	}))
																}
															>
																{pedidosPrioritarios.some(
																	(p) => p.id === pedido.id
																) ? (
																	<svg
																		xmlns="http://www.w3.org/2000/svg"
																		viewBox="0 0 24 24"
																		fill="currentColor"
																		className="w-4 text-red-main"
																	>
																		<path
																			fillRule="evenodd"
																			d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
																			clipRule="evenodd"
																		/>
																	</svg>
																) : (
																	<svg
																		xmlns="http://www.w3.org/2000/svg"
																		fill="none"
																		viewBox="0 0 24 24"
																		strokeWidth="1.5"
																		stroke="currentColor"
																		className="w-4 text-black opacity-50"
																	>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
																		/>
																	</svg>
																)}
																{starTooltipVisibility[
																	`process-${pedido.id}`
																] && (
																	<div className="absolute z-50 px-2 py-2 font-light text-white bg-black rounded-lg shadow-sm tooltip text-xs bottom-full left-1/2 transform -translate-x-1/2 mb-2 whitespace-nowrap flex flex-row items-center gap-2 h-[30px]">
																		<p className="mb-[1.5px] text-xs">
																			Presiona para priorizar este pedido
																		</p>
																	</div>
																)}
															</button>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																fill="none"
																viewBox="0 0 24 24"
																strokeWidth="1.5"
																stroke="currentColor"
																className="w-6 mr-4 cursor-pointer opacity-50"
																onMouseEnter={() =>
																	setTooltipVisibility((prev) => ({
																		...prev,
																		[`${index}-${pedidoIndex}`]: true,
																	}))
																}
																onMouseLeave={() =>
																	setTooltipVisibility((prev) => ({
																		...prev,
																		[`${index}-${pedidoIndex}`]: false,
																	}))
																}
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	d="M3.75 9h16.5m-16.5 6.75h16.5"
																/>
															</svg>
															{tooltipVisibility[`${index}-${pedidoIndex}`] && (
																<div className="absolute z-50 px-2 py-2 font-light text-white rounded-lg shadow-sm tooltip bg-black text-xs bottom-full left-1/2 transform -translate-x-1/2 mb-2 whitespace-nowrap flex flex-row items-center gap-2 h-[30px]">
																	<svg
																		xmlns="http://www.w3.org/2000/svg"
																		fill="none"
																		viewBox="0 0 24 24"
																		strokeWidth="1.5"
																		stroke="currentColor"
																		className="w-3 h-3"
																	>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
																		/>
																	</svg>
																	<p className="mb-[1.5px] text-xs">
																		Para arrastrar pedidos tenes que marcar como
																		listo el grupo
																	</p>
																</div>
															)}
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								);
							})
						) : (
							<></>
						)}
					</div>
				</div>
				{modalIsOpen && selectedPedido && (
					<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center overflow-y-auto">
						<div className="relative bg-white rounded-lg  max-w-lg m-4 max-h-[90vh] flex flex-col">
							<div className="overflow-y-auto p-6 flex-grow">
								<CardComanda {...selectedPedido} cadetes={cadetes} />
							</div>
							<div className="sticky bottom-0 bg-white p-4 border-t">
								<button
									onClick={() => setModalIsOpen(false)}
									className="w-full bg-black text-white px-4 py-2 rounded"
								>
									Cerrar
								</button>
							</div>
						</div>
					</div>
				)}

				{showComandas && (
					<>
						<div className="flex flex-row mt-8">
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
							<div className="h-10 bg-black w-[1px] ml-4 mr-3"></div>

							<CadeteSelect
								cadetes={cadetes}
								handleCadeteChange={handleCadeteChange}
								selectedCadete={selectedCadete}
								orders={pedidosHechos}
							/>
						</div>
						<OrderList
							seccionActiva={seccionActiva}
							pedidosPorHacer={pedidosPorHacer}
							pedidosHechos={pedidosHechos}
							pedidosEntregados={
								seccionActiva !== "mapa" ? pedidosEntregados : []
							}
							cadetes={cadetes}
						/>
						<div className="mt-2">
							{seccionActiva === "mapa" &&
								(location.pathname === "/comandas" ? (
									<DeliveryMap
										orders={[...pedidosHechos, ...pedidosPorHacer]}
									/>
								) : (
									<DeliveryMap orders={orders} />
								))}
						</div>
						<div className="mt-2">
							{seccionActiva === "registro" && <RegistroEmpleado />}
						</div>
					</>
				)}
			</div>
		</>
	);
};
