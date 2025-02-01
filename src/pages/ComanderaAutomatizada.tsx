import React, { useEffect, useState, useMemo, useRef } from "react";
import { RootState } from "../redux/configureStore";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { GeneralStats, OrderList } from "../components/comandera";
import { CardComanda } from "../components/comandera/Card/CardComanda";
import { NavButtons } from "../components/comandera/NavButtons";
import CadeteSelect from "../components/Cadet/CadeteSelect";
import CreateCadetModal from "../components/comandera2025/CreateCadetModal";
import { Unsubscribe } from "firebase/firestore";
import Sidebar from "../components/comandera/Sidebar";
import {
	EmpleadosProps,
	VueltasProps,
	listenToEmpleadosChanges,
} from "../firebase/registroEmpleados";
import {
	listenToAltaDemanda,
	AltaDemandaProps,
	updateAltaDemanda,
	deactivateHighDemand,
} from "../firebase/readConstants";
import { ReadOrdersForToday } from "../firebase/ReadData";
import { PedidoProps } from "../types/types";
import { readOrdersData } from "../redux/data/dataAction";
import arrowIcon from "../assets/arrowIcon.png";
import listoIcon from "../assets/listoIcon.png";
import wspIcon from "../assets/wsp.png";

import Swal from "sweetalert2";
import {
	updateCadeteForOrder,
	updateOrderTime,
	updateOrderCookNow,
} from "../firebase/UploadOrder";
import { obtenerHoraActual } from "../helpers/dateToday";
import AnimatedSvgButton from "../components/svgAnimation/AnimatedSvgButton";
import {
	DragDropContext,
	Droppable,
	Draggable,
	DropResult,
} from "react-beautiful-dnd";

// Funciones auxiliares seguras
const getFirstPartOfAddress = (direccion: string | undefined): string => {
	if (!direccion) return "Dirección no disponible";

	const parts = direccion.split(",");
	return parts.length > 0
		? parts[0].toLowerCase().charAt(0).toUpperCase() +
		parts[0].toLowerCase().slice(1)
		: "Dirección no disponible";
};

const isPedidoValid = (pedido: any): boolean => {
	return (
		pedido &&
		typeof pedido === "object" &&
		"direccion" in pedido &&
		"map" in pedido &&
		Array.isArray(pedido.map) &&
		pedido.map.length >= 2
	);
};

const getFormattedAddress = (pedido: any): string => {
	if (!isPedidoValid(pedido)) {
		return "Dirección no válida";
	}
	return getFirstPartOfAddress(pedido.direccion);
};

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

export const ComanderaAutomatizada: React.FC = () => {
	// Estados
	const [remainingMinutes, setRemainingMinutes] = useState<number | null>(null);
	const [seccionActiva, setSeccionActiva] = useState<string>("porHacer");
	const [selectedDelay, setSelectedDelay] = useState<number>(30);
	const dispatch = useDispatch();
	const [sumaTotalPedidos, setSumaTotalPedidos] = useState<number>(0);
	const [sumaTotalEfectivo, setSumaTotalEfectivo] = useState<number>(0);
	const [hideAssignedGroups, setHideAssignedGroups] = useState(false);
	// Agregar nuevo estado para pedidos prioritarios automáticos
	const [pedidosPrioritariosAutomaticos, setPedidosPrioritariosAutomaticos] =
		useState<PedidoProps[]>([]);

	const [selectedCadete, setSelectedCadete] = useState<string | null>(null);
	const { drinks } = useSelector((state: RootState) => state.product);
	const [cadetes, setCadetes] = useState<string[]>([]);
	const [empleados, setEmpleados] = useState<EmpleadosProps[]>([]);
	const [altaDemanda, setAltaDemanda] = useState<AltaDemandaProps | null>(null);
	const [onlyElaborated, setOnlyElaborated] = useState(false);
	const { orders } = useSelector((state: RootState) => state.data);
	const [pedidosPrioritarios, setPedidosPrioritarios] = useState<PedidoProps[]>(
		[]
	);
	const { user } = useSelector((state: RootState) => state.auth);
	const location = useLocation();
	const [tiempoMaximo, setTiempoMaximo] = useState<number | null>(null);
	const [loadingCook, setLoadingCook] = useState<Record<number, boolean>>({});
	const [tiempoMaximoRecorrido, setTiempoMaximoRecorrido] = useState<
		number | null
	>(null);

	const [modoAgrupacion, setModoAgrupacion] = useState<"entrega" | "recorrido">(
		"entrega"
	);
	const [tiempoActual, setTiempoActual] = useState<Date>(new Date());
	const [isCreateCadetModalOpen, setIsCreateCadetModalOpen] = useState(false);
	const [gruposListos, setGruposListos] = useState<Grupo[]>([]);
	const [gruposAutomaticos, setGruposAutomaticos] = useState<Grupo[]>([]);
	const [gruposAutomaticosOptimos, setGruposAutomaticosOptimos] = useState<
		Grupo[]
	>([]);
	const [tiempoMaximoAutomatico, setTiempoMaximoAutomatico] = useState<
		number | null
	>(null);
	const [tiempoElaboracionPromedioHOY, setTiempoElaboracionPromedioHOY] =
		useState<number>(0);
	const [gruposOptimos, setGruposOptimos] = useState<Grupo[]>([]);
	const [grupoManual, setGrupoManual] = useState<PedidoProps[]>([]);
	const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
		{}
	);
	const [tooltipVisibility, setTooltipVisibility] = useState<
		Record<string, boolean>
	>({});

	// Estado para la velocidad promedio
	const [velocidadPromedio, setVelocidadPromedio] = useState<number | null>(
		null
	);

	// Constantes
	const FACTOR_CORRECCION = 1.455;
	const VELOCIDAD_PROMEDIO_MOTO = 27.3425;
	const TIEMPO_POR_ENTREGA = 0;
	const LATITUD_INICIO = -33.0957994;
	const LONGITUD_INICIO = -64.3337817;

	// Función para obtener la velocidad actual
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
		try {
			const [horas, minutos] = horaPedido.split(":").map(Number);
			const fechaPedido = new Date(tiempoActual);
			fechaPedido.setHours(horas, minutos, 0, 0);
			const diferencia = tiempoActual.getTime() - fechaPedido.getTime();
			const minutosEspera = Math.floor(diferencia / 60000);
			return minutosEspera;
		} catch (error) {
			console.error("Error calculando tiempo de espera:", error);
			return 0;
		}
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
			.filter((o) => !o.canceled) // Filtramos los pedidos que no están cancelados
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

	const pedidosCerca = useMemo(() => {
		return filteredOrders.filter((o) => o.cerca);
	}, [filteredOrders]);


	const customerSuccess = useMemo(() => {
		return (
			100 -
			(orders.filter((order) => order.dislike || order.delay).length * 100) /
			orders.length
		);
	}, [orders]);

	useEffect(() => {
		let unsubscribeEmpleados: Unsubscribe | null = null;
		let unsubscribeOrders: Unsubscribe | null = null;

		const iniciarEscuchas = async () => {
			unsubscribeEmpleados = listenToEmpleadosChanges((empleadosActualizados) => {
				setEmpleados(empleadosActualizados);
				const cadetesFiltrados = empleadosActualizados
					.filter((empleado) => empleado.category === "cadete")
					.map((empleado) => empleado.name);
				setCadetes(cadetesFiltrados);
			});

			if (location.pathname === "/comandas") {
				unsubscribeOrders = ReadOrdersForToday(async (pedidos: PedidoProps[]) => {
					// console.log("Pedidos recibidos:", pedidos); // Agregar este console.log
					dispatch(readOrdersData(pedidos));
				});
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
		return filteredOrders.filter((order) => {
			if (order.hora > obtenerHoraActual()) {
				return false; // Este es un pedido de reserva
			}
			if (
				order.deliveryMethod === "takeaway" ||
				order.direccion === "Buenos Aires 618, X5800 Río Cuarto, Córdoba, Argentina"
			) {
				return false; // Excluir takeaway y dirección específica
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
	}, [filteredOrders, empleados, tiempoActual]);

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

	function agregarDistanciasAPedidos(pedidos: PedidoProps[]): PedidoProps[] {
		return pedidos.map((pedido) => {
			if (!isPedidoValid(pedido)) {
				return {
					...pedido,
					distancia: "0.00",
				};
			}
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
		let filteredPedidos = pedidosDisponibles.filter(
			(pedido) =>
				pedido.deliveryMethod !== "takeaway" &&
				pedido.direccion !==
				"Buenos Aires 618, X5800 Río Cuarto, Córdoba, Argentina"
		);

		if (onlyElaborated) {
			filteredPedidos = filteredPedidos.filter((pedido) => pedido.elaborado);
		}

		return agregarDistanciasAPedidos(filteredPedidos);
	}, [pedidosDisponibles, onlyElaborated]);

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
			if (!isPedidoValid(pedido)) return;

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
		tiempoTotal *= factorAjuste;
		return {
			tiempoTotal: Math.round(tiempoTotal),
			distanciaTotal: Number(distanciaTotal.toFixed(2)),
		};
	}

	const calcularVelocidadPromedio = (cadete: EmpleadosProps): number => {
		if (!cadete.vueltas || cadete.vueltas.length === 0) {
			return VELOCIDAD_PROMEDIO_MOTO;
		}

		const ultimasVueltas = cadete.vueltas.slice(-5);
		let distanciaTotal = 0;
		let tiempoTotal = 0;

		ultimasVueltas.forEach((vuelta: VueltasProps) => {
			if (vuelta.totalDistance && vuelta.totalDuration) {
				distanciaTotal += vuelta.totalDistance;
				tiempoTotal += vuelta.totalDuration;
			}
		});

		if (tiempoTotal === 0) {
			return VELOCIDAD_PROMEDIO_MOTO;
		}

		const velocidadPromedio = (distanciaTotal / tiempoTotal) * 60;
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
		tiempoMaximoRecorrido: number | null,
		pedidosPrioritarios: PedidoProps[]
	): Grupo[] {
		const pedidosDisponibles = pedidos.filter(
			(pedido) =>
				!gruposListos.some((grupo) =>
					grupo.pedidos.some((p) => p.id === pedido.id)
				) &&
				isPedidoValid(pedido) &&
				pedido.deliveryMethod !== "takeaway" && // Filtrar pedidos takeaway
				pedido.direccion !==
				"Buenos Aires 618, X5800 Río Cuarto, Córdoba, Argentina" // Filtrar dirección específica
		);

		const pedidosManuales = pedidos.filter(
			(pedido) =>
				(!isPedidoValid(pedido) ||
					(pedido.map[0] === 0 && pedido.map[1] === 0)) &&
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
				tiempoMaximoRecorrido,
				pedidosPrioritarios
			);
			gruposOptimos.push(grupo);
			pedidosRestantes = pedidosRestantes.filter(
				(pedido) => !grupo.pedidos.some((p) => p.id === pedido.id)
			);
			pedidosPrioritarios = pedidosPrioritarios.filter(
				(pedido) => !grupo.pedidos.some((p) => p.id === pedido.id)
			);
		}

		return gruposOptimos;
	}

	function formarGrupo(
		pedidosDisponibles: PedidoProps[],
		tiempoMaximoRecorrido: number | null,
		pedidosPrioritarios: PedidoProps[]
	): Grupo {
		const grupoActual: PedidosGrupos[] = [];
		let peorTiempoPercibido = 0;
		let pedidoPeorTiempo: PedidoProps | null = null;
		let latitudActual = LATITUD_INICIO;
		let longitudActual = LONGITUD_INICIO;

		// Empezar con pedido prioritario si existe
		let pedidoInicial =
			pedidosPrioritarios.length > 0 ? pedidosPrioritarios[0] : null;

		if (!pedidoInicial) {
			pedidoInicial = encontrarMejorPedido(
				pedidosDisponibles,
				latitudActual,
				longitudActual
			);
		}

		if (pedidoInicial && isPedidoValid(pedidoInicial)) {
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

			if (tiempoPercibido > peorTiempoPercibido) {
				peorTiempoPercibido = tiempoPercibido;
				pedidoPeorTiempo = pedidoInicial;
			}

			latitudActual = pedidoInicial.map[0];
			longitudActual = pedidoInicial.map[1];
			pedidosDisponibles = pedidosDisponibles.filter(
				(p) => p.id !== pedidoInicial!.id
			);
		}

		// Agregar pedidos restantes
		while (pedidosDisponibles.length > 0) {
			let mejorPedido = encontrarMejorPedido(
				pedidosDisponibles,
				latitudActual,
				longitudActual
			);
			if (!mejorPedido || !isPedidoValid(mejorPedido)) break;

			const nuevaRuta = [...grupoActual, mejorPedido];
			const { tiempoTotal, distanciaTotal } = calcularTiempoYDistanciaRecorrido(
				nuevaRuta,
				LATITUD_INICIO,
				LONGITUD_INICIO
			);

			// Calcular tiempo de regreso
			const distanciaRegreso = calcularDistancia(
				mejorPedido.map[0],
				mejorPedido.map[1],
				LATITUD_INICIO,
				LONGITUD_INICIO
			);
			const tiempoRegreso = (distanciaRegreso / getVelocidadActual()) * 60;
			const tiempoTotalConRegreso = tiempoTotal + tiempoRegreso;

			// Verificar tiempo máximo de recorrido
			if (
				tiempoMaximoRecorrido !== null &&
				tiempoTotalConRegreso > tiempoMaximoRecorrido &&
				grupoActual.length > 0
			) {
				break;
			}

			const tiempoEspera = calcularTiempoEspera(mejorPedido.hora);
			const tiempoPercibido = tiempoEspera + tiempoTotal;

			grupoActual.push({
				...mejorPedido,
				tiempoPercibido: Math.round(tiempoPercibido),
			});

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

		// Calcular tiempo y distancia total final incluyendo el regreso a ANHELO
		const rutaCompleta = calcularTiempoYDistanciaRecorrido(
			grupoActual,
			LATITUD_INICIO,
			LONGITUD_INICIO
		);

		// Agregar el tiempo y distancia de regreso
		if (grupoActual.length > 0) {
			const ultimoPedido = grupoActual[grupoActual.length - 1];
			const distanciaRegreso = calcularDistancia(
				ultimoPedido.map[0],
				ultimoPedido.map[1],
				LATITUD_INICIO,
				LONGITUD_INICIO
			);
			const tiempoRegreso = (distanciaRegreso / getVelocidadActual()) * 60;

			return {
				pedidos: grupoActual,
				tiempoTotal: Math.round(rutaCompleta.tiempoTotal + tiempoRegreso),
				distanciaTotal: Number(
					(rutaCompleta.distanciaTotal + distanciaRegreso).toFixed(2)
				),
				peorTiempoPercibido: Math.round(peorTiempoPercibido),
				pedidoPeorTiempo,
			};
		}

		return {
			pedidos: grupoActual,
			tiempoTotal: Math.round(rutaCompleta.tiempoTotal),
			distanciaTotal: Number(rutaCompleta.distanciaTotal.toFixed(2)),
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
			if (!isPedidoValid(pedido)) continue;

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
		return armarGruposOptimos(
			pedidosConDistancias.filter((p) => p.deliveryMethod !== "takeaway"), // Filtrar pedidos takeaway
			tiempoMaximoRecorrido,
			pedidosPrioritarios
		);
	}, [
		pedidosConDistancias,
		tiempoMaximoRecorrido,
		gruposListos,
		pedidosPrioritarios,
		velocidadPromedio,
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
		phoneNumber: string,
		esGrupoListo: boolean = false
	) => {
		const loadingKey = `asignar-${grupoIndex}`;
		setLoadingStates((prev) => ({ ...prev, [loadingKey]: true }));

		try {
			// Validación solo cuando se hace clic en el botón
			const phoneRegex = /^[0-9]{10,15}$/;
			if (!phoneRegex.test(phoneNumber)) {
				Swal.fire({
					icon: 'error',
					title: 'Número inválido',
					text: 'Por favor ingrese un número de 10 a 15 dígitos',
				});
				return;
			}

			let grupoActualizado: Grupo;
			if (esGrupoListo) {
				const nuevosGruposListos = [...gruposListos];
				grupoActualizado = { ...nuevosGruposListos[grupoIndex] };
				grupoActualizado.pedidos = grupoActualizado.pedidos.map((pedido) => ({
					...pedido,
					cadete: phoneNumber,
				}));
				nuevosGruposListos[grupoIndex] = grupoActualizado;
				setGruposListos(nuevosGruposListos);

				for (const pedido of grupoActualizado.pedidos) {
					await updateCadeteForOrder(pedido.fecha, pedido.id, phoneNumber);
				}

				Swal.fire({
					icon: 'success',
					title: 'NÚMERO ASIGNADO',
					text: `Los pedidos fueron asignados al número: ${phoneNumber}`,
				});
			}

			const nuevasOrdenes = orders.map((orden) => {
				const pedidoEnGrupo = grupoActualizado.pedidos.find(
					(p) => p.id === orden.id
				);
				if (pedidoEnGrupo) {
					return { ...orden, cadete: phoneNumber };
				}
				return orden;
			});
			dispatch(readOrdersData(nuevasOrdenes));

		} catch (error) {
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Hubo un problema al asignar el número',
			});
			console.error('Error al asignar el número:', error);
		} finally {
			setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }));
		}
	};


	useEffect(() => {
		const pedidosParaBarajar: PedidoProps[] = [];
		const pedidosManuales: PedidoProps[] = [];
		pedidosDisponibles.forEach((pedido) => {
			if (!pedido) return;

			const pedidoInfo: PedidosGrupos = {
				id: pedido.id,
				direccion: pedido.direccion || "",
				cadete: pedido.cadete || "NO ASIGNADO",
				distancia: pedido.kms,
				hora: pedido.hora || "",
				tiempoEspera: calcularTiempoEspera(pedido.hora),
				map: pedido.map || [0, 0],
				aclaraciones: pedido.aclaraciones || "",
				detallePedido: pedido.detallePedido || [],
				elaborado: pedido.elaborado || false,
				envio: pedido.envio || 0,
				fecha: pedido.fecha || "",
				metodoPago: pedido.metodoPago || "",
				subTotal: pedido.subTotal || 0,
				telefono: pedido.telefono || "",
				total: pedido.total || 0,
				paid: pedido.paid || true,
				efectivoCantidad: pedido.efectivoCantidad || 0,
				mercadopagoCantidad: pedido.mercadopagoCantidad || 0,
				referencias: pedido.referencias || "",
				ubicacion: pedido.ubicacion || "",
				dislike: pedido.dislike || false,
				delay: pedido.delay || false,
				tiempoElaborado: pedido.tiempoElaborado || "",
				tiempoEntregado: pedido.tiempoEntregado || "",
				entregado: pedido.entregado || false,
				minutosDistancia: pedido.minutosDistancia || 0,
				kms: pedido.kms,
			};

			if (!isPedidoValid(pedido)) {
				pedidosManuales.push(pedidoInfo);
			} else {
				pedidosParaBarajar.push(pedidoInfo);
			}
		});
	}, [pedidosDisponibles]);

	const onDragEnd = (result: DropResult) => {
		const { source, destination } = result;
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
				// Si el grupo destino no existe, crear uno nuevo
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
		if (!hora) return "";
		try {
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
		} catch (error) {
			console.error("Error sumando 30 minutos:", error);
			return hora;
		}
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

	// Restricción de acceso basada en el rol del usuario
	if (
		user.email === "cocina@anhelo.com" ||
		user.email === "cadetes@anhelo.com"
	) {
		return (
			<div>
				<NavButtons
					seccionActiva={seccionActiva}
					setSeccionActiva={setSeccionActiva}
				/>
				<OrderList
					seccionActiva={seccionActiva}
					pedidosPorHacer={pedidosPorHacer}
					pedidosCerca={pedidosCerca}
					pedidosHechos={pedidosHechos}
					pedidosEntregados={seccionActiva !== "mapa" ? pedidosEntregados : []}
					cadetes={cadetes}
				/>
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
		if (!pedido) return;

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

	const [showComandas, setShowComandas] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const toggleSidebar = () => {
		setSidebarOpen(!sidebarOpen);
	};

	useEffect(() => {
		let unsubscribeAltaDemanda: Unsubscribe | null = null;

		const iniciarEscuchaAltaDemanda = async () => {
			try {
				unsubscribeAltaDemanda = listenToAltaDemanda((altaDemandaData) => {
					setAltaDemanda(altaDemandaData);
				});
			} catch (error) {
				console.error("Error al conectar con Alta Demanda:", error);
			}
		};

		iniciarEscuchaAltaDemanda();

		return () => {
			if (unsubscribeAltaDemanda) {
				unsubscribeAltaDemanda();
			}
		};
	}, []);

	const handleActivateHighDemand = async () => {
		try {
			await updateAltaDemanda(selectedDelay);
			Swal.fire({
				icon: "success",
				title: "Alta Demanda Activada",
				text: `Se activó la alta demanda con ${selectedDelay} minutos de demora`,
			});
		} catch (error) {
			Swal.fire({
				icon: "error",
				title: "Error",
				text: "No se pudo activar la alta demanda",
			});
		}
	};

	useEffect(() => {
		if (!altaDemanda?.isHighDemand) {
			setRemainingMinutes(null);
			return;
		}

		const calculateRemainingTime = () => {
			if (!altaDemanda?.highDemandStartTime) return;

			const startTime = altaDemanda.highDemandStartTime.getTime();
			const endTime = startTime + (altaDemanda.delayMinutes || 0) * 60 * 1000;
			const now = new Date().getTime();
			const remaining = Math.ceil((endTime - now) / (1000 * 60));

			if (remaining <= 0) {
				deactivateHighDemand();
				setRemainingMinutes(null);
			} else {
				setRemainingMinutes(remaining);
			}
		};

		calculateRemainingTime();
		const interval = setInterval(calculateRemainingTime, 60000);
		return () => clearInterval(interval);
	}, [altaDemanda]);

	const handleDeactivateHighDemand = async () => {
		try {
			await deactivateHighDemand();
			Swal.fire({
				icon: "success",
				title: "Alta Demanda Desactivada",
				text: "Se desactivó la alta demanda exitosamente",
			});
		} catch (error) {
			Swal.fire({
				icon: "error",
				title: "Error",
				text: "No se pudo desactivar la alta demanda",
			});
		}
	};

	useEffect(() => {
		if (orders.length > 0 && gruposListos.length > 0) {
			const gruposActualizados = gruposListos.map((grupo) => ({
				...grupo,
				pedidos: grupo.pedidos.map((pedido) => {
					const ordenActualizada = orders.find((o) => o.id === pedido.id);
					if (ordenActualizada) {
						return {
							...pedido,
							elaborado: ordenActualizada.elaborado,
							cookNow: ordenActualizada.cookNow,
						};
					}
					return pedido;
				}),
			}));

			const hayCambios = gruposActualizados.some((grupo, i) =>
				grupo.pedidos.some(
					(pedido, j) =>
						pedido.elaborado !== gruposListos[i].pedidos[j].elaborado ||
						pedido.cookNow !== gruposListos[i].pedidos[j].cookNow
				)
			);

			if (hayCambios) {
				setGruposListos(gruposActualizados);
			}
		}
	}, [orders]);
	const handleSendToCook = async (index: number, grupo: Grupo) => {
		setLoadingCook((prev) => ({ ...prev, [index]: true }));
		try {
			const pedidosNoElaborados = grupo.pedidos.filter(
				(pedido) => !pedido.elaborado
			);
			const todosConPrioridad = pedidosNoElaborados.every(
				(pedido) => pedido.cookNow
			);

			const nuevoEstadoCookNow = !todosConPrioridad;

			await Promise.all(
				pedidosNoElaborados.map((pedido) =>
					updateOrderCookNow(pedido.fecha, pedido.id, nuevoEstadoCookNow)
				)
			);

			const nuevosOrders = orders.map((order) => {
				if (pedidosNoElaborados.some((pedido) => pedido.id === order.id)) {
					return {
						...order,
						cookNow: nuevoEstadoCookNow,
					};
				}
				return order;
			});
			dispatch(readOrdersData(nuevosOrders));

			setGruposListos((prevGrupos) =>
				prevGrupos.map((g, i) => {
					if (i === index) {
						return {
							...g,
							pedidos: g.pedidos.map((pedido) => {
								if (!pedido.elaborado) {
									return {
										...pedido,
										cookNow: nuevoEstadoCookNow,
									};
								}
								return pedido;
							}),
						};
					}
					return g;
				})
			);

			Swal.fire({
				icon: "success",
				title: nuevoEstadoCookNow
					? "Pedidos enviados a cocina"
					: "Prioridad de cocina removida",
				text: nuevoEstadoCookNow
					? "Los pedidos han sido marcados para cocinar"
					: "Se ha quitado la prioridad de cocina de los pedidos",
			});
		} catch (error) {
			console.error("Error al modificar estado de cocina:", error);
			Swal.fire({
				icon: "error",
				title: "Error",
				text: "Hubo un problema al modificar el estado de cocina",
			});
		} finally {
			setLoadingCook((prev) => ({ ...prev, [index]: false }));
		}
	};

	useEffect(() => {
		const pedidosElaborados = orders.filter((pedido) => pedido.elaborado);
		// console.log("1. Pedidos elaborados:", pedidosElaborados.length);
		// console.log(
		// 	"1.1 Drinks registrados:",
		// 	drinks.map((d) => d.data.name)
		// ); // Agregar este log

		let totalProductos = 0;
		let totalMinutos = 0;

		pedidosElaborados.forEach((pedido) => {
			// Log cada pedido elaborado y sus productos
			// console.log("2. Analizando pedido:", pedido.id);
			// console.log("3. Detalle del pedido:", pedido.detallePedido);

			const cantidadPedido = pedido.detallePedido.reduce((sum, item) => {
				// Verificar si es bebida
				const esBebida = drinks.some(
					(drink) => drink.data.name === item.burger
				);
				// console.log("4. Producto:", item.burger, "Es bebida:", esBebida);
				return sum + (esBebida ? 0 : item.quantity || 0);
			}, 0);
			// console.log(
			// 	"5. Cantidad total de productos (sin bebidas):",
			// 	cantidadPedido
			// );
			totalProductos += cantidadPedido;

			if (pedido.tiempoElaborado) {
				const [horas, minutos] = pedido.tiempoElaborado.split(":").map(Number);
				const minutosElaboracion = horas * 60 + minutos;
				totalMinutos += minutosElaboracion;
				// console.log("6. Tiempo de elaboración:", minutosElaboracion, "minutos");
			}
		});

		const promedio = totalProductos > 0 ? totalMinutos / totalProductos : 0;
		// console.log("7. Resumen:");
		// console.log("   - Total productos (sin bebidas):", totalProductos);
		// console.log("   - Total minutos:", totalMinutos);
		// console.log("   - Promedio minutos por producto:", promedio);

		setTiempoElaboracionPromedioHOY(promedio);
	}, [orders]);

	const calcularTiempoEstimadoElaboracion = (pedido: PedidoProps): number => {
		if (!pedido?.detallePedido) return 0;

		// console.log("8. Calculando tiempo para pedido:", pedido.id);
		// Solo contar productos que NO son bebidas
		const cantidadProductos = pedido.detallePedido.reduce((sum, item) => {
			// Verificar si el producto es una bebida
			const esBebida = drinks.some((drink) => drink.data.name === item.burger);
			// console.log("9. Producto:", item.burger);
			// console.log("   - Es bebida:", esBebida);
			// console.log("   - Cantidad:", item.quantity || 0);

			return sum + (esBebida ? 0 : item.quantity || 0);
		}, 0);

		const tiempoEstimado = Math.round(
			cantidadProductos * tiempoElaboracionPromedioHOY
		);
		// console.log("10. Resumen del cálculo:");
		// console.log("    - Cantidad productos (sin bebidas):", cantidadProductos);
		// console.log(
		// 	"    - Tiempo promedio por producto:",
		// 	tiempoElaboracionPromedioHOY
		// );
		// console.log("    - Tiempo estimado total:", tiempoEstimado);

		return tiempoEstimado;
	};

	const getCookButtonText = (grupo: Grupo): string => {
		if (grupo.pedidos.every((pedido) => pedido.elaborado)) {
			return "Ya cocinado";
		}

		const pedidosNoElaborados = grupo.pedidos.filter(
			(pedido) => !pedido.elaborado
		);
		const todosPriorizados = pedidosNoElaborados.every(
			(pedido) => pedido.cookNow
		);

		if (todosPriorizados) {
			return "No priorizar";
		}

		return "Cocinar YA";
	};

	const getCookButtonIcon = (grupo: Grupo): JSX.Element => {
		if (grupo.pedidos.every((pedido) => pedido.elaborado)) {
			return <img src={listoIcon} className="h-3" alt="" />;
		}

		const pedidosNoElaborados = grupo.pedidos.filter(
			(pedido) => !pedido.elaborado
		);
		const todosPriorizados = pedidosNoElaborados.every(
			(pedido) => pedido.cookNow
		);

		if (todosPriorizados) {
			return (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth="2"
					stroke="currentColor"
					className="h-6 text-red-main"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M9.143 17.082a24.248 24.248 0 0 0 3.844.148m-3.844-.148a23.856 23.856 0 0 1-5.455-1.31 8.964 8.964 0 0 0 2.3-5.542m3.155 6.852a3 3 0 0 0 5.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 0 0 3.536-1.003A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53"
					/>
				</svg>
			);
		}

		return (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				className="h-6"
			>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M5.85 3.5a.75.75 0 0 0-1.117-1 9.719 9.719 0 0 0-2.348 4.876.75.75 0 0 0 1.479.248A8.219 8.219 0 0 1 5.85 3.5ZM19.267 2.5a.75.75 0 1 0-1.118 1 8.22 8.22 0 0 1 1.987 4.124.75.75 0 0 0 1.48-.248A9.72 9.72 0 0 0 19.266 2.5Z"
				/>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M12 2.25A6.75 6.75 0 0 0 5.25 9v.75a8.217 8.217 0 0 1-2.119 5.52.75.75 0 0 0 .298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 1 0 7.48 0 24.583 24.583 0 0 0 4.83-1.244.75.75 0 0 0 .298-1.205 8.217 8.217 0 0 1-2.118-5.52V9A6.75 6.75 0 0 0 12 2.25ZM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 0 0 4.496 0l.002.1a2.25 2.25 0 1 1-4.5 0Z"
				/>
			</svg>
		);
	};

	const PhoneNumberInput = ({ value, onAssign, loading, index }) => {
		const [phoneNumber, setPhoneNumber] = useState(value || "");

		return (
			<div className="relative flex items-center gap-2 w-full">
				<div className="flex-1 relative">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="h-6 absolute left-4 top-1/2 -translate-y-1/2 text-red-main"
					>
						<path
							fillRule="evenodd"
							d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
							clipRule="evenodd"
						/>
					</svg>

					<input
						type="tel"
						className="bg-gray-400 text-red-main bg-opacity-50 h-10 text-center rounded-full font-bold pl-12 pr-4 w-full"
						placeholder="Ingrese número"
						value={phoneNumber}
						onChange={(e) => setPhoneNumber(e.target.value)}
						disabled={loading}
					/>
				</div>

				<button
					onClick={() => onAssign(phoneNumber)}
					disabled={loading}
					className="bg-red-main text-white h-10 px-4 rounded-full font-bold hover:bg-red-700 transition-colors"
				>
					{loading ? (
						<div className="flex items-center gap-1">
							<div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
							<div className="w-2 h-2 bg-white rounded-full animate-pulse delay-75"></div>
							<div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150"></div>
						</div>
					) : (
						"Asignar"
					)}
				</button>
			</div>
		);
	};










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
          background-color: #111827;
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
			<div className="px-4 flex flex-col font-coolvetica w-screen max-w-screen overflow-x-hidden">
				<button
					onClick={() => setIsCreateCadetModalOpen(true)}
					className="bg-red-main text-white px-6 py-2 rounded-lg font-bold mt-4 hover:bg-red-700 transition-colors"
				>
					CREAR CADETE
				</button>

				<CreateCadetModal
					isOpen={isCreateCadetModalOpen}
					onClose={() => setIsCreateCadetModalOpen(false)}
				/>
				<div className="flex  flex-col  w-full mt-4 mb-12 gap-y-2">
					<div className="flex items-center flex-row w-full justify-between ">
						<AnimatedSvgButton
							onToggleSidebar={toggleSidebar}
							isSidebarOpen={sidebarOpen}
						/>
						<div className="flex flex-row w-fit ">
							{/* Delay */}
							<div className="relative  w-full">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									className="h-6 absolute left-2 top-1/2 -translate-y-1/2"
									style={selectedDelay === 0 ? {} : { filter: "invert(100%)" }}
								>
									<path
										fillRule="evenodd"
										clipRule="evenodd"
										d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
									/>
								</svg>
								<select
									value={selectedDelay}
									onChange={(e) => setSelectedDelay(Number(e.target.value))}
									className={`h-10   pl-9  pb-0.5 font-bold rounded-full ${selectedDelay === 0
										? "bg-gray-300 text-black"
										: "bg-black text-gray-100 "
										}`}
									style={{
										WebkitAppearance: "none",
										MozAppearance: "none",
										width: "130px",
									}}
								>
									<option value={0}>Minutos de demora</option>
									<option value={15}>15 minutos</option>
									<option value={30}>30 minutos</option>
									<option value={45}>45 minutos</option>
									<option value={60}>60 minutos</option>
								</select>
							</div>

							{/* Botón que activa la alta demanda */}
							{!altaDemanda?.isHighDemand && (
								<button
									onClick={handleActivateHighDemand}
									disabled={selectedDelay === 0}
									className={`px-4 w-full ml-2 flex flex-row items-center gap-1 h-10 rounded-full font-medium ${selectedDelay === 0
										? "bg-gray-300 text-gray-500 cursor-not-allowed"
										: "bg-black text-white hover:bg-gray-800"
										}`}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="currentColor"
										className="h-6"
									>
										<path d="M15 6.75a.75.75 0 0 0-.75.75V18a.75.75 0 0 0 .75.75h.75a.75.75 0 0 0 .75-.75V7.5a.75.75 0 0 0-.75-.75H15ZM20.25 6.75a.75.75 0 0 0-.75.75V18c0 .414.336.75.75.75H21a.75.75 0 0 0 .75-.75V7.5a.75.75 0 0 0-.75-.75h-.75ZM5.055 7.06C3.805 6.347 2.25 7.25 2.25 8.69v8.122c0 1.44 1.555 2.343 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L5.055 7.061Z" />
									</svg>
									<p className="font-bold">Pausar</p>
								</button>
							)}

							{/* Botón que desactiva la alta demanda */}
							{altaDemanda?.isHighDemand &&
								remainingMinutes &&
								remainingMinutes > 0 && (
									<div className="flex w-full">
										<button
											onClick={handleDeactivateHighDemand}
											className="bg-red-main gap-2 text-gray-100 flex items-center w-full pl-4 h-10 ml-2 font-bold rounded-full "
											style={{
												WebkitAppearance: "none",
												MozAppearance: "none",
												width: "125px",
											}}
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 24 24"
												fill="currentColor"
												className="h-6"
											>
												<path d="M15 6.75a.75.75 0 0 0-.75.75V18a.75.75 0 0 0 .75.75h.75a.75.75 0 0 0 .75-.75V7.5a.75.75 0 0 0-.75-.75H15ZM20.25 6.75a.75.75 0 0 0-.75.75V18c0 .414.336.75.75.75H21a.75.75 0 0 0 .75-.75V7.5a.75.75 0 0 0-.75-.75h-.75ZM5.055 7.06C3.805 6.347 2.25 7.25 2.25 8.69v8.122c0 1.44 1.555 2.343 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L5.055 7.061Z" />
											</svg>
											Retomar
										</button>
									</div>
								)}
						</div>
					</div>
					{altaDemanda?.isHighDemand &&
						remainingMinutes &&
						remainingMinutes > 0 && (
							<div className="flex items-center gap-2 w-full bg-red-100 px-4 h-10 rounded-full">
								<div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
								<span className="text-red-500 font-bold">
									{remainingMinutes}{" "}
									{remainingMinutes === 1 ? "minuto" : "minutos"} restantes
								</span>
							</div>
						)}
				</div>

				<Sidebar
					isOpen={sidebarOpen}
					onClose={() => setSidebarOpen(false)}
					tiempoMaximoRecorrido={tiempoMaximoRecorrido}
					setTiempoMaximoRecorrido={setTiempoMaximoRecorrido}
					velocidadPromedio={velocidadPromedio}
					handleCadeteVelocidadChange={handleCadeteVelocidadChange}
					cadetesDisponibles={cadetesDisponibles}
					calcularVelocidadPromedio={calcularVelocidadPromedio}
					onlyElaborated={onlyElaborated}
					setOnlyElaborated={setOnlyElaborated}
					hideAssignedGroups={hideAssignedGroups}
					setHideAssignedGroups={setHideAssignedGroups}
					showComandas={showComandas}
					setShowComandas={setShowComandas}
				/>

				<div>
					<div className="hidden md:flex md:flex-row items-center w-full mb-8 mt-2">
						<p className="text-6xl font-bold">Grupos</p>

						<div className="md:w-[1px] md:h-16 h-[0px] mt-2 opacity-20 bg-black ml-4 mr-4"></div>

						{/* Parámetros */}
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
														clipRule="evenodd"
														d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
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
													className={`h-10 appearance-none pt-2 pl-11 pr-8 pb-3 px-3 font-medium rounded-full ${tiempoMaximo === null
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
													<option value={20}>20 minutos</option>
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
														fillRule="evenodd"
														clipRule="evenodd"
														d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
													/>
												</svg>

												<select
													id="cadeteVelocidad"
													onChange={handleCadeteVelocidadChange}
													className={`h-10 appearance-none pt-2 pl-11 pr-8 pb-3 px-3 font-medium rounded-full ${velocidadPromedio === null
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
														clipRule="evenodd"
														d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
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
													className={`h-10 appearance-none pt-2 pl-11 pr-8 pb-3 px-3 font-medium rounded-full ${tiempoMaximoRecorrido === null
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
													<option value={20}>20 minutos</option>
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
														fillRule="evenodd"
														clipRule="evenodd"
														d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
													/>
												</svg>

												<select
													id="cadeteVelocidad"
													onChange={handleCadeteVelocidadChange}
													className={`h-10 appearance-none pt-2 pl-11 pr-8 pb-3 px-3 font-medium rounded-full ${velocidadPromedio === null
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

						<div className="md:w-[1px] md:h-16 h-[0px] mt-2 opacity-20 bg-black ml-4 mr-4"></div>

						{/* Ver como va todo */}
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
					<div className="flex-col md:grid md:grid-cols-4 gap-4">
						<DragDropContext onDragEnd={onDragEnd}>
							{(grupoManual.length > 0 || pedidosReserva.length > 0) && (
								<div className="flex flex-col">
									{grupoManual.length > 0 && (
										<div className="bg-gray-300 shadow-gray-400 h-min font-coolvetica w-full shadow-lg  p-4 mb-4 rounded-lg">
											<h3 className="font-medium text-black mt-4 mb-8 text-center">
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
																				<div className="bg-black z-10 text-center ml-4 justify-center text-xs flex items-center font-bold text-gray-100 h-6 w-6">
																					{index + 1}
																				</div>
																				<div className="pl-4 pb-3.5 pt-2">
																					<p className="font-bold text-lg leading-none mb-2 mt-1">
																						{getFormattedAddress(pedido)}{" "}
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
											<div className="bg-gray-300 shadow-gray-400 rounded-lg p-4 mb-4 h-min font-coolvetica w-full shadow-lg">
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
																<div className="bg-black text-xs flex items-center z-10 text-center ml-4 justify-center font-bold text-gray-100 h-6 w-6">
																	{index + 1}
																</div>
																<div className="pl-4 pb-3.5 pt-2">
																	<p className="font-bold text-lg">
																		{getFormattedAddress(pedido)}
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
																	viewBox="0 0 24 24"
																	fill="currentColor"
																	className={`h-4 pr-4 cursor-pointer text-gray-300 ${unlocking[index] ? "unlocking" : ""
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
																	<path
																		fillRule="evenodd"
																		d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
																		clipRule="evenodd"
																	/>
																</svg>
																{tooltipVisibility[index] && (
																	<div
																		className={`absolute z-50 px-2 py-2 font-light text-white bg-black rounded-lg shadow-sm tooltip text-xs bottom-full left-1/2 transform -translate-x-1/2 mb-2 whitespace-nowrap flex flex-row items-center gap-2 overflow-hidden h-[30px] ${unlocking[index] ? "unlocking" : ""
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
																				<path d="M5925 12794c-568-60-1036-276-1416-654-341-339-547-740-642-1245-20-107-21-148-24-1452l-4-1343-1917-2-1917-3 0-2070 0-2070 1128-5 1128-5-1-315c0-173-3-345-7-381l-6-66-96 0c-109 1-151-14-170-61-12-28-7-51 18-92 5-8 26-66 46-129 20-63 63-181 96-264 33-82 59-150 57-152-2-1-39-23-83-50-304-182-515-471-610-836-21-83-28-136-32-258-8-228 21-391 104-574 70-154 139-256 256-376 502-515 1321-520 1828-10 148 149 254 323 325 536 52 153 68 254 67 423-1 277-77 505-242 728-103 139-267 288-419 381-28 18-52 39-52 46 0 8 18 87 40 176 61 248 101 453 103 532l2 70-143 71c-160 79-148 63-127 162 7 30 1 36-147 164-84 74-155 135-157 136-1 2 2 34 9 73l12 71 1048 0c954 0 1049 1 1061 16 20 25 21 4093 0 4117-12 15-45 17-292 17l-279 0 0 1264c0 1065 2 1283 15 1378 65 496 344 924 775 1191 282 174 649 259 983 229 411-38 735-188 1023-476 278-279 430-595 473-988 7-59 11-348 11-727l0-630 22-20c72-68 325-89 480-41 76 23 108 44 108 71 0 10 5 19 11 19 7 0 9 207 6 703-5 755-5 758-62 994-216 896-949 1565-1870 1708-97 15-438 27-520 19z" />
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

							{gruposListos
								.filter(
									(grupo) =>
										!hideAssignedGroups ||
										!grupo.pedidos[0]?.cadete ||
										grupo.pedidos[0]?.cadete === "NO ASIGNADO"
								)
								.map((grupo, index) => (
									<Droppable
										droppableId={index.toString()}
										key={`listo-${index}`}
									>
										{(provided) => (
											<div
												{...provided.droppableProps}
												ref={provided.innerRef}
												className="bg-gray-300 shadow-gray-400 h-min font-coolvetica w-full shadow-lg p-4 mb-4 rounded-lg"
											>
												<div className="flex flex-col mt-4 mb-10 text-center justify-center">
													<div className="flex flex-row items-center justify-center gap-4">
														<img src={listoIcon} className="h-4 mb-2" alt="" />
														<h3 className="font-bold text-4xl md:text-3xl mb-2">
															Grupo {index + 1}
														</h3>
														<img
															src={wspIcon}
															className="h-4 mb-2 cursor-pointer"
															alt=""
															onClick={(e) => {
																e.stopPropagation();
																const direcciones = grupo.pedidos
																	.map(
																		(pedido, index) =>
																			`${index + 1}. ${pedido.direccion.split(",")[0]
																			}`
																	)
																	.join("\n");
																navigator.clipboard.writeText(
																	`Direcciones del grupo:\n${direcciones}`
																);
																window.open(
																	"https://chat.whatsapp.com/LNq70ajNUWWFbVRnGyBACZ",
																	"_blank"
																);
																alert(
																	"Direcciones copiadas al portapapeles y grupo de WhatsApp abierto"
																);
															}}
														/>
													</div>
													<p className="text-xs">
														Peor entrega: {grupo.peorTiempoPercibido} minutos (
														{grupo.pedidoPeorTiempo?.direccion
															? getFirstPartOfAddress(
																grupo.pedidoPeorTiempo.direccion
															)
															: "N/A"}
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
													className="bg-gray-400 bg-opacity-50 w-full h-[64px] mb-2 text-red-main font-bold  rounded-lg flex justify-center items-center text-3xl md:text-3xl font-coolvetica"
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

												<div className="flex flex-col items-center justify-between w-full mt-2 mb-2 gap-2">
													{/* No asignado */}
													<PhoneNumberInput
														value={grupo.pedidos[0]?.cadete || ""}
														onAssign={(number) => handleAsignarCadete(index, number, true)}
														loading={loadingStates[`asignar-${index}`]}
														index={index}
													/>

													{grupo.pedidos.some((pedido) =>
														pedido.hasOwnProperty("elaborado")
													) && (
															<div
																onClick={() => {
																	if (
																		!grupo.pedidos.every(
																			(pedido) => pedido.elaborado
																		)
																	) {
																		handleSendToCook(index, grupo);
																	}
																}}
																className={`bg-gray-400 bg-opacity-50 w-full  h-10 gap-1 rounded-full flex items-center justify-center font-coolvetica ${!grupo.pedidos.every(
																	(pedido) => pedido.elaborado
																)
																	? "cursor-pointer "
																	: "cursor-default"
																	} ${grupo.pedidos.every(
																		(pedido) => pedido.elaborado
																	)
																		? "text-black"
																		: grupo.pedidos
																			.filter((pedido) => !pedido.elaborado)
																			.every((pedido) => pedido.cookNow)
																			? "text-black"
																			: "text-red-main"
																	}`}
															>
																{loadingCook[index] ? (
																	<div className="flex justify-center w-full items-center">
																		<div className="flex flex-row gap-1 ">
																			<div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse"></div>
																			<div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse delay-75"></div>
																			<div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse delay-150"></div>
																		</div>
																	</div>
																) : (
																	<>
																		{React.isValidElement(
																			getCookButtonIcon(grupo)
																		) && getCookButtonIcon(grupo).type === "img"
																			? React.cloneElement(
																				getCookButtonIcon(grupo),
																				{
																					className: "ml-1 h-4",
																				}
																			)
																			: getCookButtonIcon(grupo)}

																		<p
																			className={
																				getCookButtonText(grupo) === "Ya cocinado"
																					? "ml-1 font-bold"
																					: getCookButtonText(grupo) ===
																						"No priorizar"
																						? "text-red-main font-bold "
																						: getCookButtonText(grupo) ===
																							"Cocinar YA"
																							? "text-red-main ml-1 font-bold"
																							: ""
																			}
																		>
																			{getCookButtonText(grupo)}
																		</p>
																	</>
																)}
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
																className={`bg-gray-100 relative flex flex-row items-center ${pedidoIndex === 0
																	? "rounded-t-lg"
																	: pedidoIndex === grupo.pedidos.length - 1
																		? "rounded-b-lg"
																		: ""
																	}`}
																onClick={() => handlePedidoClick(pedido)}
															>
																<div className="bg-black absolute z-10 text-center ml-4 justify-center font-bold  flex items-center text-gray-100 h-10 w-10 rounded-full">
																	{pedidoIndex + 1}
																</div>
																<div className="ml-14 mr-4">
																	{grupo.pedidos.length > 1 && (
																		<div
																			className={`w-1.5 bg-black absolute left-[33px]  ${pedidoIndex === 0
																				? "h-1/2 bottom-0"
																				: pedidoIndex ===
																					grupo.pedidos.length - 1
																					? "h-1/2 top-0"
																					: "h-full"
																				}`}
																		></div>
																	)}
																	<div
																		className={`flex flex-row justify-between ${pedidoIndex !== grupo.pedidos.length - 1
																			? "border-b border-black border-opacity-20"
																			: ""
																			} w-full ml-4 pb-3.5 pt-2`}
																	>
																		<div>
																			<p className="font-bold text-lg leading-none mb-2 mt-1">
																				{getFormattedAddress(pedido)}{" "}
																				<span className="text-xs font-normal">
																					(
																					{isPedidoValid(pedido)
																						? `${pedido.distancia} km`
																						: "Desconocido"}
																					)
																				</span>
																			</p>

																			<div className="flex flex-row items-center gap-1.5">
																				{calcularTiempoEspera(pedido.hora) >
																					20 && (
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
																									calcularTiempoEspera(
																										pedido.hora
																									) > 30
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
																									calcularTiempoEspera(
																										pedido.hora
																									) > 30
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
																				{isPedidoValid(pedido) ? (
																					<>
																						<div
																							className={`text-xs h-1.5 w-1.5 rounded-full ${(pedido.tiempoPercibido ?? 0) <
																								30
																								? "bg-black"
																								: (pedido.tiempoPercibido ??
																									0) < 50
																									? "bg-yellow-500"
																									: "bg-red-main"
																								}`}
																						></div>
																						<p className="text-xs">
																							Percibe entrega de:{" "}
																							{pedido.tiempoPercibido ?? 0}{" "}
																							minutos
																						</p>
																					</>
																				) : (
																					<p className="text-xs">
																						Percibe entrega de: Desconocido
																					</p>
																				)}
																			</div>
																			{pedido.hasOwnProperty("elaborado") &&
																				(pedido.elaborado ? (
																					<p className="text-xs text-green-600 font-medium">
																						Ya cocinado
																					</p>
																				) : (
																					<p className="text-xs font-medium text-red-600">
																						{pedido.cookNow
																							? `Priorizado para cocinar: ${calcularTiempoEstimadoElaboracion(
																								pedido
																							)} minutos`
																							: `No cocinado (${calcularTiempoEstimadoElaboracion(
																								pedido
																							)} min. necesarios)`}
																					</p>
																				))}
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
																							clipRule="evenodd"
																							d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
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
																						[`listo-${index}-${pedidoIndex}`]:
																							true,
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
																					<div className="absolute z-50 px-2 py-2 font-light text-white rounded-lg shadow-sm tooltip bg-black text-xs bottom-full mb-[-12px] left-1/2 transform -translate-x-1/2 whitespace-nowrap flex flex-row items-center gap-2 h-[30px]">
																						<p className="mb-[1.5px] text-xs">
																							Presiona para arrastrar este pedido
																						</p>
																					</div>
																				)}
																		</div>
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
										className="bg-gray-300 shadow-gray-400 h-min font-coolvetica w-full shadow-lg p-4 mb-4 rounded-lg"
									>
										<div className="flex flex-col mt-4 mb-10 text-center items-center justify-center">
											<h3 className="font-bold text-4xl md:text-3xl mb-2 items-center gap-4 flex flex-row">
												<svg
													className="w-3 h-3 text-gray-100 animate-spin dark:fill-black"
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
												Pensando
											</h3>
											<p className="text-xs">
												Peor entrega: {grupo.peorTiempoPercibido} minutos (
												{grupo.pedidoPeorTiempo?.direccion
													? getFirstPartOfAddress(
														grupo.pedidoPeorTiempo.direccion
													)
													: "N/A"}
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
											className="bg-black w-full h-[64px] mb-2 text-gray-100 rounded-lg flex justify-center font-bold items-center text-3xl font-coolvetica"
											onClick={() => handleGrupoListo(grupo)}
										>
											Listo
										</button>
										{grupo.pedidos.map((pedido, pedidoIndex) => (
											<div className="flex flex-row">
												<div
													key={`${pedido.id}-gruposDepedidos`}
													className={`bg-gray-100 relative w-full flex flex-row items-center ${pedidoIndex === 0
														? "rounded-t-lg "
														: pedidoIndex === grupo.pedidos.length - 1
															? "rounded-b-lg"
															: ""
														}`}
													onClick={() => handlePedidoClick(pedido)}
												>
													<div className="bg-black absolute z-10 text-center ml-4 justify-center font-bold  flex items-center text-gray-100 h-10 w-10 rounded-full">
														{pedidoIndex + 1}
													</div>

													<div className="ml-14 mr-4">
														{grupo.pedidos.length > 1 && (
															<div
																className={`w-1.5 bg-black absolute left-[33px] ${pedidoIndex === 0
																	? "h-1/2 bottom-0"
																	: pedidoIndex === grupo.pedidos.length - 1
																		? "h-1/2 top-0"
																		: "h-full"
																	}`}
															></div>
														)}
														<div
															className={`flex flex-row justify-between items-center ${pedidoIndex !== grupo.pedidos.length - 1
																? "border-b border-black border-opacity-20"
																: ""
																} w-full ml-4 pb-3.5 pt-2`}
														>
															<div className="flex flex-col">
																<p className="font-bold text-lg leading-none mb-2 mt-1">
																	{getFormattedAddress(pedido)}{" "}
																	<span className="text-xs font-normal">
																		(
																		{isPedidoValid(pedido)
																			? `${pedido.distancia} km`
																			: "Desconocido"}
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
																		{calcularTiempoEspera(pedido.hora)} minutos
																	</p>
																</div>
																<div className="flex flex-row gap-1.5 items-center">
																	{pedido.tiempoPercibido != null &&
																		pedido.tiempoPercibido >= 30 && (
																			<div
																				className={`text-xs h-1.5 w-1.5 rounded-full ${pedido.tiempoPercibido < 50
																					? "bg-yellow-500"
																					: "bg-red-main"
																					}`}
																			></div>
																		)}
																	<p className="text-xs">
																		Percibe entrega de:{" "}
																		{pedido.tiempoPercibido ?? 0} minutos
																	</p>
																</div>
																{pedido.hasOwnProperty("elaborado") &&
																	(pedido.elaborado ? (
																		<p className="text-xs text-green-600 font-medium">
																			Ya cocinado
																		</p>
																	) : (
																		<p className="text-xs font-medium text-red-600">
																			{pedido.cookNow
																				? `Priorizado para cocinar: ${calcularTiempoEstimadoElaboracion(
																					pedido
																				)} minutos`
																				: `No cocinado (${calcularTiempoEstimadoElaboracion(
																					pedido
																				)} min. necesarios)`}
																		</p>
																	))}
															</div>
															<div className="flex items-center relative">
																<button
																	onClick={() =>
																		togglePedidoPrioritario(pedido)
																	}
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
																				clipRule="evenodd"
																				d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
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
																{tooltipVisibility[
																	`${index}-${pedidoIndex}`
																] && (
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
																				Para arrastrar pedidos tenes que marcar
																				como listo el grupo
																			</p>
																		</div>
																	)}
															</div>
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
						<div className="relative bg-white rounded-lg max-w-lg m-4 max-h-[90vh] flex flex-col">
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
						<div className="flex flex-row mt-12">
							<NavButtons
								seccionActiva={seccionActiva}
								setSeccionActiva={setSeccionActiva}
							/>
							<CadeteSelect
								cadetes={cadetes}
								handleCadeteChange={handleCadeteChange}
								selectedCadete={selectedCadete}
								orders={pedidosHechos}
							/>
							<GeneralStats
								customerSuccess={customerSuccess}
								orders={orders}
								cadeteSeleccionado={selectedCadete}
								sumaTotalPedidos={sumaTotalPedidos}
								sumaTotalEfectivo={sumaTotalEfectivo}
								empleados={empleados}
							/>
						</div>
						<OrderList
							seccionActiva={seccionActiva}
							pedidosPorHacer={pedidosPorHacer}
							pedidosHechos={pedidosHechos}
							pedidosCerca={pedidosCerca}
							pedidosEntregados={
								seccionActiva !== "mapa" ? pedidosEntregados : []
							}
							cadetes={cadetes}
						/>
					</>
				)}
			</div>
		</>
	);
};

export default ComanderaAutomatizada;
