import { useEffect, useState } from "react";
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
	// const [registro, setRegistro] = useState<RegistroProps[]>([]);

	const { orders } = useSelector((state: RootState) => state.data);

	const location = useLocation();

	const filteredOrders = orders
		.filter((o) => !selectedCadete || o.cadete === selectedCadete)
		.sort((a, b) => {
			const [horaA, minutosA] = a.hora.split(":").map(Number);
			const [horaB, minutosB] = b.hora.split(":").map(Number);
			return horaA * 60 + minutosA - (horaB * 60 + minutosB);
		});

	const pedidosPorHacer = filteredOrders.filter(
		(o) => !o.elaborado && !o.entregado
	);
	const pedidosHechos = filteredOrders.filter(
		(o) => o.elaborado && !o.entregado
	);
	const pedidosEntregados = filteredOrders.filter((o) => o.entregado);

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

	// useEffect(() => {
	//   const cargarRegistro = async () => {
	//     try {
	//       const datosRegistro = await obtenerRegistroActual();
	//       setRegistro(datosRegistro);
	//     } catch (error) {
	//       console.error('Error al cargar el registro:', error);
	//     }
	//   };

	//   cargarRegistro();
	// }, []);

	// const empleadoActivo = (empleadoNombre: string) => {
	//   const empleado = registro.find(
	//     (registroEmpleado) => registroEmpleado.nombreEmpleado === empleadoNombre
	//   );
	//   if (empleado) {
	//     if (empleado.marcado) {
	//       return { activo: true, horaSalida: null };
	//     } else {
	//       return { activo: false, horaSalida: empleado.horaSalida };
	//     }
	//   }
	//   return { activo: false, horaSalida: null };
	// };

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

	// Desde aca el codigo que arma vueltas
	const cadetesDisponibles = empleados.filter(
		(empleado) => empleado.category === "cadete" && empleado.available === true
	);
	console.log("Cadetes disponibles:", cadetesDisponibles);

	console.log("All orders:", orders);
	const ordersNotDelivered = orders.filter(
		(order) => !order.entregado && order.cadete === "NO ASIGNADO"
	);
	console.log("Orders not delivered and not assigned:", ordersNotDelivered);

	// Coordenadas del punto de partida (Neri Guerra 352, Río Cuarto)
	const puntoPartida = { lat: -33.0957994, lon: -64.3337817 };

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

	function armarGrupoOrdenes(ordersNotDelivered, puntoPartida) {
		let grupoOrdenes = [];
		let tiempoTotalRecorrido = 0;
		let ordenesRestantes = [...ordersNotDelivered];

		// Agregar la primera orden (la más cercana al punto de partida)
		const primeraOrden = obtenerOrdenMasCercana(
			[{ map: [puntoPartida.lat, puntoPartida.lon] }],
			ordenesRestantes
		);
		grupoOrdenes.push(primeraOrden.orden);
		tiempoTotalRecorrido += primeraOrden.tiempoEstimado;
		ordenesRestantes = ordenesRestantes.filter(
			(orden) => orden.id !== primeraOrden.orden.id
		);

		while (ordenesRestantes.length > 0 && tiempoTotalRecorrido <= 30) {
			const ordenMasCercana = obtenerOrdenMasCercana(
				grupoOrdenes,
				ordenesRestantes
			);

			if (tiempoTotalRecorrido + ordenMasCercana.tiempoEstimado > 30) {
				break; // Si agregar esta orden supera los 30 minutos, paramos
			}

			grupoOrdenes.push(ordenMasCercana.orden);
			tiempoTotalRecorrido += ordenMasCercana.tiempoEstimado;
			ordenesRestantes = ordenesRestantes.filter(
				(orden) => orden.id !== ordenMasCercana.orden.id
			);
		}

		return {
			grupo: grupoOrdenes,
			tiempoTotal: tiempoTotalRecorrido,
		};
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

	// Armar el grupo de órdenes
	const grupoOptimo = armarGrupoOrdenes(ordersNotDelivered, puntoPartida);

	// Calcular la distancia total del recorrido
	const distanciaTotal = calcularDistanciaTotal(
		grupoOptimo.grupo,
		puntoPartida
	);

	console.log("Grupo óptimo de órdenes:");
	grupoOptimo.grupo.forEach((orden, index) => {
		console.log(`Orden ${index + 1}:`);
		console.log(`  ID: ${orden.id}`);
		console.log(`  Dirección: ${orden.direccion}`);
		if (index === 0) {
			const distanciaInicio = calcularDistancia(
				puntoPartida.lat,
				puntoPartida.lon,
				orden.map[0],
				orden.map[1]
			);
			console.log(
				`  Distancia desde punto de partida: ${distanciaInicio.toFixed(2)} km`
			);
		}
		console.log("---");
	});

	console.log(
		`Tiempo total estimado del recorrido: ${grupoOptimo.tiempoTotal} minutos`
	);
	console.log(`Distancia total del recorrido: ${distanciaTotal} km`);

	// Órdenes que quedaron fuera del grupo
	const ordenesFuera = ordersNotDelivered.filter(
		(orden) =>
			!grupoOptimo.grupo.some((ordenGrupo) => ordenGrupo.id === orden.id)
	);

	console.log("Órdenes que quedaron fuera del grupo:");
	ordenesFuera.forEach((orden) => {
		console.log(`  ID: ${orden.id}`);
		console.log(`  Dirección: ${orden.direccion}`);
		console.log("---");
	});

	const [, setTick] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setTick((prev) => prev + 1);
		}, 60000); // Actualizar cada minuto

		return () => clearInterval(timer);
	}, []);

	// Función para calcular los minutos transcurridos
	const calcularMinutosTranscurridos = (horaString) => {
		const [horas, minutos] = horaString.split(":").map(Number);
		const fechaPedido = new Date();
		fechaPedido.setHours(horas, minutos, 0, 0);
		const ahora = new Date();
		const diferencia = ahora - fechaPedido;
		return Math.floor(diferencia / 60000); // Convertir milisegundos a minutos
	};
	// Función para calcular la demora total de un pedido
	const calcularDemoraTotalPedido = (orden, tiempoEntrega) => {
		const tiempoEspera = calcularMinutosTranscurridos(orden.hora);
		return tiempoEspera + tiempoEntrega;
	};

	// Calcular pedido con mayor demora total
	const pedidoMayorDemora = grupoOptimo.grupo.reduce(
		(mayorDemora, orden, index) => {
			const tiempoEntrega = grupoOptimo.tiempoTotal - index * 5; // Estimación simple: cada entrega toma 5 minutos menos que la anterior
			const demoraTotalPedido = calcularDemoraTotalPedido(orden, tiempoEntrega);

			if (demoraTotalPedido > mayorDemora.demoraTotalPedido) {
				return { orden, demoraTotalPedido };
			}
			return mayorDemora;
		},
		{ orden: null, demoraTotalPedido: 0 }
	);

	return (
		<div className="p-4 flex flex-col">
			<div className="flex flex-col gap-2">
				<div className="flex items-center flex-row overflow-hidden">
					{/* <ScrollContainer>
            <div className="flex flex-row gap-4 text-xs">
              {empleados.map((empleado, index) => {
                if (empleado.name === undefined) return;
                if (empleado.name === 'NO ASIGNADO') return;
                const { activo, horaSalida } = empleadoActivo(empleado.name);
                const horaEntrada = activo
                  ? (
                      registro.find(
                        (registroEmpleado) =>
                          registroEmpleado.nombreEmpleado === empleado.name
                      )?.horaEntrada || 'Hora de entrada no disponible'
                    ).substring(0, 5)
                  : 'Ausente';
                const horaSalidaFormateada = horaSalida
                  ? horaSalida.substring(0, 5)
                  : 'Hora de salida no disponible';

                return (
                  <div key={index} className="flex items-center flex-row ">
                    <div className="w-12 h-12 flex items-center justify-center rounded-full mr-2 relative">
                      <div
                        className={`w-8 h-8 rounded-none ${
                          activo ? 'bg-green-500' : 'bg-red-main'
                        }`}
                      ></div>
                    </div>
                    <div className="flex flex-col w-full text-red-main font-coolvetica font-black uppercase">
                      <p>{empleado.name}</p>
                      {activo ? (
                        <p className="flex items-center">
                          <span className="mr-2">
                            Ingreso {' ' + horaEntrada} hs
                          </span>
                        </p>
                      ) : (
                        <p className="flex items-center">
                          {horaSalidaFormateada ===
                          'Hora de salida no disponible' ? (
                            <span>Ausente</span>
                          ) : (
                            <span className="mr-2">
                              Salida {horaSalidaFormateada} hs
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollContainer> */}
				</div>
			</div>
			{/* Cuadro actualizado para mostrar el grupo óptimo de órdenes */}
			<div className="mt-4 bg-gray-300 p-4 rounded-lg">
				<h3 className="font-bold text-lg mb-2">Grupo óptimo de órdenes:</h3>
				{grupoOptimo.grupo.map((orden, index) => (
					<div key={orden.id} className="mb-2">
						<p className="font-semibold">Entrega {index + 1}:</p>
						<p>Dirección: {orden.direccion}</p>
						<p>
							Pidió hace: {calcularMinutosTranscurridos(orden.hora)} minutos
						</p>
					</div>
				))}
				<p className="mt-2">
					<strong>Tiempo total estimado del recorrido:</strong>{" "}
					{grupoOptimo.tiempoTotal} minutos
				</p>
				<p>
					<strong>Distancia total del recorrido:</strong> {distanciaTotal} km
				</p>
				{pedidoMayorDemora.orden && (
					<div className="mt-4 border-t pt-2">
						<p className="font-semibold">Pedido con mayor demora total:</p>
						<p>Dirección: {pedidoMayorDemora.orden.direccion}</p>
						<p>
							Demora total estimada: {pedidoMayorDemora.demoraTotalPedido}{" "}
							minutos
						</p>
					</div>
				)}
			</div>
			<CadeteSelect
				cadetes={cadetes}
				handleCadeteChange={handleCadeteChange}
				selectedCadete={selectedCadete}
				orders={pedidosHechos}
			/>
			{/* un boton para copiar todas las direcciones de orders y agruparlas por la fecha */}

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
