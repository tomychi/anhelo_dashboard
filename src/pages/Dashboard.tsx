import { Chart, registerables } from "chart.js";
import { Line } from "react-chartjs-2";
import currencyFormat from "../helpers/currencyFormat";
import Calendar from "../components/Calendar";
import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import {
	calcularPromedioTiempoElaboracion,
	promedioTiempoDeEntregaTotal,
	contarPedidosDemorados,
} from "../helpers/dateToday";
import { CardInfo } from "../components/dashboard";
import {
	BrutoSVG,
	CustomerSuccessSVG,
	EntregaPromedioSVG,
	NetoSVG,
	NuevosClientesSVG,
	NuevosSeguidoresSVG,
	ProductoVendidosSVG,
	PromedioComentariosSVG,
	PromedioCompartidosSVG,
	PromedioLikesSVG,
	TicketPromedioSVG,
	TiempoCoccionSVG,
	VentasSVG,
	VisualizacionLocalSVG,
	TruckKM,
} from "../components/icons";
import { getCustomers, groupOrdersByWeek } from "../helpers/orderByweeks";
// import { AnheloIG } from '../components/instagram/AnheloIG';
import { calculateKMS } from "../helpers";
Chart.register(...registerables);

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
				boxWidth: 2,
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
	const { orders, facturacionTotal, totalProductosVendidos, neto, telefonos } =
		useSelector((state: RootState) => state.data);

	const { valueDate } = useSelector((state: RootState) => state.data);
	const startDate = new Date(valueDate?.startDate || new Date());
	const endDate = new Date(valueDate?.endDate || new Date());

	// Ejemplo de uso
	const customers = getCustomers(telefonos, orders, startDate);

	// const customerSuccess =
	// 	100 -
	// 	(orders.filter((order) => order.dislike || order.delay).length * 100) /
	// 		orders.length;

	// const token = import.meta.env.VITE_ACCESS_TOKEN_INSTAGRAM;

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

	// console.log(tipoViajes(orders));

	// Ejemplo de uso
	const { productsSoldByWeek, salesByWeek, totalRevenueByWeek } =
		groupOrdersByWeek(orders, startDate, endDate);
	const dataBurgersSemana = {
		labels: Object.keys(productsSoldByWeek),
		datasets: [
			{
				label: "PRODUCTOS VENDIDOS",
				data: Object.values(productsSoldByWeek),
				borderColor: "rgba(0, 0, 0)",
				backgroundColor: "rgba(0, 0, 0, 0.2)",
				fill: true,
			},
		],
	};
	const dataVentasSemana = {
		labels: Object.keys(salesByWeek),
		datasets: [
			{
				label: "N° DE VENTAS",
				data: Object.values(salesByWeek),
				borderColor: "rgba(0, 0, 0)",
				backgroundColor: "rgba(0, 0, 0, 0.2)",
				fill: true,
			},
		],
	};

	const dataFacturacionSemana = {
		labels: Object.keys(totalRevenueByWeek),
		datasets: [
			{
				label: "FACTURACIÓN",
				data: Object.values(totalRevenueByWeek),
				borderColor: "rgba(0, 0, 0)",
				backgroundColor: "rgba(0, 0, 0, 0.2)",
				fill: true,
			},
		],
	};

	return (
		<div className=" overflow-x-hidden font-coolvetica flex flex-col ">
			<div className="flex flex-col p-4 bg-black justify-between">
				<Calendar />
				<p className="text-white text-5xl mt-8 mb-2">Hola Tobias</p>
			</div>
			{/* Aca los cards */}
			<div className="flex flex-col  bg-gray-100 p-4 ">
				<div className="flex flex-col  shadow-2xl shadow-black   md:flex-row ">
					<CardInfo
						info={currencyFormat(facturacionTotal)}
						link={"bruto"}
						title={"Facturación bruta"}
						svgComponent={<BrutoSVG />}
					/>
					<CardInfo
						info={currencyFormat(neto)}
						link={"neto"}
						cuadrito={(neto * 100) / facturacionTotal}
						title={"Facturación neta"}
						svgComponent={<NetoSVG />}
					/>
					<CardInfo
						info={totalProductosVendidos}
						link={"productosVendidos"}
						title={"Productos vendidos"}
						svgComponent={<ProductoVendidosSVG />}
					/>
					<CardInfo
						info={orders.length}
						link={"ventas"}
						title={"Ventas delivery"}
						svgComponent={<VentasSVG />}
					/>
					<CardInfo
						info="-"
						link={"ventas"}
						title={"Ventas take away"}
						svgComponent={<VentasSVG />}
					/>
					<CardInfo
						info={`${Math.ceil(
							orders.length > 0
								? 100 - (contarPedidosDemorados(orders) * 100) / orders.length
								: 0
						)}%`}
						title={"Customer success"}
						svgComponent={<CustomerSuccessSVG />}
					/>
					<CardInfo
						info={`${Math.round(calcularPromedioTiempoElaboracion(orders))} M`}
						title={"Tiempo  coccion promedio"}
						svgComponent={<TiempoCoccionSVG />}
					/>
					<CardInfo
						info={`${Math.round(promedioTiempoDeEntregaTotal(orders))} M`}
						title={"Tiempo total promedio"}
						svgComponent={<EntregaPromedioSVG />}
					/>
					<CardInfo
						info={`${Math.round(calculateKMS(orders))} km`}
						title={"Km recorridos"}
						svgComponent={<TruckKM />}
					/>
					<CardInfo
						info={customers.newCustomers.length}
						link={"clientes"}
						title={"Nuevos clientes"}
						svgComponent={<NuevosClientesSVG />}
					/>
					<CardInfo
						info={
							orders.length > 0
								? currencyFormat(facturacionTotal / orders.length)
								: currencyFormat(0)
						}
						title={"Ticket promedio"}
						svgComponent={<TicketPromedioSVG />}
					/>
					<CardInfo
						info={0}
						title={"Visualización local"}
						svgComponent={<VisualizacionLocalSVG />}
					/>
					<CardInfo
						info={0}
						link="seguidores"
						title={"Nuevos seguidores"}
						svgComponent={<NuevosSeguidoresSVG />}
					/>
					<CardInfo
						info={0}
						title={"Promedio de likes"}
						svgComponent={<PromedioLikesSVG />}
					/>
					<CardInfo
						info={0}
						title={"Promedio de comentarios"}
						svgComponent={<PromedioComentariosSVG />}
					/>{" "}
					<CardInfo
						info={0}
						title={"Promedio de compartidos"}
						svgComponent={<PromedioCompartidosSVG />}
					/>
				</div>
			</div>

			{/* <div className="flex w-full flex-col  ">
				<div className="flex items-center   text-4xl">
					<h1 className="text-custom-red font-black   ">KPIs TRACKING</h1>
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
				<div className="flex flex-col md:grid-cols-2 md:grid   w-full  ">
					{[
						dataBurgersSemana,
						dataVentasSemana,
						// dataNuevosClientesSemana,
						// dataFollowers,
						// dataVisualizacionPaga,
						// dataVisualizacionOrganica,
						dataFacturacionSemana,
					].map((data, index) => (
						<div className="" key={index}>
							<Line data={data} options={options} plugins={[plugin]} />
						</div>
					))}
				</div>
			</div> */}
			{/* <div className="w-full flex flex-col ">
				<div className="flex items-center   text-4xl">
					<h1 className="text-custom-red font-black  uppercase ">
						zonas de influencia
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
			</div> */}
		</div>
	);
};
