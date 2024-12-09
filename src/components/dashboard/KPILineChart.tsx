import React, { useState, useEffect } from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import {
	calcularPromedioTiempoElaboracion,
	promedioTiempoDeEntregaTotal,
	contarPedidosDemorados,
} from "../../helpers/dateToday";
import { calculateKMS } from "../../helpers";
import { PedidoProps } from "../../types/types";
import { projectAuth } from "../../firebase/config";

interface KPIData {
	fecha: string;
	facturacionBruta: number;
	facturacionNeta: number;
	productosVendidos: number;
	ventasDelivery: number;
	customerSuccess: number;
	tiempoCoccion: number;
	tiempoEntregaTotal: number;
	kmRecorridos: number;
	ticketPromedio: number;
	ratingPresentacion: number;
	ratingPagina: number;
}

type ValueType = number | string | Array<number | string>;

interface KPILineChartProps {
	orders: PedidoProps[];
}

const KPILineChart: React.FC<KPILineChartProps> = ({ orders }) => {
	const [selectedKPIs, setSelectedKPIs] = useState<string[]>([
		"productosVendidos",
	]);
	const [chartData, setChartData] = useState<KPIData[]>([]);
	const currentUserEmail = projectAuth.currentUser?.email;
	const isMarketingUser = currentUserEmail === "marketing@anhelo.com";

	useEffect(() => {
		if (orders.length === 0) return;

		const ordersByDate = orders.reduce<Record<string, PedidoProps[]>>(
			(acc, order) => {
				if (!order.fecha) return acc;
				const dateStr = order.fecha;
				if (!acc[dateStr]) acc[dateStr] = [];
				acc[dateStr].push(order);
				return acc;
			},
			{}
		);

		const dailyData: KPIData[] = Object.entries(ordersByDate).map(
			([dateStr, dailyOrders]) => {
				const facturacionBruta = dailyOrders.reduce(
					(sum, order) => sum + (Number(order.total) || 0),
					0
				);
				const productosVendidos = dailyOrders.reduce(
					(sum, order) => sum + (order.detallePedido?.length || 0),
					0
				);

				// Calculate ratings for the day
				const presentacionRatings = dailyOrders
					.filter((order) => order.rating?.presentacion)
					.map((order) => order.rating?.presentacion || 0);
				const paginaRatings = dailyOrders
					.filter((order) => order.rating?.pagina)
					.map((order) => order.rating?.pagina || 0);

				const avgPresentacion = presentacionRatings.length
					? presentacionRatings.reduce((a, b) => a + b, 0) /
					  presentacionRatings.length
					: 0;
				const avgPagina = paginaRatings.length
					? paginaRatings.reduce((a, b) => a + b, 0) / paginaRatings.length
					: 0;

				return {
					fecha: dateStr,
					facturacionBruta,
					facturacionNeta: facturacionBruta * 0.8,
					productosVendidos: Math.ceil(productosVendidos * 2), // Marketing multiplier
					ventasDelivery: Math.ceil(dailyOrders.length * 2), // Marketing multiplier
					customerSuccess: contarPedidosDemorados(dailyOrders),
					tiempoCoccion: calcularPromedioTiempoElaboracion(dailyOrders),
					tiempoEntregaTotal: promedioTiempoDeEntregaTotal(dailyOrders),
					kmRecorridos: calculateKMS(dailyOrders),
					ticketPromedio:
						dailyOrders.length > 0 ? facturacionBruta / dailyOrders.length : 0,
					ratingPresentacion: avgPresentacion,
					ratingPagina: avgPagina,
				};
			}
		);

		const sortedData = dailyData.sort((a, b) => {
			const [diaA, mesA, añoA] = a.fecha.split("/");
			const [diaB, mesB, añoB] = b.fecha.split("/");
			const fechaA = new Date(Number(añoA), Number(mesA) - 1, Number(diaA));
			const fechaB = new Date(Number(añoB), Number(mesB) - 1, Number(diaB));
			return fechaA.getTime() - fechaB.getTime();
		});

		setChartData(sortedData);
	}, [orders]);

	const marketingKPIOptions = [
		{ id: "productosVendidos", name: "Productos vendidos", color: "#FFD700" },
		{ id: "ventasDelivery", name: "Ventas delivery", color: "#4D4DFF" },
		{ id: "ratingPresentacion", name: "Presentación", color: "#FF66FF" },
		{ id: "ratingPagina", name: "Página", color: "#00E6E6" },
	];

	const allKPIOptions = [
		{ id: "facturacionBruta", name: "Facturación bruta", color: "#FA0202" },
		{ id: "facturacionNeta", name: "Facturación neta", color: "#4DFF88" },
		{ id: "productosVendidos", name: "Productos vendidos", color: "#FFD700" },
		{ id: "ventasDelivery", name: "Ventas delivery", color: "#4D4DFF" },
		{ id: "customerSuccess", name: "Customer success", color: "#FF66FF" },
		{ id: "tiempoCoccion", name: "Tiempo cocción promedio", color: "#00E6E6" },
		{
			id: "tiempoEntregaTotal",
			name: "Tiempo entrega total",
			color: "#B266FF",
		},
		{ id: "kmRecorridos", name: "KMs recorridos", color: "#FF9933" },
		{ id: "ticketPromedio", name: "Ticket promedio", color: "#FF6699" },
	];

	const kpiOptions = isMarketingUser ? marketingKPIOptions : allKPIOptions;

	const toggleKPI = (kpiId: string) => {
		setSelectedKPIs((prev) =>
			prev.includes(kpiId)
				? prev.filter((id) => id !== kpiId)
				: [...prev, kpiId]
		);
	};

	if (chartData.length === 0) {
		return <div></div>;
	}

	return (
		<div className="bg-gray-100 mt-4 pt-4 rounded-lg shadow-2xl shadow-black mb-4 pb-2">
			<div className="md:pt-4">
				<p className="md:text-5xl text-2xl font-bold pb-4 mt-2 text-center border-b border-black border-opacity-20">
					KPIs en el tiempo
				</p>
				<div className="flex px-4 flex-wrap gap-2 mb-4 mt-4 md:justify-center">
					{kpiOptions.map((kpi) => (
						<button
							key={kpi.id}
							onClick={() => toggleKPI(kpi.id)}
							className={`px-4 h-10 rounded-lg text-sm font-bold ${
								selectedKPIs.includes(kpi.id)
									? "bg-black text-white"
									: "bg-gray-200 text-black"
							}`}
							style={{
								borderLeft: selectedKPIs.includes(kpi.id)
									? `4px solid ${kpi.color}`
									: "4px solid transparent",
							}}
						>
							{kpi.name}
						</button>
					))}
				</div>
			</div>
			<div className="h-[175px] px-4 md:h-[300px] w-full">
				<ResponsiveContainer>
					<BarChart data={chartData}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis
							dataKey="fecha"
							tickFormatter={(value) => {
								const [dia, mes] = value.split("/");
								return `${dia}/${mes}`;
							}}
						/>
						<YAxis />
						<Tooltip
							formatter={(value: ValueType, name: string | number) => {
								if (typeof value === "number") {
									if (name.toString().includes("rating"))
										return value.toFixed(1);
									if (typeof name === "string") {
										if (name.includes("Tiempo"))
											return `${value.toFixed(1)} min`;
										if (name.includes("KMs")) return `${value.toFixed(1)} km`;
										if (name.includes("Facturación") || name.includes("Ticket"))
											return `$${value.toFixed(0)}`;
									}
									return value.toFixed(0);
								}
								return value;
							}}
						/>
						{kpiOptions.map(
							(kpi) =>
								selectedKPIs.includes(kpi.id) && (
									<Bar
										key={kpi.id}
										dataKey={kpi.id}
										name={kpi.name}
										fill={kpi.color}
										barSize={40}
									/>
								)
						)}
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
};

export default KPILineChart;
