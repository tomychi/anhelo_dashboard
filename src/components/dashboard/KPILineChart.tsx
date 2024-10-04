import React, { useState, useEffect } from "react";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import {
	calcularPromedioTiempoElaboracion,
	promedioTiempoDeEntregaTotal,
	contarPedidosDemorados,
} from "../../helpers/dateToday";
import { calculateKMS } from "../../helpers";

const KPILineChart = ({ orders }) => {
	const [selectedKPIs, setSelectedKPIs] = useState([
		"facturacionBruta",
		"facturacionNeta",
	]);
	const [chartData, setChartData] = useState([]);

	useEffect(() => {
		if (!orders.length) return;

		// Group orders by date
		const ordersByDate = orders.reduce((acc, order) => {
			if (!order.fecha) return acc;
			const dateStr = order.fecha;
			if (!acc[dateStr]) acc[dateStr] = [];
			acc[dateStr].push(order);
			return acc;
		}, {});

		// Calculate daily metrics
		const dailyData = Object.entries(ordersByDate).map(
			([dateStr, dailyOrders]) => {
				const facturacionBruta = dailyOrders.reduce(
					(sum, order) => sum + (Number(order.total) || 0),
					0
				);
				const productosVendidos = dailyOrders.reduce(
					(sum, order) => sum + (order.detallePedido?.length || 0),
					0
				);

				// Customer Success - usando la misma lógica que el Dashboard
				const pedidosDemorados = contarPedidosDemorados(dailyOrders);
				const customerSuccess =
					dailyOrders.length > 0
						? 100 - (pedidosDemorados * 100) / dailyOrders.length
						: 0;

				// Tiempo promedio de cocción - usando la función existente
				const tiempoCoccion = calcularPromedioTiempoElaboracion(dailyOrders);

				// Tiempo total de entrega - usando la función existente
				const tiempoEntregaTotal = promedioTiempoDeEntregaTotal(dailyOrders);

				return {
					fecha: dateStr,
					facturacionBruta,
					facturacionNeta: facturacionBruta * 0.8,
					productosVendidos,
					ventasDelivery: dailyOrders.length,
					customerSuccess,
					tiempoCoccion,
					tiempoEntregaTotal,
					kmRecorridos: calculateKMS(dailyOrders),
					ticketPromedio:
						dailyOrders.length > 0 ? facturacionBruta / dailyOrders.length : 0,
				};
			}
		);

		// Sort by date
		const sortedData = dailyData.sort((a, b) => {
			const [diaA, mesA, añoA] = a.fecha.split("/");
			const [diaB, mesB, añoB] = b.fecha.split("/");
			const fechaA = new Date(añoA, mesA - 1, diaA);
			const fechaB = new Date(añoB, mesB - 1, diaB);
			return fechaA - fechaB;
		});

		setChartData(sortedData);
	}, [orders]);

	const kpiOptions = [
		{ id: "facturacionBruta", name: "Facturación Bruta", color: "#8884d8" },
		{ id: "facturacionNeta", name: "Facturación Neta", color: "#82ca9d" },
		{ id: "productosVendidos", name: "Productos Vendidos", color: "#ffc658" },
		{ id: "ventasDelivery", name: "Ventas Delivery", color: "#ff7300" },
		{ id: "customerSuccess", name: "Customer Success %", color: "#0088FE" },
		{ id: "tiempoCoccion", name: "Tiempo Cocción Promedio", color: "#00C49F" },
		{
			id: "tiempoEntregaTotal",
			name: "Tiempo Entrega Total",
			color: "#FFBB28",
		},
		{ id: "kmRecorridos", name: "KMs Recorridos", color: "#FF8042" },
		{ id: "ticketPromedio", name: "Ticket Promedio", color: "#EA4C89" },
	];

	const toggleKPI = (kpiId) => {
		setSelectedKPIs((prev) =>
			prev.includes(kpiId)
				? prev.filter((id) => id !== kpiId)
				: [...prev, kpiId]
		);
	};

	if (chartData.length === 0) {
		return (
			<div className="p-6 bg-white mt-4 rounded-lg shadow-lg">
				<h2 className="text-4xl font-bold mb-4">Evolución de KPIs</h2>
				<p className="text-gray-500">
					Selecciona un rango de fechas para ver los datos
				</p>
			</div>
		);
	}

	return (
		<div className="px-4 bg-white pb-2  rounded-lg shadow-2xl shadow-black  mb-4">
			<div className="flex flex-wrap gap-2 mb-8 mt-4 pt-8">
				{kpiOptions.map((kpi) => (
					<button
						key={kpi.id}
						onClick={() => toggleKPI(kpi.id)}
						className={`px-4 h-10 rounded-full text-sm font-bold ${
							selectedKPIs.includes(kpi.id)
								? "bg-gray-800 text-white"
								: "bg-gray-200 text-gray-700"
						}`}
					>
						{kpi.name}
					</button>
				))}
			</div>
			<div className="h-[400px] w-full">
				<ResponsiveContainer>
					<LineChart data={chartData}>
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
							formatter={(value, name) => {
								if (name === "customerSuccess") return `${value.toFixed(1)}%`;
								if (name.includes("Tiempo")) return `${value.toFixed(1)} min`;
								if (name.includes("KMs")) return `${value.toFixed(1)} km`;
								if (name.includes("Facturación") || name.includes("Ticket"))
									return `$${value.toFixed(0)}`;
								return value.toFixed(0);
							}}
						/>
						<Legend />
						{kpiOptions.map(
							(kpi) =>
								selectedKPIs.includes(kpi.id) && (
									<Line
										key={kpi.id}
										type="monotone"
										dataKey={kpi.id}
										name={kpi.name}
										stroke={kpi.color}
										strokeWidth={2}
										dot={{ r: 4 }}
									/>
								)
						)}
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
};

export default KPILineChart;
