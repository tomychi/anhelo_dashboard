import { useEffect, useState } from "react";
import info from "../assets/combined_addresses.json";
import { Chart, registerables } from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { PedidoProps } from "../types/types";
import currencyFormat from "../helpers/currencyFormat";
import { ReadDataForDateRange } from "../firebase/ReadData";
import { ExpenseProps } from "../firebase/UploadGasto";

Chart.register(...registerables);

const fechas = [
	"30/7/2023",
	"6/8/2023",
	"13/8/2023",
	"20/8/2023",
	"27/8/2023",
	"3/9/2023",
	"10/9/2023",
	"17/9/2023",
	"24/9/2023",
	"1/10/2023",
	"8/10/2023",
	"15/10/2023",
	"22/10/2023",
	"29/10/2023",
	"5/11/2023",
	"12/11/2023",
	"19/11/2023",
	"26/11/2023",
	"3/12/2023",
	"10/12/2023",
	"17/12/2023",
];

const fechasFacturacion = [
	"8/10/2023",
	"15/10/2023",
	"22/10/2023",
	"29/10/2023",
	"5/11/2023",
	"12/11/2023",
	"19/11/2023",
	"26/11/2023",
	"3/12/2023",
	"10/12/2023",
	"17/12/2023",
];

const cantidadesBurgers = [
	0, 100, 55, 54, 78, 91, 104, 132, 97, 100, 105, 102, 126, 175, 188, 226, 215,
	278, 316, 307, 324,
];

const cantidadesVentas = [
	0, 22, 17, 18, 30, 35, 43, 55, 46, 45, 53, 43, 59, 84, 90, 106, 91, 116, 151,
	139, 136,
];

const facturacion = [
	295750, 236010, 348440, 482710, 697340, 584980, 642400, 858990, 1020070,
	971390, 1116610,
];

const dataBurgersSemana = {
	labels: fechas,
	datasets: [
		{
			label: "PRODUCTOS VENDIDOS",
			data: cantidadesBurgers,
			borderColor: "rgba(0, 0, 0)",
			backgroundColor: "rgba(0, 0, 0, 0.2)",
			fill: true,
		},
	],
};

const dataFacturacionSemana = {
	labels: fechasFacturacion,
	datasets: [
		{
			label: "FACTURACIÓN",
			data: facturacion,
			borderColor: "rgba(0, 0, 0)",
			backgroundColor: "rgba(0, 0, 0, 0.2)",
			fill: true,
		},
	],
};

const dataVentasSemana = {
	labels: fechas,
	datasets: [
		{
			label: "N° DE VENTAS",
			data: cantidadesVentas,
			borderColor: "rgba(0, 0, 0)",
			backgroundColor: "rgba(0, 0, 0, 0.2)",
			fill: true,
		},
	],
};

const plugin = {
	id: "customCanvasBackgroundColor",
	beforeDraw: (chart: Chart) => {
		const { ctx } = chart;
		ctx.save();
		ctx.globalCompositeOperation = "destination-over";
		ctx.fillStyle = "rgba(254, 0, 0)";
		ctx.fillRect(0, 0, chart.width, chart.height);
		ctx.restore();
	},
};

const options = {
	responsive: true,
	plugins: {
		legend: {
			position: "top" as const,
			display: true,
			labels: {
				color: "rgb(0, 0, 0)",
				font: {
					family: "Antonio",
				},
				boxWidth: 0,
			},
		},
		title: {
			display: false,
		},
	},
	scales: {
		y: {
			beginAtZero: true,
			ticks: {
				color: "rgb(0, 0, 0)",
				font: {
					family: "Antonio",
				},
			},
		},
		x: {
			ticks: {
				color: "rgb(0, 0, 0)",
				font: {
					family: "Antonio",
				},
			},
		},
	},
};

export const Dashboard = () => {
	const [selectedInterval, setSelectedInterval] = useState("weekly");
	const [ordersData, setOrdersData] = useState<PedidoProps[]>([]);
	const [expenseData, setExpenseData] = useState<ExpenseProps[]>([]);
	const [hamburguesasPedidas, setHamburguesasPedidas] = useState<
		BurgersPedidas[]
	>([]);
	const [facturacionTotal, setFacturacionTotal] = useState<number>(0);
	const [gastosTotal, setGastosTotal] = useState<number>(0);
	const [productosVendidosTotal, setProductosVendidosTotal] =
		useState<number>(0);

	const handleIntervalChange = (interval: string) => {
		setSelectedInterval(interval);
	};
	const dataBurgers = {
		labels: hamburguesasPedidas.map((b) => b.burger),
		datasets: [
			{
				label: "BURGER BEST SELLER",
				data: hamburguesasPedidas.map((q) => q.quantity),
				backgroundColor: "rgba(0, 0, 0)",
			},
		],
	};

	// const dataToppings = {
	//   labels: nombresToppings,
	//   datasets: [
	//     {
	//       label: 'TOPPING BEST SELLER',
	//       data: cantidadToppings,
	//       backgroundColor: 'rgba(0, 0, 0)',
	//     },
	//   ],
	// };

	// const dataExtras = {
	//   labels: nombresExtras,
	//   datasets: [
	//     {
	//       label: 'EXTRA BEST SELLER',
	//       data: cantidadExtras,
	//       backgroundColor: 'rgba(0, 0, 0)',
	//     },
	//   ],
	// };

	const getOrdersData = () => {
		// ReadOrdersForDate('2024', '01', '31', (pedidos) => {
		//   console.log('Pedidos para el 31 de enero de 2024:', pedidos);
		//   setOrdersData(pedidos);
		// });

		ReadDataForDateRange<PedidoProps>(
			"pedidos",
			"2024",
			"2",
			"1",
			"2024",
			"2",
			"5",
			(pedidos) => {
				setOrdersData(pedidos);
			}
		);

		ReadDataForDateRange<ExpenseProps>(
			"gastos",
			"2024",
			"2",
			"1",
			"2024",
			"2",
			"5",
			(gastos) => {
				setExpenseData(gastos);
			}
		);
	};

	useEffect(() => {
		getOrdersData();
	}, []); // Array de dependencias vacío para que se ejecute una vez al montar el componente

	useEffect(() => {
		const {
			totalFacturacion: facturacionTotal,
			totalProductosVendidos: productosVendidosTotal,
			hamburguesasPedidas,
		} = calcularTotales(ordersData);
		const { totalFacturacion: gastosTotal } = calcularTotales(expenseData);

		setFacturacionTotal(facturacionTotal);
		setProductosVendidosTotal(productosVendidosTotal);
		setGastosTotal(gastosTotal);
		setHamburguesasPedidas(hamburguesasPedidas);
	}, [ordersData, expenseData]); // Dependencias que deben provocar la ejecución del efecto

	return (
		<div className="p-4 flex flex-col gap-4">
			<div className="flex items-center">
				<div className="relative inline-block">
					<select
						value={selectedInterval}
						onChange={(e) => handleIntervalChange(e.target.value)}
						className="text-custom-red  bg-black p-4 text-4xl font-black font-antonio focus:outline-none "
					>
						<option value="daily" className="bg-black text-2xl">
							DAILY KPIs
						</option>
						<option value="weekly" className="bg-black text-2xl">
							WEEKLY KPIs
						</option>
						<option value="monthly" className="bg-black text-2xl">
							MONTHLY KPIs
						</option>
						<option value="all" className="bg-black text-2xl">
							ALL-TIME KPIs
						</option>
					</select>
				</div>
			</div>
			<div className="flex flex-row gap-4">
				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>x1,15</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="1.5"
								stroke="currentColor"
								className="w-6 h-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl font-bold mt-auto">
						{currencyFormat(facturacionTotal)}
					</p>
					<p className="text-sm mt-auto">FACTURACIÓN BRUTA</p>
				</div>

				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						{Math.ceil(
							(((facturacionTotal - gastosTotal) / 2.2) * 100) /
								facturacionTotal
						)}
						%
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="1.5"
								stroke="currentColor"
								className="w-6 h-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl font-bold mt-auto">
						{currencyFormat(Math.ceil((facturacionTotal - gastosTotal) / 2.2))}
					</p>
					<p className="text-sm mt-auto"> FACTURACION NETA *Estimado</p>
				</div>
			</div>

			<div className="flex flex-row gap-4">
				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>+31</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="1.5"
								stroke="currentColor"
								className="w-6 h-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl font-bold mt-auto">
						{productosVendidosTotal}
					</p>
					<p className="text-sm mt-auto">PRODUCTOS VENDIDOS</p>
				</div>
				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>-3</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="1.5"
								stroke="currentColor"
								className="w-6 h-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl font-bold mt-auto">{ordersData.length}</p>
					<p className="text-sm mt-auto">VENTAS</p>
				</div>
				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>+14</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="1.5"
								stroke="currentColor"
								className="w-6 h-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl font-bold mt-auto">24</p>
					<p className="text-sm mt-auto">NUEVOS CLIENTES</p>
				</div>
			</div>

			<div className="flex flex-row gap-4">
				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>+2.270</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="1.5"
								stroke="currentColor"
								className="w-6 h-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl font-bold mt-auto">38.537</p>
					<p className="text-sm mt-auto">VISUALIZACIÓN LOCAL</p>
				</div>
				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>-73</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="1.5"
								stroke="currentColor"
								className="w-6 h-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl font-bold mt-auto">203</p>
					<p className="text-sm mt-auto">NUEVOS SEGUIDORES</p>
				</div>
				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>-45</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="1.5"
								stroke="currentColor"
								className="w-6 h-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl font-bold mt-auto">83</p>
					<p className="text-sm mt-auto">PROMEDIO DE LIKES</p>
				</div>
				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>+6</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="1.5"
								stroke="currentColor"
								className="w-6 h-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl font-bold mt-auto">13</p>
					<p className="text-sm mt-auto">PROMEDIO DE COMENTARIOS</p>
				</div>
				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>+37</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="1.5"
								stroke="currentColor"
								className="w-6 h-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl font-bold mt-auto">128</p>
					<p className="text-sm mt-auto">PROMEDIO DE COMPARTIDOS</p>
				</div>
			</div>

			<div className="flex flex-col gap-4">
				<div className="">
					<div className="flex items-center mb-4 p-4 text-4xl ">
						<h1 className="text-custom-red font-black font-antonio  ">
							PRODUCT CHARTS
						</h1>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth="5"
							stroke="currentColor"
							className="font-black w-4 ml-2 mt-5 text-custom-red"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="m4.5 4.5 15 15m0 0V8.25m0 11.25H8.25"
							/>
						</svg>
					</div>
					<div className="">
						<div className="">
							<Bar data={dataBurgers} options={options} plugins={[plugin]} />
						</div>
						<div className="col-span-1 row-span-1">
							{/* <Bar data={dataToppings} options={options} plugins={[plugin]} /> */}
						</div>
						<div className="col-span-1 row-span-1">
							{/* <Bar data={dataExtras} options={options} plugins={[plugin]} /> */}
						</div>
					</div>
				</div>
				<div>
					<div className="flex items-center p-4 mb-4 text-4xl">
						<h1 className="text-custom-red font-black font-antonio  ">
							KPIs TRACKING
						</h1>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth="5"
							stroke="currentColor"
							className="font-black w-4 ml-2 mt-5 text-custom-red"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="m4.5 4.5 15 15m0 0V8.25m0 11.25H8.25"
							/>
						</svg>
					</div>
					<div className="grid grid-cols-4 gap-4 grid-rows-1">
						<div className="col-span-1 row-span-1">
							<Line
								data={dataFacturacionSemana}
								options={options}
								plugins={[plugin]}
							/>
						</div>
						<div className="col-span-1 row-span-1">
							<Line
								data={dataBurgersSemana}
								options={options}
								plugins={[plugin]}
							/>
						</div>
						<div className="col-span-1 row-span-1">
							<Line
								data={dataVentasSemana}
								options={options}
								plugins={[plugin]}
							/>
						</div>
						<div className="col-span-1 row-span-1">
							<Line
								data={dataFacturacionSemana}
								options={options}
								plugins={[plugin]}
							/>
						</div>
						<div className="col-span-1 row-span-1">
							<Line
								data={dataFacturacionSemana}
								options={options}
								plugins={[plugin]}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
