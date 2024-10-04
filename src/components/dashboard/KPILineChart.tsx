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

const KPILineChart = ({ orders }) => {
	const [selectedKPIs, setSelectedKPIs] = useState(["facturacionBruta"]);
	const [chartData, setChartData] = useState([]);

	useEffect(() => {
		if (!orders.length) return;

		const ordersByDate = orders.reduce((acc, order) => {
			if (!order.fecha) return acc;
			const dateStr = order.fecha;
			if (!acc[dateStr]) acc[dateStr] = [];
			acc[dateStr].push(order);
			return acc;
		}, {});

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

				const pedidosDemorados = contarPedidosDemorados(dailyOrders);
				const customerSuccess =
					dailyOrders.length > 0
						? 100 - (pedidosDemorados * 100) / dailyOrders.length
						: 0;

				const tiempoCoccion = calcularPromedioTiempoElaboracion(dailyOrders);
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
		{ id: "facturacionBruta", name: "Facturación Bruta", color: "#FA0202" }, // Rojo brillante
		{ id: "facturacionNeta", name: "Facturación Neta", color: "#4DFF88" }, // Verde vibrante y fresco
		{ id: "productosVendidos", name: "Productos Vendidos", color: "#FFD700" }, // Amarillo dorado, brillante
		{ id: "ventasDelivery", name: "Ventas Delivery", color: "#4D4DFF" }, // Azul claro y saturado
		{ id: "customerSuccess", name: "Customer Success", color: "#FF66FF" }, // Magenta claro
		{ id: "tiempoCoccion", name: "Tiempo Cocción Promedio", color: "#00E6E6" }, // Cian suave
		{
			id: "tiempoEntregaTotal",
			name: "Tiempo Entrega Total",
			color: "#B266FF", // Púrpura medio
		},
		{ id: "kmRecorridos", name: "KMs Recorridos", color: "#FF9933" }, // Naranja suave
		{ id: "ticketPromedio", name: "Ticket Promedio", color: "#FF6699" }, // Rosa fuerte
	];

	const toggleKPI = (kpiId) => {
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
		<div className="px-4 bg-gray-100 mt-4 pt-4 rounded-lg shadow-2xl shadow-black  mb-4 pb-2">
			<div className="md:pt-4 ">
				<p className="md:text-5xl text-2xl font-bold mb-6 mt-4 text-center">
					KPIs en el tiempo
				</p>
				<div className="flex flex-wrap gap-2 mb-4 md:justify-center">
					{kpiOptions.map((kpi) => (
						<button
							key={kpi.id}
							onClick={() => toggleKPI(kpi.id)}
							className={`px-4 h-10 rounded-lg text-sm font-bold ${
								selectedKPIs.includes(kpi.id)
									? "bg-gray-800 text-white"
									: "bg-gray-200 text-gray-700"
							}`}
							// Solo aplicar el borde de color si el KPI está seleccionado
							style={{
								borderLeft: selectedKPIs.includes(kpi.id)
									? `4px solid ${kpi.color}`
									: "4px solid transparent", // Borde transparente si no está seleccionado
							}}
						>
							{kpi.name}
						</button>
					))}
				</div>
			</div>
			<div className=" h-[175px] md:h-[300px] w-full">
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
							formatter={(value, name) => {
								if (name === "customerSuccess") return `${value.toFixed(1)}%`;
								if (name.includes("Tiempo")) return `${value.toFixed(1)} min`;
								if (name.includes("KMs")) return `${value.toFixed(1)} km`;
								if (name.includes("Facturación") || name.includes("Ticket"))
									return `$${value.toFixed(0)}`;
								return value.toFixed(0);
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
