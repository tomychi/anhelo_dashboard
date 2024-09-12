import React, { useEffect, useState, useMemo, useRef } from "react";
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
import listoIcon from "../assets/listoIcon.png";
import Swal from "sweetalert2";
import { updateCadeteForOrder } from "../firebase/UploadOrder";
import { obtenerHoraActual } from "../helpers/dateToday";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

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
	const [tiempoMaximoRecorrido, setTiempoMaximoRecorrido] = useState(40);
	const [modoAgrupacion, setModoAgrupacion] = useState("entrega"); // 'entrega' o 'recorrido'
	const [tiempoActual, setTiempoActual] = useState(new Date());
	const [gruposListos, setGruposListos] = useState([]);
	const [gruposOptimos, setGruposOptimos] = useState([]);
	const [grupoManual, setGrupoManual] = useState([]);
	const [loadingStates, setLoadingStates] = useState({});
	const [tooltipVisibility, setTooltipVisibility] = useState({});

	useEffect(() => {
		const timer = setInterval(() => {
			setTiempoActual(new Date());
		}, 60000); // Actualiza cada minuto

		return () => clearInterval(timer);
	}, []);

	const calcularTiempoEspera = (horaPedido) => {
		const [horas, minutos] = horaPedido.split(":").map(Number);
		const fechaPedido = new Date(tiempoActual);
		fechaPedido.setHours(horas, minutos, 0, 0);

		const diferencia = tiempoActual.getTime() - fechaPedido.getTime();
		const minutosEspera = Math.floor(diferencia / 60000);

		return minutosEspera;
	};

	const handleDeshacerGrupo = async (index) => {
		setLoadingStates((prev) => ({ ...prev, [index]: true }));
		try {
			const grupoActualizado = gruposListos[index];

			// Aquí iría la lógica para deshacer el grupo
			// Por ejemplo:
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

			const cadeteAsignado = empleados.find(
				(empleado) =>
					empleado.name.toLowerCase() === order.cadete.toLowerCase() &&
					empleado.category === "cadete"
			);

			return cadeteAsignado && cadeteAsignado.available;
		});
	}, [orders, empleados, tiempoActual]);

	// Factor de corrección para ajustar la distancia lineal a la distancia real en la ciudad
	const FACTOR_CORRECCION = 1.455;

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

	function encontrarPedidoMasCercano(pedidos) {
		if (pedidos.length === 0) return null;
		return pedidos.reduce((pedidoMasCercano, pedidoActual) => {
			return parseFloat(pedidoActual.distancia) <
				parseFloat(pedidoMasCercano.distancia)
				? pedidoActual
				: pedidoMasCercano;
		});
	}

	// Constantes para el cálculo de tiempo
	// Ajustamos estos valores para que se acerquen más a las estimaciones de Google Maps
	const VELOCIDAD_PROMEDIO_MOTO = 35; // km/h (aumentamos un poco la velocidad promedio)
	const TIEMPO_POR_ENTREGA = 3; // minutos (reducimos el tiempo por entrega)

	function calcularTiempoYDistanciaRecorrido(
		grupo,
		latitudInicio,
		longitudInicio
	) {
		let tiempoTotal = 0;
		let distanciaTotal = 0;
		let latitudActual = latitudInicio;
		let longitudActual = longitudInicio;

		grupo.forEach((pedido, index) => {
			const distancia = calcularDistancia(
				latitudActual,
				longitudActual,
				pedido.map[0],
				pedido.map[1]
			);
			distanciaTotal += distancia;
			const tiempoViaje = (distancia / VELOCIDAD_PROMEDIO_MOTO) * 60; // Convertir a minutos
			tiempoTotal += tiempoViaje;

			if (index < grupo.length - 1) {
				tiempoTotal += TIEMPO_POR_ENTREGA;
			}

			latitudActual = pedido.map[0];
			longitudActual = pedido.map[1];
		});

		// Agregamos un pequeño factor de ajuste para considerar semáforos y tráfico
		const factorAjuste = 1.1; // 10% adicional
		tiempoTotal *= factorAjuste;

		return {
			tiempoTotal: Math.round(tiempoTotal),
			distanciaTotal: Number(distanciaTotal.toFixed(2)),
		};
	}

	function armarGruposOptimos(pedidos, tiempoMaximo, modoAgrupacion) {
		// Filtrar los pedidos que no están en grupos listos y que no son manuales
		const pedidosDisponibles = pedidos.filter(
			(pedido) =>
				!gruposListos.some((grupo) =>
					grupo.pedidos.some((p) => p.id === pedido.id)
				) && !(pedido.map[0] === 0 && pedido.map[1] === 0)
		);

		// Separar los pedidos manuales
		const pedidosManuales = pedidos.filter(
			(pedido) => pedido.map[0] === 0 && pedido.map[1] === 0
		);

		// Actualizar el estado del grupo manual
		setGrupoManual(pedidosManuales);

		if (pedidosDisponibles.length === 0) return [];

		const gruposOptimos = [];
		let pedidosRestantes = [...pedidosDisponibles];

		while (pedidosRestantes.length > 0) {
			let grupoActual = [];
			let tiempoTotalGrupo = 0;
			let distanciaTotalGrupo = 0;
			let peorTiempoPercibido = 0;
			let pedidoPeorTiempo = null;
			let latitudActual = LATITUD_INICIO;
			let longitudActual = LONGITUD_INICIO;

			while (pedidosRestantes.length > 0) {
				let mejorPedido = null;
				let mejorDistancia = Infinity;
				let mejorIndice = -1;

				// Buscar el pedido más cercano a cualquier punto en el grupo actual
				pedidosRestantes.forEach((pedido, index) => {
					let distanciaMinima = calcularDistancia(
						latitudActual,
						longitudActual,
						pedido.map[0],
						pedido.map[1]
					);

					grupoActual.forEach((pedidoGrupo) => {
						const distancia = calcularDistancia(
							pedidoGrupo.map[0],
							pedidoGrupo.map[1],
							pedido.map[0],
							pedido.map[1]
						);
						if (distancia < distanciaMinima) {
							distanciaMinima = distancia;
						}
					});

					if (distanciaMinima < mejorDistancia) {
						mejorDistancia = distanciaMinima;
						mejorPedido = pedido;
						mejorIndice = index;
					}
				});

				if (!mejorPedido) break;

				// Calcular el nuevo tiempo total y percibido si se añade este pedido
				const nuevaRuta = [...grupoActual, mejorPedido];
				const { tiempoTotal, distanciaTotal } =
					calcularTiempoYDistanciaRecorrido(
						nuevaRuta,
						LATITUD_INICIO,
						LONGITUD_INICIO
					);

				// Calcular el tiempo de regreso al local
				const distanciaRegreso = calcularDistancia(
					mejorPedido.map[0],
					mejorPedido.map[1],
					LATITUD_INICIO,
					LONGITUD_INICIO
				);
				const tiempoRegreso = (distanciaRegreso / VELOCIDAD_PROMEDIO_MOTO) * 60;

				const tiempoTotalConRegreso = tiempoTotal + tiempoRegreso;
				const distanciaTotalConRegreso = distanciaTotal + distanciaRegreso;

				const tiempoEspera = calcularTiempoEspera(mejorPedido.hora);
				const tiempoPercibido = tiempoEspera + tiempoTotal;

				// Aplicar la lógica según el modo de agrupación
				let excedeTiempoMaximo = false;
				if (modoAgrupacion === "entrega") {
					excedeTiempoMaximo = tiempoPercibido > tiempoMaximo;
				} else {
					// modo 'recorrido'
					excedeTiempoMaximo = tiempoTotalConRegreso > tiempoMaximo;
				}

				if (excedeTiempoMaximo && grupoActual.length > 0) {
					break;
				}

				// Añadir el pedido al grupo
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
				pedidosRestantes.splice(mejorIndice, 1);
			}

			if (grupoActual.length > 0) {
				gruposOptimos.push({
					pedidos: grupoActual,
					tiempoTotal: Math.round(tiempoTotalGrupo),
					distanciaTotal: Number(distanciaTotalGrupo.toFixed(2)),
					peorTiempoPercibido: Math.round(peorTiempoPercibido),
					pedidoPeorTiempo,
				});
			}
		}

		return gruposOptimos;
	}

	const gruposOptimosMemo = useMemo(() => {
		const tiempoMaximoActual =
			modoAgrupacion === "entrega" ? tiempoMaximo : tiempoMaximoRecorrido;
		return armarGruposOptimos(
			pedidosConDistancias,
			tiempoMaximoActual,
			modoAgrupacion
		);
	}, [
		pedidosConDistancias,
		tiempoMaximo,
		tiempoMaximoRecorrido,
		modoAgrupacion,
		gruposListos,
	]);

	useEffect(() => {
		setGruposOptimos(gruposOptimosMemo);
	}, [gruposOptimosMemo]);

	const handleGrupoListo = (grupo) => {
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
		grupoIndex,
		cadeteId,
		esGrupoListo = false
	) => {
		let grupoActualizado;

		if (esGrupoListo) {
			const nuevosGruposListos = [...gruposListos];
			grupoActualizado = { ...nuevosGruposListos[grupoIndex] };
			grupoActualizado.pedidos = grupoActualizado.pedidos.map((pedido) => ({
				...pedido,
				cadete: cadeteId,
			}));
			nuevosGruposListos[grupoIndex] = grupoActualizado;
			setGruposListos(nuevosGruposListos);

			try {
				// Itera sobre los pedidos del grupo para actualizar cada uno en la base de datos
				for (const pedido of grupoActualizado.pedidos) {
					// Llama a la función para actualizar el cadete para cada pedido
					await updateCadeteForOrder(pedido.fecha, pedido.id, cadeteId);
				}

				// Si todo es exitoso, muestra un mensaje de éxito
				Swal.fire({
					icon: "success",
					title: "CADETE ASIGNADO",
					text: `El viaje lo lleva: ${cadeteId}`,
				});
			} catch (error) {
				// Muestra un mensaje de error en caso de fallo
				Swal.fire({
					icon: "error",
					title: "Error",
					text: "Hubo un problema al asignar el cadete.",
				});
				console.error("Error al actualizar el cadete del pedido:", error);
			}
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

		// Actualizar el estado global de las órdenes
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
	};

	useEffect(() => {
		const pedidosParaBarajar = [];
		const pedidosManuales = [];

		pedidosDisponibles.forEach((pedido) => {
			const pedidoInfo = {
				id: pedido.id,
				direccion: pedido.direccion,
				cadete: pedido.cadete,
				distancia: pedido.distancia,
				hora: pedido.hora,
				tiempoEspera: calcularTiempoEspera(pedido.hora),
				map: pedido.map,
			};

			if (pedido.map[0] === 0 && pedido.map[1] === 0) {
				pedidosManuales.push(pedidoInfo);
			} else {
				pedidosParaBarajar.push(pedidoInfo);
			}
		});
	}, [pedidosDisponibles]);

	const onDragEnd = (result) => {
		const { source, destination } = result;

		// Si no hay destino válido, no hacemos nada
		if (!destination) {
			return;
		}

		// Si el origen y el destino son el mismo, no hacemos nada
		if (
			source.droppableId === destination.droppableId &&
			source.index === destination.index
		) {
			return;
		}

		// Encontrar los grupos de origen y destino
		const sourceGroup = gruposListos[parseInt(source.droppableId)];
		const destGroup = gruposListos[parseInt(destination.droppableId)];

		// Crear nuevos arrays para los pedidos
		const newSourcePedidos = Array.from(sourceGroup.pedidos);
		const newDestPedidos =
			source.droppableId === destination.droppableId
				? newSourcePedidos
				: Array.from(destGroup.pedidos);

		// Remover el pedido del grupo de origen
		const [movedPedido] = newSourcePedidos.splice(source.index, 1);

		// Añadir el pedido al grupo de destino
		newDestPedidos.splice(destination.index, 0, movedPedido);

		// Crear nuevos grupos con los pedidos actualizados
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

		// Actualizar el estado
		setGruposListos(newGruposListos);
	};

	const [unlocking, setUnlocking] = useState({});
	const lockTimerRef = useRef(null);

	const handleLockMouseDown = (index) => {
		setUnlocking((prev) => ({ ...prev, [index]: true }));
		lockTimerRef.current = setTimeout(() => {
			// Aquí iría la lógica para desbloquear realmente el pedido
			setUnlocking((prev) => ({ ...prev, [index]: false }));
			setTooltipVisibility((prev) => ({ ...prev, [index]: false }));
		}, 2000);
	};

	const handleLockMouseUp = (index) => {
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

	function sumar30Minutos(hora) {
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
			<div className="p-4 flex flex-col font-coolvetica">
				<div>
					<div className="mb-8 mt-4 flex flex-row justify-center gap-2 ">
						<div>
							<div className="flex  gap-2">
								<div
									className={` py-2 px-4 rounded-lg font-medium cursor-pointer ${
										modoAgrupacion === "entrega"
											? "bg-black text-gray-100"
											: "text-black  border border-1 border-black"
									}`}
									onClick={() => setModoAgrupacion("entrega")}
								>
									Usar tiempo máximo de entrega
								</div>
								<div
									className={` py-2 px-4 rounded-lg font-medium cursor-pointer ${
										modoAgrupacion === "recorrido"
											? "bg-black text-gray-100"
											: "text-black  border border-1 border-black"
									}`}
									onClick={() => setModoAgrupacion("recorrido")}
								>
									Usar tiempo máximo de recorrido
								</div>
							</div>
						</div>
						<div className=" h-10.5 bg-black w-[1px]"></div>
						{modoAgrupacion === "entrega" ? (
							<div className="relative inline-block">
								<select
									id="tiempoMaximo"
									value={tiempoMaximo}
									onChange={(e) => setTiempoMaximo(parseInt(e.target.value))}
									className="bg-black appearance-none pt-2 pr-8  pb-3 px-3 text-gray-100 font-medium  rounded-full"
									style={{
										WebkitAppearance: "none",
										MozAppearance: "none",
									}}
								>
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
									className="absolute right-3 h-2 top-1/2  rotate-90 -translate-y-1/2"
									style={{
										filter: "invert(100%)",
									}}
								/>
							</div>
						) : (
							<div className="relative inline-block">
								<select
									id="tiempoMaximoRecorrido"
									value={tiempoMaximoRecorrido}
									onChange={(e) =>
										setTiempoMaximoRecorrido(parseInt(e.target.value))
									}
									className="bg-black appearance-none pt-2 pr-8  pb-3 px-3 text-gray-100 font-medium  rounded-full"
									style={{
										WebkitAppearance: "none",
										MozAppearance: "none",
									}}
								>
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
									className="absolute right-3 h-2 top-1/2  rotate-90 -translate-y-1/2"
									style={{
										filter: "invert(100%)",
									}}
								/>
							</div>
						)}
					</div>

					<div className="grid grid-cols-4 gap-4">
						<div className="flex flex-col">
							{grupoManual.length > 0 && (
								<div className="bg-black shadow-black h-min font-coolvetica w-full shadow-lg p-4 mb-4 rounded-lg">
									<h3 className="font-medium text-gray-100  mt-4 mb-8  text-center">
										Asignar manualmente
									</h3>
									<div className="flex flex-col gap-2">
										{grupoManual.map((pedido, index) => (
											<div
												key={pedido.id}
												className="bg-gray-100 rounded-lg flex  justify-between flex-row"
											>
												<div className="flex flex-row items-center">
													<div className="bg-black z-10 text-center ml-4 justify-center font-bold text-gray-100 h-6 w-6">
														{index + 1}
													</div>
													<div className="pl-4 pb-3.5 pt-2">
														<p className="font-bold text-lg">
															{pedido.direccion}
														</p>
														<p className="text-xs">Distancia: Desconocido</p>
														<p className="text-xs">
															Pidió hace: {calcularTiempoEspera(pedido.hora)}{" "}
															minutos
														</p>

														<p className="text-xs">
															Cliente percibe entrega de: Desconocido
														</p>
													</div>
												</div>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke-width="1.5"
													stroke="currentColor"
													className="w-6 mr-4 opacity-50"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														d="M3.75 9h16.5m-16.5 6.75h16.5"
													/>
												</svg>
											</div>
										))}
									</div>
								</div>
							)}
							<div className="flex flex-col gap-2">
								{pedidosReserva.length > 0 && (
									<div className="bg-black  shadow-black rounded-lg  p-4 mb-4   h-min font-coolvetica w-full shadow-lg  ">
										<h3 className="font-medium text-gray-100 mt-4 mb-8 text-center">
											Reservas
										</h3>
										<div className="flex flex-col gap-2">
											{pedidosReserva.map((pedido, index) => (
												<div
													key={pedido.id}
													className="bg-gray-100 h-[95px] rounded-lg flex items-center justify-between flex-row"
												>
													<div className="flex flex-row items-center">
														<div className="bg-black z-10 text-center ml-4 justify-center font-bold text-gray-100 h-6 w-6">
															{index + 1}
														</div>
														<div className="pl-4 pb-3.5 pt-2">
															<p className="font-bold text-lg">
																{pedido.direccion.split(",")[0]}
															</p>
															<p className="text-xs">
																Pidio para las: {sumar30Minutos(pedido.hora)}
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
															onTouchStart={() => handleLockMouseDown(index)}
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
																	Mantén presionado para distribuir en grupos
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

						<DragDropContext onDragEnd={onDragEnd}>
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
													<h3 className="font-medium text-3xl mb-2">
														Grupo {index + 1}
													</h3>
												</div>

												<p className="text-xs">
													Pedido con peor entrega: {grupo.peorTiempoPercibido}{" "}
													minutos (
													{grupo.pedidoPeorTiempo?.direccion.split(",")[0] ||
														"N/A"}
													)
												</p>
												<p className="text-xs">
													Duracion del recorrido: {grupo.tiempoTotal} minutos
												</p>
												<p className="text-xs">
													Distancia del recorrido: {grupo.distanciaTotal} km
												</p>
												<p className="text-xs">
													El cadete regresa a ANHELO a las {grupo.horaRegreso}{" "}
													hs
												</p>
											</div>
											<button
												className="bg-gray-400 bg-opacity-50 w-full h-[64px] mb-2 text-red-main rounded-lg flex justify-center items-center text-3xl font-coolvetica"
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
											<select
												className="bg-gray-100 appearance-none mb-8 w-full text-center py-2 rounded-full "
												style={{
													WebkitAppearance: "none",
													MozAppearance: "none",
												}}
												onChange={(e) =>
													handleAsignarCadete(index, e.target.value, true)
												}
												value={grupo.pedidos[0]?.cadete || ""}
											>
												{cadetesDisponibles.map((cadete) => (
													<option key={cadete.id} value={cadete.id}>
														{cadete.name}
													</option>
												))}
											</select>
											{grupo.pedidos.map((pedido, pedidoIndex) => (
												<Draggable
													key={pedido.id}
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
																className={`flex flex-row justify-between ${
																	pedidoIndex !== grupo.pedidos.length - 1
																		? "border-b border-black border-opacity-20"
																		: ""
																} w-full ml-4 pb-3.5 pt-2`}
															>
																<div>
																	<p className="font-bold text-lg">
																		{pedido.direccion.split(",")[0]}
																	</p>
																	<p className="text-xs">
																		Distancia: {pedido.distancia} km
																	</p>
																	<p className="text-xs">
																		Pidió hace:{" "}
																		{calcularTiempoEspera(pedido.hora)} minutos
																	</p>
																	<p className="text-xs">
																		Cliente percibe entrega de:{" "}
																		{pedido.tiempoPercibido} minutos
																	</p>
																</div>
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke-width="1.5"
																	stroke="currentColor"
																	className="w-6 mr-4 opacity-50"
																>
																	<path
																		stroke-linecap="round"
																		stroke-linejoin="round"
																		d="M3.75 9h16.5m-16.5 6.75h16.5"
																	/>
																</svg>
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

								return (
									<div
										key={index}
										className="bg-gray-300 shadow-black h-min font-coolvetica w-full shadow-lg p-4 mb-4 rounded-lg"
									>
										<div className="flex flex-col mt-4 mb-8 text-center justify-center">
											<div className="flex flex-row  items-center justify-center ">
												<svg
													className="w-4 h-4 mb-1 text-gray-100 animate-spin   dark:fill-black"
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
												<h3 className="font-medium w-9/12 text-3xl mb-2">
													Grupo {index + 1} en proceso...
												</h3>
											</div>
											<p className="text-xs">
												Pedido con peor entrega: {grupo.peorTiempoPercibido}{" "}
												minutos (
												{grupo.pedidoPeorTiempo?.direccion?.split(",")[0] ||
													"N/A"}
												)
											</p>
											<p className="text-xs">
												Duracion del recorrido: {grupo.tiempoTotal} minutos
											</p>
											<p className="text-xs">
												Distancia del recorrido: {grupo.distanciaTotal} km
											</p>
											<p className="text-xs">
												El cadete regresa a ANHELO a las {horaRegresoFormateada}{" "}
												hs
											</p>
										</div>
										<button
											className="bg-black w-full h-[64px] mb-8 text-gray-100 rounded-lg flex justify-center items-center text-3xl font-coolvetica"
											onClick={() => handleGrupoListo(grupo)}
										>
											Listo
										</button>

										{grupo.pedidos.map((pedido, pedidoIndex) => (
											<div
												key={pedido.id}
												className={`bg-gray-100 relative flex flex-row items-center ${
													pedidoIndex === 0
														? "rounded-t-lg "
														: pedidoIndex === grupo.pedidos.length - 1
														? "rounded-b-lg"
														: ""
												}`}
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
														<p className="font-bold text-lg">
															{pedido.direccion.split(",")[0]}
														</p>
														<p className="text-xs">
															Distancia: {pedido.distancia} km
														</p>
														<p className="text-xs">
															Pidió hace: {calcularTiempoEspera(pedido.hora)}{" "}
															minutos
														</p>
														<p className="text-xs">
															Cliente percibe entrega de:{" "}
															{pedido.tiempoPercibido} minutos
														</p>
													</div>
													<div className="relative">
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
																	stroke-width="1.5"
																	stroke="currentColor"
																	className="w-3 h-3"
																>
																	<path
																		stroke-linecap="round"
																		stroke-linejoin="round"
																		d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
																	/>
																</svg>
																<p className="mb-[1.5px] text-xs">
																	Solo puedes mover pedidos de grupos listos.
																</p>
															</div>
														)}
													</div>
												</div>
											</div>
										))}
									</div>
								);
							})
						) : (
							<p className="mt-[-8px] text-center w-full">
								No hay pedidos disponibles para agrupar.
							</p>
						)}
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
		</>
	);
};
