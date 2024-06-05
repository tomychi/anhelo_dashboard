import { useEffect, useState } from "react";
import { ReadOrdersForToday } from "../firebase/ReadData";
import { PedidoProps } from "../types/types";
import { RootState } from "../redux/configureStore";
import { useSelector, useDispatch } from "react-redux";
import { readOrdersData } from "../redux/data/dataAction";
import { useLocation } from "react-router-dom";
import { GeneralStats, OrderList, Vueltas } from "../components/comandera";
import { NavButtons } from "../components/comandera/NavButtons";
import DeliveryMap from "./DeliveryMap";
import { buscarCoordenadas } from "../apis/getCoords";
import { handleAddressSave } from "../firebase/UploadOrder";
import CadeteSelect from "../components/Cadet/CadeteSelect";
import {
	EmpleadosProps,
	readEmpleados,
	RegistroProps,
	obtenerRegistroActual,
} from "../firebase/registroEmpleados";
import {
	obtenerFechaActual,
	calcularDiferenciaHoraria,
} from "../helpers/dateToday";
import { VueltaInfo, obtenerVueltasCadete } from "../firebase/Cadetes";
import ScrollContainer from "../components/comandera/ScrollContainer";

function formatearFecha(fechaStr: string | Date) {
	const fecha = new Date(fechaStr);
	const dia = String(fecha.getDate()).padStart(2, "0");
	const mes = String(fecha.getMonth() + 1).padStart(2, "0");
	const anio = fecha.getFullYear();
	return `${dia}/${mes}/${anio}`;
}

export const Comandera = () => {
	const [seccionActiva, setSeccionActiva] = useState("porHacer");
	const dispatch = useDispatch();
	const [sumaTotalPedidos, setSumaTotalPedidos] = useState(0);
	const [sumaTotalEfectivo, setSumaTotalEfectivo] = useState(0);
	const [selectedCadete, setSelectedCadete] = useState<string | null>(null);

	const [cadetes, setCadetes] = useState<string[]>([]);
	const [empleados, setEmpleados] = useState<EmpleadosProps[]>([]);
	const [vueltas, setVueltas] = useState<VueltaInfo[]>([]);
	const [promediosPorViaje, setPromediosPorViaje] = useState<number[]>([]);
	const [registro, setRegistro] = useState<RegistroProps[]>([]);

	const { orders } = useSelector((state: RootState) => state.data);
	const { valueDate } = useSelector((state: RootState) => state.data);

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
				const pedidosSinMap = pedidos.filter(
					(pedido) => !pedido.map || pedido.map[0] === 0 || pedido.map[1] === 0
				);

				for (const pedido of pedidosSinMap) {
					const coordenadas = await buscarCoordenadas(pedido.direccion);
					if (coordenadas) {
						await handleAddressSave(pedido.fecha, pedido.id, coordenadas);
					}
				}
				dispatch(readOrdersData(pedidos));
			});

			return () => {
				unsubscribe();
			};
		}
	}, [dispatch, location]);

	useEffect(() => {
		const cargarRegistro = async () => {
			try {
				const datosRegistro = await obtenerRegistroActual();
				setRegistro(datosRegistro);
			} catch (error) {
				console.error("Error al cargar el registro:", error);
			}
		};

		cargarRegistro();
	}, []);

	const empleadoActivo = (empleadoNombre: string) => {
		const empleado = registro.find(
			(registroEmpleado) => registroEmpleado.nombreEmpleado === empleadoNombre
		);
		if (empleado) {
			if (empleado.marcado) {
				return { activo: true, horaSalida: null };
			} else {
				return { activo: false, horaSalida: empleado.horaSalida };
			}
		}
		return { activo: false, horaSalida: null };
	};

	useEffect(() => {
		const nuevosPromedios = vueltas
			.map(({ horaSalida, horaLlegada, ordersId }) => {
				if (horaSalida && horaLlegada && ordersId.length > 0) {
					const diferenciaMinutos = calcularDiferenciaHoraria(
						horaSalida,
						horaLlegada
					);
					return diferenciaMinutos / ordersId.length;
				}
				return 0;
			})
			.filter((promedio) => promedio > 0);

		setPromediosPorViaje(nuevosPromedios);
	}, [vueltas]);

	const calcularPromedioGeneral = () => {
		if (promediosPorViaje.length === 0) return "N/A";

		const totalMinutos = promediosPorViaje.reduce(
			(total, tiempo) => total + tiempo,
			0
		);
		const promedioMinutos = totalMinutos / promediosPorViaje.length;
		const horas = Math.floor(promedioMinutos / 60);
		const minutos = Math.round(promedioMinutos % 60);

		return `${horas} horas y ${minutos} minutos`;
	};

	const handleCadeteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const nuevoCadeteSeleccionado = event.target.value;

		if (nuevoCadeteSeleccionado === "") {
			setSelectedCadete(null);
			setVueltas([]);
			return;
		}

		if (location.pathname === "/comandas") {
			obtenerVueltasCadete(nuevoCadeteSeleccionado, obtenerFechaActual())
				.then((vueltas) => {
					setVueltas(vueltas);
				})
				.catch((error) => {
					console.error("Error al obtener las vueltas del cadete:", error);
				});
		} else {
			const fecha = valueDate?.startDate
				? formatearFecha(valueDate.startDate)
				: obtenerFechaActual();

			obtenerVueltasCadete(nuevoCadeteSeleccionado, fecha)
				.then((vueltas) => {
					setVueltas(vueltas);
				})
				.catch((error) => {
					console.error("Error al obtener las vueltas del cadete:", error);
				});
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

	return (
		<div className="p-4 flex flex-col">
			<div className="flex flex-col gap-2">
				<div className="flex items-center flex-row overflow-hidden">
					<ScrollContainer>
						<div className="flex flex-row gap-4 text-xs">
							{empleados.map((empleado, index) => {
								if (empleado.name === undefined) return;
								if (empleado.name === "NO ASIGNADO") return;
								const { activo, horaSalida } = empleadoActivo(empleado.name);
								const horaEntrada = activo
									? (
											registro.find(
												(registroEmpleado) =>
													registroEmpleado.nombreEmpleado === empleado.name
											)?.horaEntrada || "Hora de entrada no disponible"
									  ).substring(0, 5)
									: "Ausente";
								const horaSalidaFormateada = horaSalida
									? horaSalida.substring(0, 5)
									: "Hora de salida no disponible";

								return (
									<div key={index} className="flex items-center flex-row">
										<div className="w-12 h-12 flex items-center justify-center rounded-full mr-2 relative">
											<div
												className={`w-8 h-8 rounded-none ${
													activo ? "bg-green-500" : "bg-red-main"
												}`}
											></div>
										</div>
										<div className="flex flex-col w-full text-white">
											<p>{empleado.name}</p>
											{activo ? (
												<p className="flex items-center">
													<span className="mr-2">
														Ingreso {" " + horaEntrada} hs
													</span>
												</p>
											) : (
												<p className="flex items-center">
													{horaSalidaFormateada ===
													"Hora de salida no disponible" ? (
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
					</ScrollContainer>
				</div>
			</div>
			<CadeteSelect
				vueltas={vueltas}
				cadetes={cadetes}
				handleCadeteChange={handleCadeteChange}
				selectedCadete={selectedCadete}
				orders={pedidosHechos}
				setVueltas={setVueltas}
			/>
			<GeneralStats
				customerSuccess={customerSuccess}
				orders={orders}
				cadeteSeleccionado={selectedCadete}
				sumaTotalPedidos={sumaTotalPedidos}
				sumaTotalEfectivo={sumaTotalEfectivo}
				empleados={empleados}
				promedioTiempoEntrega={calcularPromedioGeneral()}
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
						<DeliveryMap
							orders={[...pedidosHechos, ...pedidosPorHacer]}
							selectedCadete={selectedCadete}
							cadetes={cadetes}
						/>
					) : (
						<DeliveryMap
							orders={orders}
							selectedCadete={selectedCadete}
							cadetes={cadetes}
						/>
					))}
			</div>
			<div className="flex flex-col">
				{seccionActiva === "vueltas" && (
					<Vueltas cadete={selectedCadete} vueltas={vueltas} />
				)}
			</div>
		</div>
	);
};
