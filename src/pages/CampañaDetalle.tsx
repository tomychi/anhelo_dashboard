import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
	actualizarCostosCampana,
	obtenerCostosCampana,
	obtenerPedidosDesdeCampana,
	calcularEstadisticasPedidos,
} from "../firebase/voucher";

interface CostItem {
	title: string;
	value: number;
}

interface Pedido {
	fecha: string;
	total: number;
	subTotal: number;
	couponCodes?: string[];
}

interface CampañaDetalleProps {
	titulo: string;
	fecha: string;
	usados: number;
	creados: number;
	codigos?: Array<{
		codigo: string;
		estado: string;
		num: number;
	}>;
	costos?: CostItem[];
}

export const CampañaDetalle: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const campaignData = location.state?.campaignData as CampañaDetalleProps;
	const [newCostTitle, setNewCostTitle] = useState<string>("");
	const [newCostValue, setNewCostValue] = useState<string>("");
	const [isUpdating, setIsUpdating] = useState(false);
	const [costs, setCosts] = useState<CostItem[]>([]);
	const [pedidosConCupon, setPedidosConCupon] = useState<Pedido[]>([]);
	const [estadisticas, setEstadisticas] = useState<{
		totalPedidos: number;
		totalCupones: number;
		promedioCuponesPorPedido: number;
		montoTotal: number;
		montoSinDescuento: number;
		descuentoTotal: number;
		promedioDescuento: number;
	}>({
		totalPedidos: 0,
		totalCupones: 0,
		promedioCuponesPorPedido: 0,
		montoTotal: 0,
		montoSinDescuento: 0,
		descuentoTotal: 0,
		promedioDescuento: 0,
	});

	useEffect(() => {
		const loadCampaignCosts = async () => {
			if (!campaignData?.titulo) return;

			try {
				const loadedCosts = await obtenerCostosCampana(campaignData.titulo);
				setCosts(loadedCosts);
			} catch (error) {
				console.error("Error al cargar los costos:", error);
			}
		};

		loadCampaignCosts();
	}, [campaignData?.titulo]);

	useEffect(() => {
		const cargarPedidos = async () => {
			if (!campaignData?.titulo || !campaignData?.fecha) {
				console.log("No hay datos de campaña:", { campaignData });
				return;
			}

			console.log("Iniciando carga de pedidos con datos:", {
				titulo: campaignData.titulo,
				fecha: campaignData.fecha,
			});

			try {
				const pedidos = await obtenerPedidosDesdeCampana(
					campaignData.fecha,
					campaignData.titulo
				);

				console.log("Pedidos obtenidos:", pedidos);
				setPedidosConCupon(pedidos);

				const stats = calcularEstadisticasPedidos(pedidos);
				console.log("Estadísticas calculadas:", stats);
				setEstadisticas(stats);
			} catch (error) {
				console.error("Error al cargar los pedidos:", error);
			}
		};

		cargarPedidos();
	}, [campaignData?.titulo, campaignData?.fecha]);

	if (!campaignData) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen">
				<p className="text-xl mb-4">No se encontraron datos de la campaña</p>
				<button
					onClick={() => navigate(-1)}
					className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
				>
					Volver
				</button>
			</div>
		);
	}

	const handleAddCost = async () => {
		if (!newCostTitle.trim() || isNaN(parseFloat(newCostValue))) {
			alert("Por favor ingrese un título y un valor numérico válido");
			return;
		}

		try {
			setIsUpdating(true);

			const costToAdd = {
				title: newCostTitle.trim(),
				value: parseFloat(newCostValue),
			};

			await actualizarCostosCampana(campaignData.titulo, costToAdd, true);
			setCosts((prevCosts) => [...prevCosts, costToAdd]);

			alert("Costo agregado correctamente");
			setNewCostTitle("");
			setNewCostValue("");
		} catch (error) {
			console.error("Error al actualizar los costos:", error);
			alert("Error al actualizar los costos");
		} finally {
			setIsUpdating(false);
		}
	};

	const formatearFecha = (fecha: string): string => {
		try {
			if (fecha.includes("-")) {
				const [year, month, day] = fecha.split("-");
				return `${day}/${month}/${year}`;
			}

			if (fecha.includes("/")) {
				const parts = fecha.split("/");
				if (parts[2].length === 4) {
					return fecha;
				} else {
					return `${parts[0]}/${parts[1]}/20${parts[2]}`;
				}
			}

			return fecha;
		} catch (error) {
			console.error("Error al formatear la fecha:", error);
			return fecha;
		}
	};

	const getUsagePercentage = (): string => {
		if (campaignData.creados === 0) return "0%";
		return `${((campaignData.usados / campaignData.creados) * 100).toFixed(
			1
		)}%`;
	};

	const getUsageColor = (): string => {
		if (campaignData.creados === 0) return "bg-red-500";
		const percentage = (campaignData.usados / campaignData.creados) * 100;

		if (percentage < 5) return "bg-red-500";
		if (percentage < 10) return "bg-yellow-500";
		return "bg-green-500";
	};

	const getTotalCosts = (): number => {
		return costs.reduce((sum, cost) => sum + cost.value, 0);
	};

	const calcularPorcentajeDiscrepancia = (): number => {
		if (!campaignData?.codigos || !estadisticas.totalCupones) {
			return 0;
		}

		// Contamos cuántos códigos están marcados como "usado"
		const codigosUsados = campaignData.codigos.filter(
			(codigo) => codigo.estado === "usado"
		).length;

		const cuponesNoEncontrados = codigosUsados - estadisticas.totalCupones;
		return (cuponesNoEncontrados * 100) / codigosUsados;
	};

	return (
		<div className="container mx-auto px-4 py-8 font-coolvetica">
			<div className="flex items-center mb-6">
				<button
					onClick={() => navigate(-1)}
					className="mr-4 text-black hover:text-gray-700"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M10 19l-7-7m0 0l7-7m-7 7h18"
						/>
					</svg>
				</button>
				<h1 className="text-2xl font-bold">Detalles de la Campaña</h1>
			</div>

			<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
				<div className="mb-4">
					<h2 className="text-xl font-bold mb-4">Información General</h2>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<p className="text-sm text-gray-500">Título de la Campaña</p>
						<p className="text-lg font-medium">{campaignData.titulo}</p>
					</div>
					<div>
						<p className="text-sm text-gray-500">Fecha</p>
						<p className="text-lg font-medium">
							{formatearFecha(campaignData.fecha)}
						</p>
					</div>
					<div>
						<p className="text-sm text-gray-500">Estado de Uso</p>
						<div className="flex items-center gap-2 mt-1">
							<span className="text-lg font-medium">
								{campaignData.usados} de {campaignData.creados}
							</span>
							<span
								className={`px-2 py-1 rounded-full text-white text-sm ${getUsageColor()}`}
							>
								{getUsagePercentage()}
							</span>
						</div>
					</div>
				</div>
			</div>

			<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
				<div className="mb-4">
					<h2 className="text-xl font-bold mb-4">Estadísticas de Uso</h2>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<p className="text-sm text-gray-500">
								Pedidos de la campaña encontrados
							</p>
							<p className="text-lg font-medium">{estadisticas.totalPedidos}</p>
						</div>
						<div>
							<p className="text-sm text-gray-500">
								Cupones Usados con pedido asociado
							</p>
							<p className="text-lg font-medium">{estadisticas.totalCupones}</p>
						</div>
						<div>
							<p className="text-sm text-gray-500">
								Cupones Usados sin pedido asociado
							</p>
							<p className="text-lg font-medium text-red-500">
								{(() => {
									const codigosUsados =
										campaignData.codigos?.filter(
											(codigo) => codigo.estado === "usado"
										).length || 0;
									const noEncontrados =
										codigosUsados - estadisticas.totalCupones;
									const porcentaje = calcularPorcentajeDiscrepancia();
									return `${noEncontrados} (${porcentaje.toFixed(2)}%)`;
								})()}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-500">
								Promedio de Cupones por Pedido
							</p>
							<p className="text-lg font-medium">
								{estadisticas.promedioCuponesPorPedido.toFixed(2)}
							</p>
						</div>
						{/* ... resto de las estadísticas ... */}
					</div>
				</div>
			</div>

			<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
				<div className="mb-4">
					<h2 className="text-xl font-bold mb-4">Estadisticas financieras </h2>
					<h2 className="  font-bold mb-4">
						Bruto generado hasta la fecha: $
						{estadisticas.montoSinDescuento.toLocaleString()}
					</h2>
					<h2 className=" font-bold mb-4">
						Costos: ${getTotalCosts().toLocaleString()}
					</h2>
					<h2 className="  font-bold mb-4">
						Neto (18%) estimado hasta la fecha : $
						{(
							(estadisticas.montoSinDescuento - getTotalCosts()) *
							0.18
						).toLocaleString()}
					</h2>
					<div className="flex gap-4 mb-4">
						<input
							type="text"
							className="flex-1 bg-gray-100 rounded-md px-3 py-2 border border-gray-300"
							value={newCostTitle}
							onChange={(e) => setNewCostTitle(e.target.value)}
							placeholder="Título del costo"
						/>
						<input
							type="number"
							className="w-32 bg-gray-100 rounded-md px-3 py-2 border border-gray-300"
							value={newCostValue}
							onChange={(e) => setNewCostValue(e.target.value)}
							placeholder="Valor"
						/>
						<button
							onClick={handleAddCost}
							disabled={isUpdating}
							className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:bg-gray-400"
						>
							{isUpdating ? "..." : "Agregar"}
						</button>
					</div>

					<div className="space-y-2">
						{costs.map((cost, index) => (
							<div
								key={index}
								className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
							>
								<span className="font-medium">{cost.title}</span>
								<span className="text-gray-600">
									${cost.value.toLocaleString()}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>

			{campaignData.codigos && campaignData.codigos.length > 0 && (
				<div className="bg-white rounded-lg shadow-lg p-6">
					<div className="mb-4">
						<h2 className="text-xl font-bold mb-4">Códigos de la Campaña</h2>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b">
									<th className="text-left py-2 px-4">Número</th>
									<th className="text-left py-2 px-4">Código</th>
									<th className="text-left py-2 px-4">Estado</th>
								</tr>
							</thead>
							<tbody>
								{campaignData.codigos.map((codigo, index) => (
									<tr key={index} className="border-b">
										<td className="py-2 px-4">{codigo.num}</td>
										<td className="py-2 px-4">{codigo.codigo}</td>
										<td className="py-2 px-4">
											<span
												className={`px-2 py-1 rounded-full text-white text-sm ${
													codigo.estado === "usado"
														? "bg-green-500"
														: "bg-yellow-500"
												}`}
											>
												{codigo.estado}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
};

export default CampañaDetalle;
