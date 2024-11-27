import { sendTemplateMessage } from "../utils/whatsapp";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import { ReadLastThreeMonthsOrders } from "../firebase/ReadData";
import wsp from "../assets/wsp.png";
import arrow from "../assets/arrowIcon.png";
import TableLoadingRow from "../components/TableLoadingRow";

interface ClientData {
	telefono: string;
	ultimoPedido: Date;
	semanasSinPedir: number;
}

export const WhatsappFeatures = () => {
	const [clients, setClients] = useState<ClientData[]>([]);
	const [selectedWeeks, setSelectedWeeks] = useState<number>(2);
	const [filteredClients, setFilteredClients] = useState<ClientData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [stats, setStats] = useState({
		totalOrders: 0,
		totalRevenue: 0,
		averageOrderValue: 0,
		ordersByMonth: {} as Record<string, number>,
	});

	const calcularSemanasDesdeUltimoPedido = (fecha: Date): number => {
		const hoy = new Date();
		const ultimoPedido = new Date(fecha);

		// Establecer ambas fechas al inicio del día
		hoy.setHours(0, 0, 0, 0);
		ultimoPedido.setHours(0, 0, 0, 0);

		const diffTime = Math.abs(hoy.getTime() - ultimoPedido.getTime());
		const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));

		// Si la fecha es del futuro, considerarla como semana 0
		if (ultimoPedido > hoy) {
			return 0;
		}

		console.log("Cálculo de semanas:", {
			fechaPedido: ultimoPedido.toISOString(),
			fechaHoy: hoy.toISOString(),
			semanasTranscurridas: diffWeeks,
		});

		return diffWeeks;
	};

	const convertToValidDate = (dateStr: string): Date => {
		const [day, month, year] = dateStr
			.split("/")
			.map((num) => parseInt(num, 10));
		const fullYear = year < 100 ? 2000 + year : year;

		const fecha = new Date(fullYear, month - 1, day);
		fecha.setHours(0, 0, 0, 0);

		const semanas = calcularSemanasDesdeUltimoPedido(fecha);
		console.log("Fecha procesada:", {
			original: dateStr,
			fecha: fecha.toISOString(),
			semanasSinPedir: semanas,
		});

		return fecha;
	};

	useEffect(() => {
		const fetchOrders = async () => {
			try {
				setIsLoading(true);
				console.log("Iniciando fetchOrders...");
				const orders = await ReadLastThreeMonthsOrders();

				const totalOrders = orders.length;
				const totalRevenue = orders.reduce(
					(sum, order) => sum + order.total,
					0
				);
				const averageOrderValue = totalRevenue / totalOrders;

				setStats({
					totalOrders,
					totalRevenue,
					averageOrderValue,
					ordersByMonth: {},
				});

				// Procesamos los datos del cliente guardando el pedido más antiguo
				const clientMap = new Map<string, Date>();

				orders.forEach((order) => {
					try {
						const orderDate = convertToValidDate(order.fecha);
						const currentDate = clientMap.get(order.telefono);

						if (!currentDate || orderDate < currentDate) {
							clientMap.set(order.telefono, orderDate);
						}
					} catch (error) {
						console.error("Error procesando pedido:", { order, error });
					}
				});

				const clientData: ClientData[] = Array.from(clientMap).map(
					([telefono, fecha]) => ({
						telefono,
						ultimoPedido: fecha,
						semanasSinPedir: calcularSemanasDesdeUltimoPedido(fecha),
					})
				);

				const distribucion = clientData.reduce((acc, client) => {
					acc[client.semanasSinPedir] = (acc[client.semanasSinPedir] || 0) + 1;
					return acc;
				}, {} as Record<number, number>);

				console.log(
					"Distribución de clientes por semanas:",
					Object.entries(distribucion)
						.sort(([a], [b]) => Number(a) - Number(b))
						.reduce((acc, [semanas, cantidad]) => {
							acc[`${semanas} semanas`] = cantidad;
							return acc;
						}, {} as Record<string, number>)
				);

				setClients(clientData);
			} catch (error) {
				console.error("Error en fetchOrders:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchOrders();
	}, []);

	useEffect(() => {
		const filtered = clients.filter(
			(client) => client.semanasSinPedir >= selectedWeeks
		);
		filtered.sort((a, b) => b.semanasSinPedir - a.semanasSinPedir);

		console.log("Clientes filtrados:", {
			totalClientes: clients.length,
			semanasFiltro: selectedWeeks,
			clientesFiltrados: filtered.length,
			ejemplos: filtered.slice(0, 3),
			rango:
				filtered.length > 0
					? {
							minSemanas: Math.min(...filtered.map((c) => c.semanasSinPedir)),
							maxSemanas: Math.max(...filtered.map((c) => c.semanasSinPedir)),
					  }
					: null,
		});

		setFilteredClients(filtered);
	}, [selectedWeeks, clients]);

	const telefonos = [
		{
			fecha: "22/11/2024",
			telefono: "3585168971",
		},
		{
			fecha: "22/10/2024",
			telefono: "3584127742",
		},
		{
			fecha: "22/08/2024",
			telefono: "3584906278",
		},
	];

	const enviarMensajes = async () => {
		Swal.fire({
			title: "Enviando mensajes...",
			text: "Esto puede tardar unos momentos.",
			icon: "info",
			showConfirmButton: false,
			allowOutsideClick: false,
			didOpen: () => {
				Swal.showLoading();
			},
		});

		try {
			for (const item of telefonos) {
				const telefonoConPrefijo = `54${item.telefono}`;
				await sendTemplateMessage(telefonoConPrefijo, 5, "4NH3L0");
			}

			Swal.fire({
				title: "Mensajes enviados",
				text: "Se enviaron todos los mensajes correctamente.",
				icon: "success",
				confirmButtonText: "Aceptar",
			});
		} catch (error) {
			console.error("Error al enviar mensajes:", error);
			Swal.fire({
				title: "Error",
				text: "Hubo un problema al enviar los mensajes.",
				icon: "error",
				confirmButtonText: "Aceptar",
			});
		}
	};

	return (
		<div className="p-4 max-w-7xl mx-auto">
			<button
				onClick={enviarMensajes}
				className="w-full bg-black text-gray-100 font-bold h-20 rounded-lg   mb-4 gap-2 flex items-center justify-center"
			>
				<img src={wsp} className="h-4 mt-1" alt="" />
				<p>Enviar 2x1</p>
			</button>

			<div className="bg-gray-300 rounded-lg">
				<div className="pt-8 pb-4 px-4">
					<div className="flex mb-8 flex-row items-center justify-center gap-2">
						<h2 className="text-2xl font-bold">Filtrar por inactividad</h2>
					</div>
					<div className="flex relative items-center gap-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="h-6 absolute text-gray-100 left-4"
						>
							<path
								fillRule="evenodd"
								d="M3.792 2.938A49.069 49.069 0 0 1 12 2.25c2.797 0 5.54.236 8.209.688a1.857 1.857 0 0 1 1.541 1.836v1.044a3 3 0 0 1-.879 2.121l-6.182 6.182a1.5 1.5 0 0 0-.439 1.061v2.927a3 3 0 0 1-1.658 2.684l-1.757.878A.75.75 0 0 1 9.75 21v-5.818a1.5 1.5 0 0 0-.44-1.06L3.13 7.938a3 3 0 0 1-.879-2.121V4.774c0-.897.64-1.683 1.542-1.836Z"
								clipRule="evenodd"
							/>
						</svg>

						<img
							src={arrow}
							className="h-2 absolute rotate-90 filter invert right-4"
							alt=""
						/>
						<select
							className="w-full h-10 pl-12 appearance-none rounded-full text-gray-100"
							value={selectedWeeks}
							onChange={(e) => setSelectedWeeks(Number(e.target.value))}
						>
							{Array.from({ length: 12 }, (_, i) => i + 2).map((weeks) => (
								<option key={weeks} value={weeks}>
									{weeks} semanas
								</option>
							))}
						</select>
					</div>
				</div>

				{filteredClients.length > 0 || isLoading ? (
					<>
						<div className="overflow-auto">
							<table className="min-w-full">
								<thead className="bg-gray-300 border-y-black border border-opacity-20 sticky top-0">
									<tr>
										<th className="px-4 h-10 text-left text-xs font-medium text-black">
											Teléfono ({isLoading ? "..." : filteredClients.length})
										</th>
										<th className="px-4 h-10 text-left text-xs font-medium text-black">
											Última vez
										</th>
										<th className="px-4 h-10 text-left text-xs font-medium text-black">
											Cantidad de Semanas
										</th>
									</tr>
								</thead>
								<tbody className="bg-gray-300">
									{isLoading
										? Array.from({ length: 20 }).map((_, index) => (
												<TableLoadingRow key={index} />
										  ))
										: filteredClients.map((client) => (
												<tr key={client.telefono}>
													<td className="px-4 h-10 text-xs whitespace-nowrap">
														{client.telefono}
													</td>
													<td className="px-4 h-10 text-xs whitespace-nowrap">
														{client.ultimoPedido.toLocaleDateString()}
													</td>
													<td className="px-4 h-10 text-xs whitespace-nowrap">
														{client.semanasSinPedir}
													</td>
												</tr>
										  ))}
								</tbody>
							</table>
						</div>
					</>
				) : (
					<div className="text-center text-xs h-10 flex items-center justify-center bg-gray-300 rounded-md">
						No hay clientes inactivos por {selectedWeeks} semanas o más.
					</div>
				)}
			</div>
		</div>
	);
};
