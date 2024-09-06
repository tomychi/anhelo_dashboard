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
	const ordersNotDelivered = orders.filter((order) => !order.entregado);
	console.log("Orders not delivered:", ordersNotDelivered);

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

		return distanciaEstimada.toFixed(2);
	}

	// Función modificada para encontrar órdenes no entregadas en rangos de distancia incrementales
	function obtenerOrdenesCercanas(orders) {
		const ordenesPorRango = {};
		const ordersNoAsignadas = orders.filter(
			(order) => order.cadete === "NO ASIGNADO"
		);

		for (let distanciaMaxima = 2; distanciaMaxima <= 20; distanciaMaxima++) {
			const ordenesCercanas = [];

			for (let i = 0; i < ordersNoAsignadas.length; i++) {
				for (let j = i + 1; j < ordersNoAsignadas.length; j++) {
					const distancia = parseFloat(
						calcularDistancia(
							ordersNoAsignadas[i].map[0],
							ordersNoAsignadas[i].map[1],
							ordersNoAsignadas[j].map[0],
							ordersNoAsignadas[j].map[1]
						)
					);

					if (distancia < distanciaMaxima && distancia >= distanciaMaxima - 1) {
						ordenesCercanas.push({
							orden1: {
								id: ordersNoAsignadas[i].id,
								direccion: ordersNoAsignadas[i].direccion,
								cadete: ordersNoAsignadas[i].cadete,
							},
							orden2: {
								id: ordersNoAsignadas[j].id,
								direccion: ordersNoAsignadas[j].direccion,
								cadete: ordersNoAsignadas[j].cadete,
							},
							distancia: distancia.toFixed(2),
						});
					}
				}
			}

			if (ordenesCercanas.length > 0) {
				ordenesPorRango[`${distanciaMaxima - 1}-${distanciaMaxima}km`] =
					ordenesCercanas;
			}
		}

		return ordenesPorRango;
	}

	// Usar ordersNotDelivered
	const ordenesCercanasNoEntregadas =
		obtenerOrdenesCercanas(ordersNotDelivered);
	console.log(
		"Órdenes no entregadas por rango de distancia (solo NO ASIGNADO):",
		ordenesCercanasNoEntregadas
	);

	// Imprimir resultados de manera más legible
	Object.entries(ordenesCercanasNoEntregadas).forEach(([rango, ordenes]) => {
		console.log(`\nÓrdenes en el rango ${rango}:`);
		ordenes.forEach(({ orden1, orden2, distancia }) => {
			console.log(`Distancia: ${distancia}km`);
			console.log(`Orden 1: ${orden1.direccion}`);
			console.log(`Orden 2: ${orden2.direccion}`);
			console.log("---");
		});
	});

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
