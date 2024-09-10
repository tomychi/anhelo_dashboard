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
		const grupos = esGrupoListo ? gruposListos : gruposOptimos;
		const grupoActualizado = { ...grupos[grupoIndex] };
		grupoActualizado.pedidos = grupoActualizado.pedidos.map((pedido) => ({
			...pedido,
			cadete: cadeteId,
		}));

		if (esGrupoListo) {
			const nuevosGruposListos = [...gruposListos];
			nuevosGruposListos[grupoIndex] = grupoActualizado;
			setGruposListos(nuevosGruposListos);
		} else {
			const nuevosGruposOptimos = [...gruposOptimos];
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
		<div className="p-4 flex flex-col">
			<div>
				<div className="mb-4 flex flex-col gap-2 items-center justify-center">
					<div>
						<label className="mr-2">
							<input
								type="radio"
								value="entrega"
								checked={modoAgrupacion === "entrega"}
								onChange={() => setModoAgrupacion("entrega")}
							/>
							Usar tiempo máximo de entrega
						</label>
						<label>
							<input
								type="radio"
								value="recorrido"
								checked={modoAgrupacion === "recorrido"}
								onChange={() => setModoAgrupacion("recorrido")}
							/>
							Usar tiempo máximo de recorrido
						</label>
					</div>
					{modoAgrupacion === "entrega" ? (
						<div>
							<label
								htmlFor="tiempoMaximo"
								className="font-medium text-gray-700 mr-2"
							>
								Tiempo máximo de entrega:
							</label>
							<select
								id="tiempoMaximo"
								value={tiempoMaximo}
								onChange={(e) => setTiempoMaximo(parseInt(e.target.value))}
								className="bg-gray-300 pt-2 pb-3 px-2.5 font-medium border-gray-300 rounded-full"
							>
								<option value={30}>30 minutos</option>
								<option value={40}>40 minutos</option>
								<option value={50}>50 minutos</option>
								<option value={60}>60 minutos</option>
							</select>
						</div>
					) : (
						<div>
							<label
								htmlFor="tiempoMaximoRecorrido"
								className="font-medium text-gray-700 mr-2"
							>
								Tiempo máximo de recorrido:
							</label>
							<select
								id="tiempoMaximoRecorrido"
								value={tiempoMaximoRecorrido}
								onChange={(e) =>
									setTiempoMaximoRecorrido(parseInt(e.target.value))
								}
								className="bg-gray-300 pt-2 pb-3 px-2.5 font-medium border-gray-300 rounded-full"
							>
								<option value={30}>30 minutos</option>
								<option value={40}>40 minutos</option>
								<option value={50}>50 minutos</option>
								<option value={60}>60 minutos</option>
							</select>
						</div>
					)}
				</div>
				<div className="flex flex-wrap gap-4">
					{gruposListos.map((grupo, index) => (
						<div
							key={`listo-${index}`}
							className="bg-green-200 shadow-black h-min font-coolvetica w-1/4 shadow-lg p-4 mb-4 rounded-lg"
						>
							<div className="flex flex-col mt-4 mb-6 justify-center">
								<h3 className="font-bold text-xl">Grupo Listo {index + 1}</h3>
								<p>Cantidad de pedidos: {grupo.pedidos.length}</p>
								<p>Tiempo total de recorrido: {grupo.tiempoTotal} minutos</p>
								<p>Distancia total del recorrido: {grupo.distanciaTotal} km</p>
								<p>
									Pedido con peor tiempo de entrega percibido:{" "}
									{grupo.peorTiempoPercibido} minutos
								</p>
								<p>Dirección: {grupo.pedidoPeorTiempo?.direccion || "N/A"}</p>
							</div>
							<select
								className="bg-gray-100 w-full py-2 rounded-full mb-2"
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
							{grupo.pedidos.map((pedido, pedidoIndex) => (
								<div key={pedido.id} className="bg-white p-2 mb-2 rounded">
									<p>
										Entrega {pedidoIndex + 1}: {pedido.direccion}
									</p>
									<p>Distancia: {pedido.distancia} km</p>
									<p>Pidió hace: {calcularTiempoEspera(pedido.hora)} minutos</p>
									<p>
										El cliente percibe entrega de: {pedido.tiempoPercibido}{" "}
										minutos
									</p>
								</div>
							))}
							<button
								className="bg-red-500 w-full py-4 text-white rounded-lg flex justify-center items-center text-2xl font-coolvetica mt-4"
								onClick={() => handleDeshacerGrupo(index)}
							>
								Deshacer
							</button>
						</div>
					))}

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
									<div className="flex flex-col mt-4 mb-6 justify-center">
										<h3 className="font-bold text-xl">
											Grupo óptimo {index + 1}
										</h3>
										<p>Cantidad de pedidos: {grupo.pedidos.length}</p>
										<p>
											Tiempo total de recorrido: {grupo.tiempoTotal} minutos
										</p>
										<p>
											Distancia total del recorrido: {grupo.distanciaTotal} km
										</p>
										<p>
											Pedido con peor tiempo de entrega percibido:{" "}
											{grupo.peorTiempoPercibido} minutos
										</p>
										<p>
											Dirección: {grupo.pedidoPeorTiempo?.direccion || "N/A"}
										</p>
										<p>
											El cadete regresa a ANHELO a las {horaRegresoFormateada}{" "}
											hs
										</p>
									</div>
									<select
										className="bg-gray-100 w-full py-2 rounded-full mb-2"
										onChange={(e) => handleAsignarCadete(index, e.target.value)}
										value={grupo.pedidos[0]?.cadete || ""}
									>
										<option value="">¿Para quién?</option>
										{cadetesDisponibles.map((cadete) => (
											<option key={cadete.id} value={cadete.id}>
												{cadete.name}
											</option>
										))}
									</select>
									{grupo.pedidos.map((pedido, pedidoIndex) => (
										<div key={pedido.id} className="bg-white p-2 mb-2 rounded">
											<p>
												Entrega {pedidoIndex + 1}: {pedido.direccion}
											</p>
											<p>Distancia: {pedido.distancia} km</p>
											<p>
												Pidió hace: {calcularTiempoEspera(pedido.hora)} minutos
											</p>
											<p>
												El cliente percibe entrega de: {pedido.tiempoPercibido}{" "}
												minutos
											</p>
										</div>
									))}
									<button
										className="bg-black w-full py-4 text-gray-100 rounded-lg flex justify-center items-center text-2xl font-coolvetica"
										onClick={() => handleGrupoListo(grupo)}
									>
										Listo
									</button>
								</div>
							);
						})
					) : (
						<p>No hay pedidos disponibles para agrupar.</p>
					)}

					{grupoManual.length > 0 && (
						<div className="mt-4">
							<h3 className="font-bold text-xl mb-2">Grupo Manual</h3>
							<div className="bg-yellow-200 shadow-black h-min font-coolvetica w-1/4 shadow-lg p-4 mb-4 rounded-lg">
								{grupoManual.map((pedido, index) => (
									<div key={pedido.id} className="bg-white p-2 mb-2 rounded">
										<p>
											Entrega {index + 1}: {pedido.direccion}
										</p>
										<p>Teléfono: {pedido.telefono}</p>
										<p>
											Pidió hace: {calcularTiempoEspera(pedido.hora)} minutos
										</p>
									</div>
								))}
							</div>
						</div>
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
