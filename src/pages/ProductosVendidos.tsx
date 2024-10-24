import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import { Bar, Line } from "react-chartjs-2";

import {
	Chart,
	BarElement,
	CategoryScale,
	LinearScale,
	Title,
	Tooltip,
	Legend,
} from "chart.js";

// Registrar los componentes necesarios de Chart.js
Chart.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

// Configuración de las opciones de los gráficos
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
				boxWidth: 20,
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

// Plugin para personalizar el fondo del canvas (opcional)
const plugin = {
	id: "customCanvasBackgroundColor",
	beforeDraw: (chart: Chart) => {
		const { ctx } = chart;
		ctx.save();
		ctx.globalCompositeOperation = "destination-over";
		ctx.fillStyle = "rgba(254, 0, 0, 0.1)"; // Color de fondo con transparencia
		ctx.fillRect(0, 0, chart.width, chart.height);
		ctx.restore();
	},
};

export const ProductosVendidos = () => {
	// Obtener los estados necesarios desde Redux
	const { orders, productosPedidos, toppingsData, totalProductosVendidos } =
		useSelector((state: RootState) => state.data);
	const { materiales } = useSelector((state: RootState) => state.materials);
	const { burgers } = useSelector((state: RootState) => state.product);

	// Extraer los nombres de las hamburguesas para identificación
	const burgerNames = burgers.map((burger) => burger.data.name.toLowerCase());
	console.log("Nombres de hamburguesas:", burgerNames);

	// Calcular los diferentes tipos de pedidos utilizando useMemo para optimizar
	const {
		counts,
		percentages,
		overallPercentages,
		totalQuantityOriginals,
		totalQuantityToppings,
		totalQuantityToppingsPagos,
		sumaCostoTotal,
		hamburguesasPedidas,
		totalMedallonesNecesarios,
		totalBaconNecesario,
		totalBaconToppings,
		cantBolsitas,
		totalOrders,
	} = React.useMemo(() => {
		// Inicializar contadores para cada tipo de pedido (1 a 4 hamburguesas y 5+)
		const counts: { [key: string]: { noSides: number; withSides: number } } = {
			"1": { noSides: 0, withSides: 0 },
			"2": { noSides: 0, withSides: 0 },
			"3": { noSides: 0, withSides: 0 },
			"4": { noSides: 0, withSides: 0 },
			"5+": { noSides: 0, withSides: 0 },
		};

		console.log("Inicializando contadores de pedidos:", counts);

		// Procesar cada orden para contar los tipos de pedidos
		orders.forEach((order, index) => {
			const { detallePedido } = order;
			console.log(`Procesando orden ${index + 1}:`, order);

			// Contar el total de hamburguesas en la orden y verificar si tiene sides
			let totalBurgers = 0;
			let hasSides = false;

			detallePedido.forEach((item) => {
				const isBurger = burgerNames.includes(item.burger.toLowerCase());
				if (isBurger) {
					totalBurgers += item.quantity;
					console.log(`  - Agregado ${item.quantity} de ${item.burger}`);
				} else if (item.quantity > 0) {
					hasSides = true;
					console.log(
						`  - Orden incluye side: ${item.burger} x${item.quantity}`
					);
				}
			});

			console.log(`  - Total hamburguesas en orden: ${totalBurgers}`);
			console.log(`  - Tiene sides: ${hasSides}`);

			// Determinar la categoría basada en el número de hamburguesas
			let category = "";
			if (totalBurgers >= 1 && totalBurgers <= 4) {
				category = totalBurgers.toString();
			} else if (totalBurgers >= 5) {
				category = "5+";
			} else {
				// Si no cumple con ninguna categoría, omitir
				console.log(
					`  - Orden con ${totalBurgers} hamburguesas no contabilizada (fuera del rango 1-4 y 5+)`
				);
				return;
			}

			// Incrementar los contadores según la presencia de sides
			if (hasSides) {
				counts[category].withSides += 1;
				console.log(
					`  - Incrementando pedidos de ${category} hamburguesa(s) + sides: ${counts[category].withSides}`
				);
			} else {
				counts[category].noSides += 1;
				console.log(
					`  - Incrementando pedidos de ${category} hamburguesa(s) sin sides: ${counts[category].noSides}`
				);
			}
		});

		// Cálculos adicionales

		// 1. Total Orders
		const totalOrders = orders.length;
		console.log("Total Orders:", totalOrders);

		// 2. Total Quantity Originals
		const totalQuantityOriginals = productosPedidos.reduce(
			(total, producto) => total + producto.quantity,
			0
		);
		console.log("Total Quantity Originals:", totalQuantityOriginals);

		// 3. Total Quantity Toppings
		const totalQuantityToppings = toppingsData.reduce(
			(total, topping) => total + topping.quantity,
			0
		);
		console.log("Total Quantity Toppings:", totalQuantityToppings);

		// 4. Total Quantity Toppings Pagos
		const toppingsPagos = [
			"bacon",
			"lechuga",
			"tomate",
			"cebolla caramelizada",
			"salsa anhelo",
		];
		const ventasToppingsPagos = toppingsData.filter((topping) =>
			toppingsPagos.includes(topping.name.toLowerCase())
		);
		const totalQuantityToppingsPagos = ventasToppingsPagos.reduce(
			(total, topping) => total + topping.quantity,
			0
		);
		console.log("Total Quantity Toppings Pagos:", totalQuantityToppingsPagos);

		// 5. Suma Costo Total
		const toppingsTodos = [
			"mayonesa",
			"bacon",
			"lechuga",
			"tomate",
			"cebolla",
			"ketchup",
			"barbecue",
			"alioli",
		];
		const materialesFiltrados = materiales.filter((material) =>
			toppingsTodos.includes(material.nombre.toLowerCase())
		);
		const sumaCostoTotal = materialesFiltrados.reduce(
			(total, material) => total + material.costo,
			0
		);
		console.log("Materiales filtrados para costo total:", materialesFiltrados);
		console.log("Suma Costo Total:", sumaCostoTotal);

		// 6. Hamburguesas Pedidas
		const hamburguesasPedidas = productosPedidos.reduce((total, producto) => {
			const hamburguesa = burgers.find(
				(burger) => burger.data.name === producto.burger
			);
			if (hamburguesa) {
				return total + producto.quantity;
			} else {
				return total;
			}
		}, 0);
		console.log("Hamburguesas Pedidas:", hamburguesasPedidas);

		// 7. Total Medallones Necesarios
		const totalMedallonesNecesarios = productosPedidos.reduce(
			(total, producto) => {
				const hamburguesa = burgers.find(
					(burger) => burger.data.name === producto.burger
				);
				if (hamburguesa) {
					const cantidadMedallones =
						hamburguesa.data.ingredients.carne * producto.quantity;
					return total + cantidadMedallones;
				} else {
					return total;
				}
			},
			0
		);
		console.log("Total Medallones Necesarios:", totalMedallonesNecesarios);

		// 8. Total Bacon Toppings
		const totalBaconToppings = toppingsData.reduce((total, topping) => {
			if (topping.name.toLowerCase() === "bacon") {
				return total + topping.quantity;
			} else {
				return total;
			}
		}, 0);
		console.log("Total Bacon Toppings:", totalBaconToppings);

		// 9. Total Bacon Necesario
		const totalBaconNecesario = productosPedidos.reduce((total, producto) => {
			const hamburguesa = burgers.find(
				(burger) => burger.data.name === producto.burger
			);
			if (hamburguesa && hamburguesa.data.ingredients.bacon) {
				const cantidadBacon =
					hamburguesa.data.ingredients.bacon * producto.quantity;
				return total + cantidadBacon;
			} else {
				return total;
			}
		}, 0);
		console.log("Total Bacon Necesario:", totalBaconNecesario);

		// 10. Cantidad de Bolsitas
		const cantBolsitas = productosPedidos.reduce((total, producto) => {
			if (producto.burger.includes("Papas con Cheddar ®")) {
				return total + producto.quantity * 2;
			} else if (producto.burger.includes("Papas Anhelo ®")) {
				return total + producto.quantity * 2;
			} else if (producto.burger.includes("Satisfayer")) {
				return total;
			} else {
				return total + producto.quantity;
			}
		}, 0);
		console.log("Cantidad de Bolsitas:", cantBolsitas);

		// 11. Cálculo de Porcentajes por cada clasificación de pedidos (withSides)
		const percentages: { [key: string]: number } = {};
		Object.keys(counts).forEach((key) => {
			const noSides = counts[key].noSides;
			const withSides = counts[key].withSides;
			const total = noSides + withSides;
			const percentage = total > 0 ? (withSides / total) * 100 : 0;
			percentages[key] = parseFloat(percentage.toFixed(2)); // Limitar a 2 decimales
			console.log(
				`Porcentaje de pedidos de ${
					key === "5+" ? "5 o más" : key
				} hamburguesa(s) con sides: ${percentages[key]}%`
			);
		});

		// 12. Cálculo de Porcentajes Generales por Categoría
		const overallPercentages: { [key: string]: number } = {};
		Object.keys(counts).forEach((key) => {
			const totalPerCategory = counts[key].noSides + counts[key].withSides;
			const percentage =
				totalOrders > 0 ? (totalPerCategory / totalOrders) * 100 : 0;
			overallPercentages[key] = parseFloat(percentage.toFixed(2)); // Limitar a 2 decimales
			console.log(
				`Porcentaje general de pedidos de ${
					key === "5+" ? "5 o más" : key
				} hamburguesa(s): ${overallPercentages[key]}%`
			);
		});

		return {
			counts,
			percentages,
			overallPercentages,
			totalQuantityOriginals,
			totalQuantityToppings,
			totalQuantityToppingsPagos,
			sumaCostoTotal,
			hamburguesasPedidas,
			totalMedallonesNecesarios,
			totalBaconNecesario,
			totalBaconToppings,
			cantBolsitas,
			totalOrders,
		};
	}, [orders, burgers, productosPedidos, toppingsData, materiales]);

	// Definir los datos para los gráficos de hamburguesas
	const dataBurgers = {
		labels: productosPedidos.map((b) => b.burger),
		datasets: [
			{
				label: "BURGER BEST SELLER",
				data: productosPedidos.map((b) => b.quantity),
				backgroundColor: "rgba(0, 0, 0, 0.6)", // Color de las barras
			},
		],
	};
	console.log("Datos para gráfico de burgers:", dataBurgers);

	// Definir los datos para los gráficos de toppings
	const dataToppings = {
		labels: toppingsData.map((t) => t.name),
		datasets: [
			{
				label: "TOPPINGS SELL",
				data: toppingsData.map((t) => t.quantity),
				backgroundColor: "rgba(0, 0, 0, 0.6)", // Color de las barras
			},
		],
	};
	console.log("Datos para gráfico de toppings:", dataToppings);

	// Preparar los datos para el gráfico de medallones por minuto
	const chartData = React.useMemo(() => {
		// Objeto para realizar el seguimiento de la cantidad de medallones por minuto
		const medallonesPorMinuto: { [minuto: number]: number } = {};

		// Calcular la cantidad de medallones por minuto
		orders.forEach((order, index) => {
			const { detallePedido, hora } = order;
			detallePedido.forEach((item) => {
				const hamburguesa = burgers.find(
					(burger) => burger.data.name === item.burger
				);
				if (hamburguesa) {
					const cantidadMedallones =
						hamburguesa.data.ingredients.carne * item.quantity;
					const [hour, minute] = hora.split(":").map(Number);
					const minutos = hour * 60 + minute; // Convertir la hora a minutos
					if (!medallonesPorMinuto[minutos]) {
						medallonesPorMinuto[minutos] = 0;
					}
					medallonesPorMinuto[minutos] += cantidadMedallones;
				}
			});
		});
		console.log("Medallones por minuto:", medallonesPorMinuto);

		// Convertir los minutos en objetos Date y ordenar
		const minutosOrdenados = Object.keys(medallonesPorMinuto)
			.map(Number)
			.sort((a, b) => a - b);
		console.log("Minutos ordenados:", minutosOrdenados);

		// Convertir los minutos ordenados de nuevo a cadenas de horas
		const horasOrdenadas = minutosOrdenados.map((minutos) => {
			const hour = Math.floor(minutos / 60);
			const minute = minutos % 60;
			return `${hour.toString().padStart(2, "0")}:${minute
				.toString()
				.padStart(2, "0")}`;
		});
		console.log("Horas ordenadas:", horasOrdenadas);

		// Datos para el gráfico de línea
		const lineData = {
			labels: horasOrdenadas,
			datasets: [
				{
					label: `Medallones por minuto`,
					data: horasOrdenadas.map(
						(hora) =>
							medallonesPorMinuto[
								parseInt(hora.split(":")[0]) * 60 + parseInt(hora.split(":")[1])
							] || 0
					),
					fill: false,
					borderColor: "rgba(75, 192, 192, 0.6)",
					tension: 0.1,
				},
			],
		};
		console.log("Datos para gráfico de medallones por minuto:", lineData);

		return lineData;
	}, [orders, burgers]);

	return (
		<div className="flex p-4 gap-4 justify-between flex-col w-full">
			{/* Contadores de Pedidos */}
			<div className="flex flex-row gap-4 flex-wrap">
				{/* Iterar sobre los tipos de pedidos de 1 a 4 hamburguesas y 5+ */}
				{["1", "2", "3", "4", "5+"].map((key) => {
					const total =
						(counts[key]?.noSides || 0) + (counts[key]?.withSides || 0);
					const percentage = percentages[key] || 0;
					const overallPercentage = overallPercentages[key] || 0;
					const labelBurgers =
						key === "1" ? "una" : key === "5+" ? "5 o más" : key;
					const plural = key !== "1" && key !== "5+";

					return (
						<div
							className="flex flex-col bg-gray-300 rounded-lg p-4 w-48"
							key={key}
						>
							{/* Pedidos de {key} hamburguesas */}
							<div className="mb-2 font-semibold">
								Pedidos de {labelBurgers} hamburguesa
								{plural ? "s" : ""}: {total}
							</div>
							{/* Pedidos de {key} hamburguesas + sides */}
							<div>
								Pedidos de {labelBurgers} hamburguesa
								{plural ? "s" : ""} + sides: {counts[key]?.withSides || 0} (
								{percentage}%)
							</div>
							{/* Porcentaje General de la Categoría */}
							<div className="mt-2 text-sm">
								Porcentaje de todos los pedidos: {overallPercentage}%
							</div>
						</div>
					);
				})}
			</div>

			{/* Información Adicional */}
			<div
				className="flex items-center p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400"
				role="alert"
			>
				<svg
					className="flex-shrink-0 inline w-4 h-4 me-3"
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					fill="currentColor"
					viewBox="0 0 20 20"
				>
					<path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
				</svg>
				<span className="sr-only">Info</span>
				<div>
					<span className="font-medium">Info alert!</span> Se vendieron{" "}
					{hamburguesasPedidas} hamburguesas
					<br />
					Toppings totales: {totalQuantityToppings}. Costo ${sumaCostoTotal}
					<br />
					Toppings pagos: {totalQuantityToppingsPagos}. Bruto $
					{totalQuantityToppingsPagos * 300}
					<br />
					Un promedio de{" "}
					{Math.ceil((totalQuantityToppings / totalQuantityOriginals) * 100) /
						100}{" "}
					toppings por compra
					<br />
					Medallones: {totalMedallonesNecesarios}
					<br />
					Carne: {(totalMedallonesNecesarios * 90) / 1000} KG
					<br />
					Bacon: {totalBaconNecesario + totalBaconToppings} fetas
					<br />
					Bacon: {((totalBaconNecesario + totalBaconToppings) * 20) / 1000} KG
					<br />
					Bolsitas de papas: {cantBolsitas}
					<br />
					Papas: {(cantBolsitas * 120) / 1000} KG
				</div>
			</div>

			{/* Información Adicional 2 */}
			<div
				className="flex items-center p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400"
				role="alert"
			>
				<svg
					className="flex-shrink-0 inline w-4 h-4 me-3"
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					fill="currentColor"
					viewBox="0 0 20 20"
				>
					<path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
				</svg>
				<span className="sr-only">Info</span>
				<div>
					<span className="font-medium">Info alert!</span> Se vendieron{" "}
					{totalProductosVendidos} productos
				</div>
			</div>

			{/* Gráficos */}
			<div className="grid-cols-1 grid gap-2 w-full">
				{/* Gráfico de Medallones por Minuto */}
				<Line data={chartData} />

				{/* Gráficos de Barras para Burgers y Toppings */}
				{[dataBurgers, dataToppings].map((data, index) => (
					<div className="" key={index}>
						<Bar data={data} options={options} plugins={[plugin]} />
					</div>
				))}
			</div>
		</div>
	);
};
