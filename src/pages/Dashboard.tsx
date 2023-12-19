import { Chart, registerables } from "chart.js";
import info from "../assets/combined_addresses.json";
import { Bar } from "react-chartjs-2";

Chart.register(...registerables);

const hamburguesasVendidas = {};

const toppingsVendidos = {};

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

const palabrasClave = [
	"anhelo classic",
	"bbq bcn cheeseburger",
	"bcn cheeseburger",
	"crispy bcn",
	"cuadruple cheeseburger",
	"doble cheeseburger",
	"easter egg",
	"mario inspired",
	"papas anhelo ®",
	"papas con cheddar ®",
	"pepsi",
	"pote de cheddar",
	"pote de mayonesa",
	"pote de salsa anhelo",
	"simple cheeseburger",
	"triple cheeseburger",
];

info.forEach((pedido) => {
	const pedidos = pedido.pedido.split("\n");
	pedidos.forEach((elemento) => {
		const [nombre, cantidad] = elemento.split("x ").reverse();
		const cleanNombre = nombre.toLowerCase().trim();

		// Convertir a mayúsculas
		const nombreMayusculas = cleanNombre.toUpperCase();

		if (palabrasClave.includes(cleanNombre)) {
			hamburguesasVendidas[nombreMayusculas] =
				(hamburguesasVendidas[nombreMayusculas] || 0) + parseInt(cantidad, 10);
		}

		palabrasClaveToppings.forEach((topping) => {
			// Convertir a mayúsculas
			const toppingMayusculas = topping.toUpperCase();

			if (cleanNombre.includes(topping)) {
				toppingsVendidos[toppingMayusculas] =
					(toppingsVendidos[toppingMayusculas] || 0) + 1;
			}
		});
	});
});

export const Dashboard = () => {
	const nombresHamburguesas = Object.keys(hamburguesasVendidas);
	const cantidadesHamburguesas = Object.values(hamburguesasVendidas);

	const nombresToppings = Object.keys(toppingsVendidos);
	const cantidadToppings = Object.values(toppingsVendidos);

	const dataBurgers = {
		labels: nombresHamburguesas,
		datasets: [
			{
				label: "BURGER BEST SELLER",
				data: cantidadesHamburguesas,
				backgroundColor: "rgba(0, 0 ,0)", // Color para las barras
			},
		],
	};

	const dataToppings = {
		labels: nombresToppings,
		datasets: [
			{
				label: "TOPPING BEST SELLER",
				data: cantidadToppings,
				backgroundColor: "rgba(0, 0 ,0)", // Color para las barras
			},
		],
	};

	const plugin = {
		id: "customCanvasBackgroundColor",
		beforeDraw: (chart, args, options) => {
			const { ctx } = chart;
			ctx.save();
			ctx.globalCompositeOperation = "destination-over";
			ctx.fillStyle = "rgba(254, 0, 0)"; // Fondo rojo
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
					boxWidth: 0, // Establecer el ancho de la caja de la leyenda a 0 para eliminar el rectángulo
				},
			},
			title: {
				display: false,
				// text: "ANHELO PRODUCTS ®",
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
		<div className=" p-4 gap-4 grid grid-cols-2 grid-rows-2">
			<div className="col-span-1 row-span-1">
				<Bar data={dataBurgers} options={options} plugins={[plugin]} />
			</div>
			<div className="col-span-1 row-span-1">
				<Bar data={dataToppings} options={options} plugins={[plugin]} />
			</div>
		</div>
	);
};
