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
import listoIcon from "../assets/listoIcon.png";

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

	const handleDeshacerGrupo = (index) => {
		setGruposListos((prevGrupos) => prevGrupos.filter((_, i) => i !== index));
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

	useEffect(() => {
		console.log("Pedidos disponibles con distancias:", pedidosConDistancias);
	}, [pedidosConDistancias]);

	function encontrarPedidoMasCercano(pedidos) {
		if (pedidos.length === 0) return null;
		return pedidos.reduce((pedidoMasCercano, pedidoActual) => {
			return parseFloat(pedidoActual.distancia) <
				parseFloat(pedidoMasCercano.distancia)
				? pedidoActual
				: pedidoMasCercano;
		});
	}

	// Modificar el useMemo para manejar el caso de pedidosConDistancias vacío
	const pedidoMasCercano = useMemo(() => {
		return pedidosConDistancias.length > 0
			? encontrarPedidoMasCercano(pedidosConDistancias)
			: null;
	}, [pedidosConDistancias]);

	useEffect(() => {
		console.log("Pedido más cercano:", pedidoMasCercano);
	}, [pedidoMasCercano]);

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
		setGruposListos([...gruposListos, grupo]);
	};

	useEffect(() => {
		console.log("Grupos óptimos de pedidos:", gruposOptimos);
	}, [gruposOptimos]);

	const cadetesDisponibles = useMemo(() => {
		return empleados.filter(
			(empleado) => empleado.category === "cadete" && empleado.available
		);
	}, [empleados]);

	const handleAsignarCadete = (grupoIndex, cadeteId, esGrupoListo = false) => {
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

		console.log("Grupo a colocar manualmente:", pedidosManuales);
	}, [pedidosDisponibles]);

	return (
		<div className="p-4 flex flex-col font-coolvetica">
			<div>
				<div className="mb-4 flex flex-row gap-2 ">
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
							</select>
							<img
								src={arrowIcon}
								alt="Arrow Icon"
								className="absolute right-3 h-2 top-1/2  rotate-90 -translate-y-1/2" // Posiciona la imagen a la derecha y centrada verticalmente
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
							</select>
							<img
								src={arrowIcon}
								alt="Arrow Icon"
								className="absolute right-3 h-2 top-1/2  rotate-90 -translate-y-1/2" // Posiciona la imagen a la derecha y centrada verticalmente
								style={{
									filter: "invert(100%)",
								}}
							/>
						</div>
					)}
				</div>
				<div className="flex flex-wrap gap-4">
					{gruposListos.map((grupo, index) => (
						<div
							key={`listo-${index}`}
							className="bg-gray-300 shadow-black h-min font-coolvetica w-1/4 shadow-lg p-4 mb-4 rounded-lg"
						>
							<div className="flex flex-col mt-4 mb-8 text-center justify-center">
								<div className="flex flex-row items-center justify-center gap-2">
									<img src={listoIcon} className="h-3 mb-1" alt="" />
									<h3 className="font-bold text-2xl mb-2">
										Grupo listo {index + 1}
									</h3>
								</div>

								<p className="text-xs">
									Pedido con peor entrega: {grupo.peorTiempoPercibido} minutos (
									{grupo.pedidoPeorTiempo?.direccion.split(",")[0] || "N/A"})
								</p>
								<p className="text-xs">
									Duracion del recorrido: {grupo.tiempoTotal} minutos
								</p>
								<p className="text-xs">
									Distancia del recorrido: {grupo.distanciaTotal} km
								</p>
								<p className="text-xs">El cadete regresa a ANHELO a las hs</p>
							</div>
							<select
								className="bg-gray-100 appearance-none w-full text-center py-2 rounded-full mb-2"
								style={{
									WebkitAppearance: "none",
									MozAppearance: "none",
								}}
								onChange={(e) =>
									handleAsignarCadete(index, e.target.value, true)
								}
								value={grupo.pedidos[0]?.cadete || ""}
							>
								<option value="">¿Para quién?</option>
								{cadetesDisponibles.map((cadete) => (
									<option key={cadete.id} value={cadete.id}>
										{cadete.name}
									</option>
								))}
							</select>
							<button
								className="bg-gray-400 bg-opacity-50 w-full py-4 mb-8 text-red-main rounded-lg flex justify-center items-center text-2xl font-coolvetica"
								onClick={() => handleDeshacerGrupo(index)}
							>
								Deshacer
							</button>
							{grupo.pedidos.map((pedido, pedidoIndex) => (
								<div
									key={pedido.id}
									className={`bg-gray-100 relative flex flex-row items-center ${
										pedidoIndex === 0
											? "rounded-t-lg"
											: pedidoIndex === grupo.pedidos.length - 1
											? "rounded-b-lg"
											: ""
									}`}
								>
									<div className="bg-black z-50 text-center ml-4 justify-center font-bold text-gray-100 h-6 w-6">
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
										className={`flex flex-col ${
											pedidoIndex !== grupo.pedidos.length - 1
												? "border-b border-black border-opacity-20"
												: ""
										} w-full ml-4 pb-3.5 pt-2`}
									>
										<p className="font-bold text-lg">
											{pedido.direccion.split(",")[0]}
										</p>
										<p className="text-xs">Distancia: {pedido.distancia} km</p>
										<p className="text-xs">
											Pidió hace: {calcularTiempoEspera(pedido.hora)} minutos
										</p>
										<p className="text-xs">
											Cliente percibe entrega de: {pedido.tiempoPercibido}{" "}
											minutos
										</p>
									</div>
								</div>
							))}
						</div>
					))}
					{grupoManual.length > 0 && (
						<div className="bg-gray-300 shadow-black h-min font-coolvetica w-1/4 shadow-lg p-4 mb-4 rounded-lg">
							<h3 className="font-bold text-2xl mt-4 mb-8  text-center">
								Asignar manualmente
							</h3>
							<div className="flex flex-col gap-2">
								{grupoManual.map((pedido, index) => (
									<div
										key={pedido.id}
										className="bg-gray-100 rounded-lg flex items-center flex-row"
									>
										<div className="bg-black z-50 text-center ml-4 justify-center font-bold text-gray-100 h-6 w-6">
											{index + 1}
										</div>
										<div className="pl-4 pb-3.5 pt-2">
											<p className="font-bold text-lg">{pedido.direccion}</p>
											<p className="text-xs">
												Pidió hace: {calcularTiempoEspera(pedido.hora)} minutos
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
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
									className="bg-gray-300 shadow-black h-min font-coolvetica w-1/4 shadow-lg p-4 mb-4 rounded-lg"
								>
									<div className="flex flex-col mt-4 mb-8 text-center justify-center">
										<div className="flex flex-row items-center justify-center gap-2">
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
											<h3 className="font-bold text-2xl mb-2">
												Grupo óptimo {index + 1} en proceso...
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
									<select
										className="bg-gray-100 appearance-none w-full text-center py-2 rounded-full mb-2"
										style={{
											WebkitAppearance: "none",
											MozAppearance: "none",
										}}
										onChange={(e) =>
											handleAsignarCadete(index, e.target.value, false)
										}
										value={grupo.pedidos[0]?.cadete || ""}
									>
										<option value="">¿Para quién?</option>
										{cadetesDisponibles.map((cadete) => (
											<option key={cadete.id} value={cadete.id}>
												{cadete.name}
											</option>
										))}
									</select>
									<button
										className="bg-black w-full py-4 mb-8 text-gray-100 rounded-lg flex justify-center items-center text-2xl font-coolvetica"
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
											<div className="bg-black z-50 text-center ml-4 justify-center font-bold text-gray-100 h-6 w-6">
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
												className={`flex flex-col ${
													pedidoIndex !== grupo.pedidos.length - 1
														? "border-b border-black border-opacity-20"
														: ""
												} w-full ml-4 pb-3.5 pt-2`}
											>
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
													Cliente percibe entrega de: {pedido.tiempoPercibido}{" "}
													minutos
												</p>
											</div>
										</div>
									))}
								</div>
							);
						})
					) : (
						<p>No hay pedidos disponibles para agrupar.</p>
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
	);
};
