import React from "react";
import info from "../assets/combined_addresses.json";
import { Chart, registerables } from "chart.js";
import { Bar, Line } from "react-chartjs-2";

Chart.register(...registerables);

const hamburguesasVendidas = {};
const toppingsVendidos = {};
const extrasVendidos = {};

const palabrasClaveToppings = [
	"- bacon",
	"- cebolla caramelizada",
	"- crispy",
	"- ketchup",
	"- lechuga",
	"- mayonesa",
	"- salsa anhelo",
	"- salsa barbecue",
	"- tomate",
];

const palabrasClaveBurgers = [
	"anhelo classic",
	"bbq bcn cheeseburger",
	"bcn cheeseburger",
	"crispy bcn",
	"cuadruple cheeseburger",
	"doble cheeseburger",
	"easter egg",
	"mario inspired",
	"simple cheeseburger",
	"triple cheeseburger",
];

const palabrasClaveExtras = [
	"papas anhelo ®",
	"papas con cheddar ®",
	"pepsi",
	"pote de cheddar",
	"pote de mayonesa",
	"pote de salsa anhelo",
];

info.forEach((pedido) => {
	const pedidos = pedido.pedido.split("\n");
	pedidos.forEach((elemento) => {
		const [nombre, cantidad] = elemento.split("x ").reverse();
		const cleanNombre = nombre.toLowerCase().trim();
		const nombreMayusculas = cleanNombre.toUpperCase();

		if (palabrasClaveBurgers.includes(cleanNombre)) {
			hamburguesasVendidas[nombreMayusculas] =
				(hamburguesasVendidas[nombreMayusculas] || 0) + parseInt(cantidad, 10);
		}

		palabrasClaveToppings.forEach((topping) => {
			const toppingMayusculas = topping.toUpperCase();
			if (cleanNombre.includes(topping)) {
				toppingsVendidos[toppingMayusculas] =
					(toppingsVendidos[toppingMayusculas] || 0) + 1;
			}
		});

		palabrasClaveExtras.forEach((extra) => {
			const extraMayusculas = extra.toUpperCase();
			if (cleanNombre.includes(extra)) {
				extrasVendidos[extraMayusculas] =
					(extrasVendidos[extraMayusculas] || 0) + 1;
			}
		});
	});
});

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
			label: "BURGERS VENDIDAS",
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
	beforeDraw: (chart, args, options) => {
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
			position: "top",
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
	const nombresHamburguesas = Object.keys(hamburguesasVendidas);
	const cantidadesHamburguesas = Object.values(hamburguesasVendidas);

	const nombresToppings = Object.keys(toppingsVendidos);
	const cantidadToppings = Object.values(toppingsVendidos);

	const nombresExtras = Object.keys(extrasVendidos);
	const cantidadExtras = Object.values(extrasVendidos);

	const dataBurgers = {
		labels: nombresHamburguesas,
		datasets: [
			{
				label: "BURGER BEST SELLER",
				data: cantidadesHamburguesas,
				backgroundColor: "rgba(0, 0, 0)",
			},
		],
	};

	const dataToppings = {
		labels: nombresToppings,
		datasets: [
			{
				label: "TOPPING BEST SELLER",
				data: cantidadToppings,
				backgroundColor: "rgba(0, 0, 0)",
			},
		],
	};

	const dataExtras = {
		labels: nombresExtras,
		datasets: [
			{
				label: "EXTRA BEST SELLER",
				data: cantidadExtras,
				backgroundColor: "rgba(0, 0, 0)",
			},
		],
	};

	return (
		<div className="p-4 flex flex-col gap-4">
			<div className="flex flex-row gap-4">
				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-1">
						<p>x1,98</p>
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
					<p className=" text-4xl font-bold mt-auto">$4.320.210</p>
					<p className="text-sm mt-auto">FACTURACIÓN</p>
				</div>
				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-1">
						<p>57%</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="w-6 h-6"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl font-bold mt-auto">$1.638.195</p>
					<p className="text-sm mt-auto">GANANCIA</p>
				</div>
			</div>

			<div className="flex flex-row gap-4">
				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-1">
						<p>x1,87</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="w-6 h-6"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl font-bold mt-auto">1.320</p>
					<p className="text-sm mt-auto">PRODUCTOS VENDIDOS</p>
				</div>
				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-1">
						<p>+5%</p>
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
					<p className=" text-4xl font-bold mt-auto">182</p>
					<p className="text-sm mt-auto">VENTAS</p>
				</div>
				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-1">
						<p>+14</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="w-6 h-6"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl font-bold mt-auto">2.518</p>
					<p className="text-sm mt-auto">CLIENTES</p>
				</div>
			</div>
			<div>
				<h1 className="text-custom-red uppercase font-black font-antonio text-2xl mb-4">
					Product data
				</h1>
				<div className="grid grid-cols-4 gap-4 grid-rows-1">
					<div className="col-span-1 row-span-1">
						<Bar data={dataBurgers} options={options} plugins={[plugin]} />
					</div>
					<div className="col-span-1 row-span-1">
						<Bar data={dataToppings} options={options} plugins={[plugin]} />
					</div>
					<div className="col-span-1 row-span-1">
						<Bar data={dataExtras} options={options} plugins={[plugin]} />
					</div>
				</div>
			</div>
			<div>
				<h1 className="text-custom-red  font-black font-antonio text-2xl mb-4">
					BUSINESS KPIs
				</h1>
				<div className="grid grid-cols-4 gap-4 grid-rows-1">
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
					<div className="col-span-1 row-span-1">
						<Line
							data={dataFacturacionSemana}
							options={options}
							plugins={[plugin]}
						/>
					</div>
				</div>
			</div>
			<div>
				<h1 className="text-custom-red  font-black font-antonio text-2xl mb-4">
					INSTAGRAM KPIs
				</h1>
				<div className="grid grid-cols-4 gap-4 grid-rows-1">
					<div className="col-span-1 row-span-1">
						<Bar data={dataBurgers} options={options} plugins={[plugin]} />
					</div>
					<div className="col-span-1 row-span-1">
						<Bar data={dataToppings} options={options} plugins={[plugin]} />
					</div>
					<div className="col-span-1 row-span-1">
						<Bar data={dataExtras} options={options} plugins={[plugin]} />
					</div>
				</div>
			</div>
		</div>
	);
};
