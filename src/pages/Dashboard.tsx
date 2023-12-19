import { Chart, registerables } from "chart.js";
import info from "../assets/combined_addresses.json";
import { Bar } from "react-chartjs-2";

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

export const Dashboard = () => {
	const nombresHamburguesas = Object.keys(hamburguesasVendidas);
	const cantidadesHamburguesas = Object.values(hamburguesasVendidas);

	const nombresToppings = Object.keys(toppingsVendidos);
	const cantidadToppings = Object.values(toppingsVendidos);

	const nombresExtras = Object.keys(extrasVendidos); // Nuevos nombres y cantidades para extras
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
		// Nuevo objeto de datos para extras
		labels: nombresExtras,
		datasets: [
			{
				label: "EXTRA BEST SELLER",
				data: cantidadExtras,
				backgroundColor: "rgba(0, 0, 0)",
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

	return (
		<div className="p-4 flex flex-col gap-4">
			<div>
				<h1 className="text-custom-red uppercase font-black font-antonio text-2xl mb-4">
					Product data
				</h1>
				<div className="grid grid-cols-4 grid-rows-1">
					{" "}
					{/* Cambiado a 3 columnas para el nuevo gráfico */}
					<div className="col-span-1 row-span-1">
						<Bar data={dataBurgers} options={options} plugins={[plugin]} />
					</div>
					<div className="col-span-1 row-span-1">
						<Bar data={dataToppings} options={options} plugins={[plugin]} />
					</div>
					<div className="col-span-1 row-span-1">
						<Bar data={dataExtras} options={options} plugins={[plugin]} />{" "}
						{/* Nuevo gráfico para extras */}
					</div>
				</div>
			</div>
			<div>
				<h1 className="text-custom-red  font-black font-antonio text-2xl mb-4">
					BUSINESS KPIs
				</h1>
				<div className="grid grid-cols-4 grid-rows-1">
					{" "}
					{/* Cambiado a 3 columnas para el nuevo gráfico */}
					<div className="col-span-1 row-span-1">
						<Bar data={dataBurgers} options={options} plugins={[plugin]} />
					</div>
					<div className="col-span-1 row-span-1">
						<Bar data={dataToppings} options={options} plugins={[plugin]} />
					</div>
					<div className="col-span-1 row-span-1">
						<Bar data={dataExtras} options={options} plugins={[plugin]} />{" "}
						{/* Nuevo gráfico para extras */}
					</div>
				</div>
			</div>
			<div>
				<h1 className="text-custom-red  font-black font-antonio text-2xl mb-4">
					SM KPIs
				</h1>
				<div className="grid grid-cols-4 grid-rows-1">
					{" "}
					{/* Cambiado a 3 columnas para el nuevo gráfico */}
					<div className="col-span-1 row-span-1">
						<Bar data={dataBurgers} options={options} plugins={[plugin]} />
					</div>
					<div className="col-span-1 row-span-1">
						<Bar data={dataToppings} options={options} plugins={[plugin]} />
					</div>
					<div className="col-span-1 row-span-1">
						<Bar data={dataExtras} options={options} plugins={[plugin]} />{" "}
						{/* Nuevo gráfico para extras */}
					</div>
				</div>
			</div>
		</div>
	);
};
