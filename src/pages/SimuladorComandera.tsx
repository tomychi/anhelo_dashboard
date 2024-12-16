// import React, { useState } from "react";
// import {
// 	LineChart,
// 	Line,
// 	XAxis,
// 	YAxis,
// 	CartesianGrid,
// 	Tooltip,
// 	Legend,
// } from "recharts";
// import Datepicker, { DateValueType } from "react-tailwindcss-datepicker";
// import { ReadDataForDateRange } from "../firebase/ReadData";
// import { PedidoProps } from "../types/types";
// import { OptimizadorComandas } from "./OptimizadorComandas";
// import { ComanderaAutomatizada } from "./ComanderaAutomatizada";

// interface SimulationMetrics {
// 	customerSuccess: number;
// 	tiempoPromedioEntrega: number;
// 	costoPorEntrega: number;
// 	gruposFormados: number;
// 	pedidosEntregados: number;
// }

// interface SimulationResult {
// 	customerSuccess: number;
// 	tiempoPromedioEntrega: number;
// 	costoPorEntrega: number;
// 	gruposFormados: number;
// 	pedidosEntregados: number;
// 	grupos: Grupo[];
// }

// interface Grupo {
// 	pedidos: PedidoProps[];
// 	tiempoTotal: number;
// 	distanciaTotal: number;
// 	customerSuccess: number;
// 	costoPromedio: number;
// 	tiempoRegreso?: string;
// }

// export const SimuladorComandera: React.FC = () => {
// 	const [selectedDate, setSelectedDate] = useState<DateValueType>(null);
// 	const [pedidosHistoricos, setPedidosHistoricos] = useState<PedidoProps[]>([]);
// 	const [resultadosSimulacion, setResultadosSimulacion] = useState<
// 		{
// 			real: SimulationMetrics;
// 			simulado: SimulationResult;
// 			timestamp: string;
// 		}[]
// 	>([]);
// 	const [simulando, setSimulando] = useState(false);
// 	const [metricas, setMetricas] = useState<{
// 		real: SimulationMetrics | null;
// 		simulado: SimulationResult | null;
// 		grupos: Grupo[] | null;
// 	}>({
// 		real: null,
// 		simulado: null,
// 		grupos: null,
// 	});

// 	const calcularMetricasReales = (
// 		pedidos: PedidoProps[]
// 	): SimulationMetrics => {
// 		const pedidosEntregados = pedidos.filter((p) => p.entregado);
// 		const pedidosConDelay = pedidos.filter((p) => p.delay || p.dislike).length;

// 		const customerSuccess =
// 			((pedidos.length - pedidosConDelay) / pedidos.length) * 100;

// 		const tiemposEntrega = pedidosEntregados
// 			.map((pedido) => {
// 				if (!pedido.tiempoEntregado || !pedido.hora) return 0;
// 				const [horaEntrega, minutosEntrega] = pedido.tiempoEntregado
// 					.split(":")
// 					.map(Number);
// 				const [horaPedido, minutosPedido] = pedido.hora.split(":").map(Number);
// 				return (
// 					horaEntrega * 60 + minutosEntrega - (horaPedido * 60 + minutosPedido)
// 				);
// 			})
// 			.filter((tiempo) => tiempo > 0);

// 		const tiempoPromedio =
// 			tiemposEntrega.length > 0
// 				? tiemposEntrega.reduce((a, b) => a + b, 0) / tiemposEntrega.length
// 				: 0;

// 		// Agrupar pedidos por cadete para contar grupos
// 		const gruposPorCadete = pedidos.reduce((acc, pedido) => {
// 			if (!pedido.cadete) return acc;
// 			if (!acc[pedido.cadete]) acc[pedido.cadete] = new Set();
// 			acc[pedido.cadete].add(pedido.fecha + pedido.hora);
// 			return acc;
// 		}, {} as Record<string, Set<string>>);

// 		const gruposFormados = Object.values(gruposPorCadete).reduce(
// 			(total, grupos) => total + grupos.size,
// 			0
// 		);

// 		return {
// 			customerSuccess: Math.round(customerSuccess),
// 			tiempoPromedioEntrega: Math.round(tiempoPromedio),
// 			costoPorEntrega: calcularCostoPromedioReal(pedidos),
// 			gruposFormados,
// 			pedidosEntregados: pedidosEntregados.length,
// 		};
// 	};

// 	const calcularCostoPromedioReal = (pedidos: PedidoProps[]): number => {
// 		const COSTO_BASE_ENTREGA = 1200;
// 		const COSTO_KM = 200;

// 		const totalKms = pedidos.reduce(
// 			(acc, pedido) => acc + (pedido.kms || 0),
// 			0
// 		);
// 		const costoTotal =
// 			pedidos.length * COSTO_BASE_ENTREGA + totalKms * COSTO_KM;

// 		return Math.round(costoTotal / pedidos.length);
// 	};

// 	const handleDateChange = async (value: DateValueType) => {
// 		if (!value?.startDate) return;
// 		setSelectedDate(value);
// 		setSimulando(true);

// 		try {
// 			const pedidos = await ReadDataForDateRange<PedidoProps>("pedidos", value);
// 			setPedidosHistoricos(pedidos);
// 			const metricasReales = calcularMetricasReales(pedidos);
// 			setMetricas((prev) => ({ ...prev, real: metricasReales, grupos: null }));
// 		} catch (error) {
// 			console.error("Error cargando datos históricos:", error);
// 		} finally {
// 			setSimulando(false);
// 		}
// 	};

// 	const ejecutarSimulacion = async () => {
// 		if (pedidosHistoricos.length === 0) return;

// 		setSimulando(true);
// 		try {
// 			// Creamos una nueva instancia del optimizador
// 			const optimizador = new OptimizadorComandas();
// 			const resultado = await optimizador.simularDia(pedidosHistoricos);

// 			setMetricas((prev) => ({
// 				...prev,
// 				simulado: resultado,
// 				grupos: resultado.grupos,
// 			}));

// 			const metricasReales = metricas.real;
// 			if (metricasReales) {
// 				setResultadosSimulacion((prev) => [
// 					...prev,
// 					{
// 						real: metricasReales,
// 						simulado: resultado,
// 						timestamp: new Date().toISOString(),
// 					},
// 				]);
// 			}
// 		} catch (error) {
// 			console.error("Error en simulación:", error);
// 		} finally {
// 			setSimulando(false);
// 		}
// 	};

// 	return (
// 		<div className="p-6">
// 			<h1 className="text-2xl font-bold mb-6">Simulador de Comandera</h1>

// 			<div className="mb-6">
// 				<Datepicker
// 					value={selectedDate}
// 					onChange={handleDateChange}
// 					useRange={false}
// 					asSingle={true}
// 					displayFormat="DD/MM/YYYY"
// 					inputClassName="w-72 px-4 py-2 border rounded"
// 				/>
// 			</div>

// 			<div className="grid grid-cols-2 gap-6 mb-6">
// 				{/* Panel de Métricas Reales */}
// 				<div className="bg-white p-4 rounded-lg shadow">
// 					<h2 className="text-xl font-semibold mb-4">Resultados Reales</h2>
// 					{metricas.real && (
// 						<div className="space-y-2">
// 							<p>Customer Success: {metricas.real.customerSuccess}%</p>
// 							<p>Tiempo Promedio: {metricas.real.tiempoPromedioEntrega} min</p>
// 							<p>Costo por Entrega: ${metricas.real.costoPorEntrega}</p>
// 							<p>Grupos Formados: {metricas.real.gruposFormados}</p>
// 							<p>Pedidos Entregados: {metricas.real.pedidosEntregados}</p>
// 						</div>
// 					)}
// 				</div>

// 				{/* Panel de Métricas Simuladas */}
// 				<div className="bg-white p-4 rounded-lg shadow">
// 					<h2 className="text-xl font-semibold mb-4">Resultados Simulados</h2>
// 					{metricas.simulado && (
// 						<div className="space-y-2">
// 							<p>Customer Success: {metricas.simulado.customerSuccess}%</p>
// 							<p>
// 								Tiempo Promedio: {metricas.simulado.tiempoPromedioEntrega} min
// 							</p>
// 							<p>Costo por Entrega: ${metricas.simulado.costoPorEntrega}</p>
// 							<p>Grupos Formados: {metricas.simulado.gruposFormados}</p>
// 							<p>Pedidos Entregados: {metricas.simulado.pedidosEntregados}</p>
// 						</div>
// 					)}
// 				</div>
// 			</div>

// 			{/* Visualización de Grupos Simulados */}
// 			{metricas.grupos && (
// 				<div className="mt-8">
// 					<h2 className="text-xl font-semibold mb-4">Grupos Simulados</h2>
// 					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
// 						{metricas.grupos.map((grupo, index) => (
// 							<div key={index} className="bg-white p-4 rounded-lg shadow">
// 								<h3 className="font-semibold mb-2">Grupo {index + 1}</h3>
// 								<div className="text-sm space-y-1">
// 									<p>Pedidos: {grupo.pedidos.length}</p>
// 									<p>Tiempo total: {grupo.tiempoTotal} min</p>
// 									<p>Distancia: {grupo.distanciaTotal} km</p>
// 									<p>Customer Success: {grupo.customerSuccess}%</p>
// 									<p>Costo promedio: ${grupo.costoPromedio}</p>
// 								</div>
// 								<div className="mt-4">
// 									<h4 className="font-medium mb-2">Pedidos:</h4>
// 									<ul className="space-y-2">
// 										{grupo.pedidos.map((pedido) => (
// 											<li key={pedido.id} className="text-sm">
// 												{pedido.direccion} - {pedido.elaborado ? "✓" : "⌛"}
// 											</li>
// 										))}
// 									</ul>
// 								</div>
// 							</div>
// 						))}
// 					</div>
// 				</div>
// 			)}

// 			{/* Gráficas Comparativas */}
// 			{resultadosSimulacion.length > 0 && (
// 				<div className="bg-white p-4 rounded-lg shadow mt-6">
// 					<h2 className="text-xl font-semibold mb-4">Comparativa Histórica</h2>
// 					<div className="h-64">
// 						<LineChart
// 							width={800}
// 							height={250}
// 							data={resultadosSimulacion.map((r) => ({
// 								timestamp: new Date(r.timestamp).toLocaleTimeString(),
// 								"Customer Success Real": r.real.customerSuccess,
// 								"Customer Success Simulado": r.simulado.customerSuccess,
// 								"Tiempo Real": r.real.tiempoPromedioEntrega,
// 								"Tiempo Simulado": r.simulado.tiempoPromedioEntrega,
// 							}))}
// 						>
// 							<CartesianGrid strokeDasharray="3 3" />
// 							<XAxis dataKey="timestamp" />
// 							<YAxis />
// 							<Tooltip />
// 							<Legend />
// 							<Line
// 								type="monotone"
// 								dataKey="Customer Success Real"
// 								stroke="#8884d8"
// 							/>
// 							<Line
// 								type="monotone"
// 								dataKey="Customer Success Simulado"
// 								stroke="#82ca9d"
// 							/>
// 							<Line type="monotone" dataKey="Tiempo Real" stroke="#ff7300" />
// 							<Line
// 								type="monotone"
// 								dataKey="Tiempo Simulado"
// 								stroke="#0088aa"
// 							/>
// 						</LineChart>
// 					</div>
// 				</div>
// 			)}

// 			<button
// 				onClick={ejecutarSimulacion}
// 				disabled={simulando || pedidosHistoricos.length === 0}
// 				className={`mt-6 px-6 py-3 rounded-lg ${
// 					simulando || pedidosHistoricos.length === 0
// 						? "bg-gray-400"
// 						: "bg-blue-500 hover:bg-blue-600"
// 				} text-white font-semibold`}
// 			>
// 				{simulando ? "Simulando..." : "Ejecutar Simulación"}
// 			</button>

// 			{pedidosHistoricos.length > 0 && (
// 				<p className="mt-4 text-sm text-gray-600">
// 					{pedidosHistoricos.length} pedidos cargados para simular
// 				</p>
// 			)}
// 		</div>
// 	);
// };
