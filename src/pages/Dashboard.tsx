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
} from "../components/icons";
import { getNewCustomers, groupOrdersByWeek } from "../helpers/orderByweeks";
// import { AnheloIG } from '../components/instagram/AnheloIG';

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
	const newCustomers = getNewCustomers(telefonos, orders, startDate);

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
		<div className="p-4 overflow-x-hidden flex flex-col gap-4">
			<Calendar />
			{/* <AnheloIG /> */}
			<div className="flex flex-col md:flex-row gap-4">
				<CardInfo
					info={currencyFormat(facturacionTotal)}
					link={"bruto"}
					title={"FACTURACIÓN BRUTA"}
					svgComponent={<BrutoSVG />}
				/>

				<CardInfo
					info={currencyFormat(neto)}
					link={"neto"}
					cuadrito={(neto * 100) / facturacionTotal}
					title={"FACTURACION NETA *Estimado"}
					svgComponent={<NetoSVG />}
				/>
			</div>

			<div className="flex flex-col md:flex-row gap-4">
				<CardInfo
					info={totalProductosVendidos}
					link={"productosVendidos"}
					title={"PRODUCTOS VENDIDOS"}
					svgComponent={<ProductoVendidosSVG />}
				/>
				<CardInfo
					info={orders.length}
					link={"ventas"}
					title={"VENTAS"}
					svgComponent={<VentasSVG />}
				/>
			</div>
			<div className="flex flex-col md:flex-row gap-4">
				<CardInfo
					info={`${Math.ceil(
						100 - (contarPedidosDemorados(orders) * 100) / orders.length
					)}%`}
					title={"CLIENTES ATENDIDOS EXITOSAMENTE"}
					svgComponent={<CustomerSuccessSVG />}
				/>
				<CardInfo
					info={`${Math.round(calcularPromedioTiempoElaboracion(orders))} M`}
					title={"TIEMPO DE COCCIÓN PROMEDIO"}
					svgComponent={<TiempoCoccionSVG />}
				/>

				<CardInfo
					info={`${Math.round(promedioTiempoDeEntregaTotal(orders))} M`}
					title={"TIEMPO DE ENTREGA TOTAL PROMEDIO"}
					svgComponent={<EntregaPromedioSVG />}
				/>
			</div>
			<div className="flex flex-col md:flex-row gap-4">
				<CardInfo
					info={newCustomers.length}
					link={"clientes"}
					title={"NUEVOS CLIENTES"}
					svgComponent={<NuevosClientesSVG />}
				/>

				<CardInfo
					info={currencyFormat((200000 + 180000 + 180000) / orders.length)}
					title={"COSTO DE ADQUISICION DE CLIENTES"}
					svgComponent={<TicketPromedioSVG />}
				/>
				<CardInfo
					info={currencyFormat(facturacionTotal / orders.length)}
					title={"TICKET PROMEDIO"}
					svgComponent={<TicketPromedioSVG />}
				/>
			</div>

			<div className="flex flex-col md:flex-row  gap-4">
				<CardInfo
					info={0}
					title={"VISUALIZACIÓN LOCAL"}
					svgComponent={<VisualizacionLocalSVG />}
				/>
				<CardInfo
					info={0}
					link="seguidores"
					title={"NUEVOS SEGUIDORES"}
					svgComponent={<NuevosSeguidoresSVG />}
				/>
				<CardInfo
					info={0}
					title={"PROMEDIO DE LIKES"}
					svgComponent={<PromedioLikesSVG />}
				/>
				<CardInfo
					info={0}
					title={"PROMEDIO DE COMENTARIOS"}
					svgComponent={<PromedioComentariosSVG />}
				/>{" "}
				<CardInfo
					info={0}
					title={"PROMEDIO DE COMPARTIDOS"}
					svgComponent={<PromedioCompartidosSVG />}
				/>
			</div>

			<div className="flex w-full flex-col gap-4 ">
				<div className="flex items-center   text-4xl">
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
				<div className="flex flex-col md:grid-cols-2 md:grid gap-4  w-full  ">
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
			</div>
			<div className="w-full flex flex-col gap-4">
				<div className="flex items-center   text-4xl">
					<h1 className="text-custom-red font-black font-antonio uppercase ">
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
			</div>
		</div>
	);
};
