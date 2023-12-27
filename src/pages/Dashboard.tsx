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
				{/* Recuadros rojos con el mismo tamaño y ancho completo */}
				<div className="flex-1 bg-custom-red h-16 flex flex-col justify-center items-center text-white">
					<p className="text-lg font-black font-antonio text-black">1234</p>
					<p className="text-sm font-antonio text-black">Facturacion</p>
				</div>
				<div className="flex-1 bg-custom-red h-16 flex flex-col justify-center items-center text-white">
					<p className="text-lg font-antonio text-black">5678</p>
					<p className="text-sm font-antonio text-black">Items sales</p>
				</div>
				<div className="flex-1 bg-custom-red h-16 flex flex-col justify-center items-center text-white">
					<p className="text-lg  font-antonio text-black">91011</p>
					<p className="text-sm font-antonio text-black">N° de ventas</p>
				</div>
				<div className="flex-1 bg-custom-red h-16 flex flex-col justify-center items-center text-white">
					<p className="text-lg  font-antonio text-black">121314</p>
					<p className="text-sm font-antonio text-black">New clients</p>
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
