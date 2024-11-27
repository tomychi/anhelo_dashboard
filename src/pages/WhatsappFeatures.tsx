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
	const [showWeeksDropdown, setShowWeeksDropdown] = useState(false);
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
		<div className="flex flex-col">
			<style>
				{`
          .arrow-down {
            transition: transform 0.3s ease;
            transform: rotate(90deg);
          }
          .arrow-down.open {
            transform: rotate(-90deg);
          }
        `}
			</style>

			{/* Header Section */}
			<div className="flex flex-row justify-between font-coolvetica items-center mt-8 mx-4 mb-4">
				<p className="text-black font-bold text-4xl mt-1">Inactivos</p>
				<button
					onClick={enviarMensajes}
					className="bg-gray-300 gap-2 text-black rounded-full flex items-center pt-3 pb-4 pl-3 pr-4 h-10"
				>
					<img src={wsp} alt="WhatsApp" className="h-4 brightness-0" />
					<p className="font-bold">Enviar 2x1</p>
				</button>
			</div>

			{/* Filter Section */}
			<div className="px-4 pb-8">
				<div className="flex flex-row gap-2 mt-2">
					<div className="relative flex items-center pr-2 w-full h-10 gap-1 rounded-lg border-4 border-black focus:ring-0 font-coolvetica justify-between text-black text-xs font-light">
						<div className="flex flex-row items-center gap-1">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="1.5"
								stroke="currentColor"
								className="h-6 ml-1.5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
								/>
							</svg>
							<select
								className="w-full bg-transparent outline-none appearance-none"
								value={selectedWeeks}
								onChange={(e) => setSelectedWeeks(Number(e.target.value))}
							>
								{Array.from({ length: 12 }, (_, i) => i + 2).map((weeks) => (
									<option key={weeks} value={weeks}>
										{weeks} semanas o más
									</option>
								))}
							</select>
						</div>
						<img
							src={arrow}
							className={`h-2 arrow-down ${showWeeksDropdown ? "open" : ""}`}
							alt=""
						/>
					</div>
				</div>
			</div>

			{/* Table Section */}
			<div className="font-coolvetica">
				<table className="w-full text-xs text-left text-black">
					<thead className="text-black border-b h-10">
						<tr>
							<th scope="col" className="pl-4 w-1/3">
								Teléfono ({isLoading ? "..." : filteredClients.length})
							</th>
							<th scope="col" className="pl-4 w-1/3">
								Última vez
							</th>
							<th scope="col" className="pl-4 w-1/3">
								Semanas sin pedir
							</th>
						</tr>
					</thead>
					<tbody>
						{isLoading ? (
							Array.from({ length: 20 }).map((_, index) => (
								<TableLoadingRow key={index} />
							))
						) : filteredClients.length > 0 ? (
							filteredClients.map((client) => (
								<tr
									key={client.telefono}
									className="text-black border font-light h-10 border-black border-opacity-20"
								>
									<td className="pl-4 font-light">{client.telefono}</td>
									<td className="pl-4 font-light">
										{client.ultimoPedido.toLocaleDateString()}
									</td>
									<td className="pl-4 font-light">{client.semanasSinPedir}</td>
								</tr>
							))
						) : (
							<tr className="text-black border font-light h-10">
								<td colSpan={3} className="text-center">
									No hay clientes inactivos por {selectedWeeks} semanas o más.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default WhatsappFeatures;
