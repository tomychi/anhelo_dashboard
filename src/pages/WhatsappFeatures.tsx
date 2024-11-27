import { sendTemplateMessage } from "../utils/whatsapp";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import { ReadLastThreeMonthsOrders } from "../firebase/ReadData";
import wsp from "../assets/wsp.png";

interface ClientData {
	telefono: string;
	ultimoPedido: Date;
	semanasSinPedir: number;
}

export const WhatsappFeatures = () => {
	const [clients, setClients] = useState<ClientData[]>([]);
	const [selectedWeeks, setSelectedWeeks] = useState<number>(2);
	const [filteredClients, setFilteredClients] = useState<ClientData[]>([]);
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

						// Actualizamos solo si es la fecha más antigua
						if (!currentDate || orderDate < currentDate) {
							clientMap.set(order.telefono, orderDate);
						}
					} catch (error) {
						console.error("Error procesando pedido:", { order, error });
					}
				});

				// Convertimos a array y calculamos semanas sin pedir
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
				// Agregar el prefijo '54' directamente al enviar el mensaje
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
			{/* Estadísticas Generales */}
			<button
				onClick={enviarMensajes}
				className="w-full bg-black text-gray-100 font-bold h-20 rounded-lg shadow-gray-400 shadow-lg mb-8 gap-2 flex items-center justify-center"
			>
				<img src={wsp} className="h-4 mt-1" alt="" />
				<p>Enviar WhatsApp</p>
			</button>

			{/* Filtro de Clientes Inactivos */}
			<div className="bg-gray-300  rounded-lg shadow-lg">
				<div className="mb-6 pt-4 px-4 border pb-4 border-b-black border-opacity-20">
					<h2 className="text-xl font-bold mb-4 text-center w-full">Filtro</h2>
					<div className="flex items-center gap-4">
						<label className="text-sm font-medium text-gray-700">
							Clientes que pidieron por ultima vez hace:
						</label>
						<select
							className="w-48 p-2 border rounded-md shadow-sm"
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

				{filteredClients.length > 0 ? (
					<>
						<div className="mb-4 p-4 bg-blue-50 rounded-md">
							<p className="text-blue-800">
								Total de clientes inactivos por {selectedWeeks} semanas o más:{" "}
								{filteredClients.length}
							</p>
						</div>

						<div className="overflow-auto max-h-[400px]">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50 sticky top-0">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Teléfono
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Último Pedido
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Semanas sin Pedir
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Acciones
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{filteredClients.map((client) => (
										<tr key={client.telefono}>
											<td className="px-6 py-4 whitespace-nowrap">
												{client.telefono}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												{client.ultimoPedido.toLocaleDateString()}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												{client.semanasSinPedir}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<button
													onClick={() => sendTemplateMessage(client.telefono)}
													className="text-green-600 hover:text-green-900"
												>
													Enviar WhatsApp
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</>
				) : (
					<div className="text-center p-4 bg-gray-50 rounded-md">
						No hay clientes inactivos por {selectedWeeks} semanas o más
					</div>
				)}
			</div>
		</div>
	);
};
