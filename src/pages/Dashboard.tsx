import { Chart, registerables } from "chart.js";
import { Line } from "react-chartjs-2";
import currencyFormat from "../helpers/currencyFormat";
import { NavLink } from "react-router-dom";
import Calendar from "../components/Calendar";
import { MapStats } from "./MapStats";
import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";

Chart.register(...registerables);

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

const cantidadesVentas = [
	0, 22, 17, 18, 30, 35, 43, 55, 46, 45, 53, 43, 59, 84, 90, 106, 91, 116, 151,
	139, 136,
];

const facturacion = [
	295750, 236010, 348440, 482710, 697340, 584980, 642400, 858990, 1020070,
	971390, 1116610,
];

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
	const { orders, facturacionTotal, totalProductosVendidos, neto, valueDate } =
		useSelector((state: RootState) => state.data);

	const fechas = orders.map((o) => o.fecha);

	// const token = import.meta.env.VITE_ACCESS_TOKEN_INSTAGRAM;

	// const url = `https://graph.instagram.com/me?fields=id,username&access_token=${token}`;

	// fetch(url)
	//   .then((res) => res.json())
	//   .then((data) => {
	//     console.log(data.data);
	//   })
	//   .catch((err) => {
	//     console.log('err', err);
	//   });

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

	const cantidadesBurgers = [
		0, 100, 55, 54, 78, 91, 104, 132, 97, 100, 105, 102, 126, 175, 188, 226,
		215, 278, 316, 307, 324,
	];

	console.log(valueDate?.endDate?.toString().replaceAll("-", "/"));
	console.log(valueDate?.startDate?.toString().replaceAll("-", "/"));

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

	return (
		<div className="p-4 overflow-x-hidden flex flex-col gap-4">
			<Calendar />
			<div className="flex flex-col md:flex-row gap-4">
				<NavLink
					to={"/bruto"}
					className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative"
				>
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>x1,15</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="w-6 h-6"
							>
								<path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
								<path
									fillRule="evenodd"
									d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z"
									clipRule="evenodd"
								/>
								<path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl pt-8 pb-4 font-bold mt-auto">
						{currencyFormat(facturacionTotal)}
					</p>
					<p className="text-sm mt-auto">FACTURACIÓN BRUTA</p>
				</NavLink>

				<NavLink
					to={"/neto"}
					className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative"
				>
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						{Math.ceil((neto * 100) / facturacionTotal)}%
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="w-6 h-6"
							>
								<path d="M21 6.375c0 2.692-4.03 4.875-9 4.875S3 9.067 3 6.375 7.03 1.5 12 1.5s9 2.183 9 4.875Z" />
								<path d="M12 12.75c2.685 0 5.19-.586 7.078-1.609a8.283 8.283 0 0 0 1.897-1.384c.016.121.025.244.025.368C21 12.817 16.97 15 12 15s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.285 8.285 0 0 0 1.897 1.384C6.809 12.164 9.315 12.75 12 12.75Z" />
								<path d="M12 16.5c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 0 0 1.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 0 0 1.897 1.384C6.809 15.914 9.315 16.5 12 16.5Z" />
								<path d="M12 20.25c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 0 0 1.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 0 0 1.897 1.384C6.809 19.664 9.315 20.25 12 20.25Z" />
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl pt-8 pb-4 font-bold mt-auto">
						{neto ? currencyFormat(neto) : 0}
					</p>
					<p className="text-sm mt-auto"> FACTURACION NETA *Estimado</p>
				</NavLink>
			</div>

			<div className="flex flex-col md:flex-row gap-4">
				<NavLink
					to={"/productosVendidos"}
					className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative"
				>
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>-</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="w-6 h-6"
							>
								<path
									fill-rule="evenodd"
									d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a3 3 0 1 0 6 0v-.75a.75.75 0 0 1 1.5 0v.75a4.5 4.5 0 1 1-9 0v-.75a.75.75 0 0 1 1.5 0v.75Z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl pt-8 pb-4 font-bold mt-auto">
						{totalProductosVendidos}
					</p>
					<p className="text-sm mt-auto">PRODUCTOS VENDIDOS</p>
				</NavLink>
				<NavLink
					to={"/ventas"}
					className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative"
				>
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>-</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="w-6 h-6"
							>
								<path
									fill-rule="evenodd"
									d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a3 3 0 1 0 6 0v-.75a.75.75 0 0 1 1.5 0v.75a4.5 4.5 0 1 1-9 0v-.75a.75.75 0 0 1 1.5 0v.75Z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
						<p className=" text-4xl pt-8 pb-4 font-bold mt-auto">
							{orders.length}
						</p>
						<p className="text-sm mt-auto">VENTAS</p>
					</div>
				</NavLink>
			</div>
			<div className="flex flex-col md:flex-row gap-4">
				<NavLink
					to={"/productosVendidos"}
					className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative"
				>
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>-</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="w-6 h-6"
							>
								<path d="M19.006 3.705a.75.75 0 1 0-.512-1.41L6 6.838V3a.75.75 0 0 0-.75-.75h-1.5A.75.75 0 0 0 3 3v4.93l-1.006.365a.75.75 0 0 0 .512 1.41l16.5-6Z" />
								<path
									fill-rule="evenodd"
									d="M3.019 11.114 18 5.667v3.421l4.006 1.457a.75.75 0 1 1-.512 1.41l-.494-.18v8.475h.75a.75.75 0 0 1 0 1.5H2.25a.75.75 0 0 1 0-1.5H3v-9.129l.019-.007ZM18 20.25v-9.566l1.5.546v9.02H18Zm-9-6a.75.75 0 0 0-.75.75v4.5c0 .414.336.75.75.75h3a.75.75 0 0 0 .75-.75V15a.75.75 0 0 0-.75-.75H9Z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl pt-8 pb-4 font-bold mt-auto">-</p>
					<p className="text-sm mt-auto">TIEMPO DE COCCIÓN PROMEDIO</p>
				</NavLink>
				<NavLink
					to={"/productosVendidos"}
					className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative"
				>
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>-</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="w-6 h-6"
							>
								<path
									fill-rule="evenodd"
									d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl pt-8 pb-4 font-bold mt-auto">-</p>
					<p className="text-sm mt-auto">TIEMPO DE DELAY PROMEDIO</p>
				</NavLink>
				<NavLink
					to={"/productosVendidos"}
					className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative"
				>
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>-</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="w-6 h-6"
							>
								<path
									fill-rule="evenodd"
									d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 0 1 9.75 22.5a.75.75 0 0 1-.75-.75v-4.131A15.838 15.838 0 0 1 6.382 15H2.25a.75.75 0 0 1-.75-.75 6.75 6.75 0 0 1 7.815-6.666ZM15 6.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z"
									clip-rule="evenodd"
								/>
								<path d="M5.26 17.242a.75.75 0 1 0-.897-1.203 5.243 5.243 0 0 0-2.05 5.022.75.75 0 0 0 .625.627 5.243 5.243 0 0 0 5.022-2.051.75.75 0 1 0-1.202-.897 3.744 3.744 0 0 1-3.008 1.51c0-1.23.592-2.323 1.51-3.008Z" />
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl pt-8 pb-4 font-bold mt-auto">-</p>
					<p className="text-sm mt-auto">TIEMPO DE DELIVERY PROMEDIO</p>
				</NavLink>
			</div>
			<div className="flex flex-col md:flex-row gap-4">
				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>-</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="w-6 h-6"
							>
								<path
									fill-rule="evenodd"
									d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 0 0-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634Zm4.314.634c.108-.215.395-.634.936-.634.54 0 .828.419.936.634.13.26.189.568.189.866 0 .298-.059.605-.189.866-.108.215-.395.634-.936.634-.54 0-.828-.419-.936-.634a1.96 1.96 0 0 1-.189-.866c0-.298.059-.605.189-.866Zm2.023 6.828a.75.75 0 1 0-1.06-1.06 3.75 3.75 0 0 1-5.304 0 .75.75 0 0 0-1.06 1.06 5.25 5.25 0 0 0 7.424 0Z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl pt-8 pb-4 font-bold mt-auto">-</p>
					<p className="text-sm mt-auto">CUSTOMER SUCCESS</p>
				</div>
				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>-</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="w-6 h-6"
							>
								<path d="M5.25 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM2.25 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM18.75 7.5a.75.75 0 0 0-1.5 0v2.25H15a.75.75 0 0 0 0 1.5h2.25v2.25a.75.75 0 0 0 1.5 0v-2.25H21a.75.75 0 0 0 0-1.5h-2.25V7.5Z" />
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl pt-8 pb-4 font-bold mt-auto">-</p>
					<p className="text-sm mt-auto">NUEVOS CLIENTES</p>
				</div>
				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>-</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="w-6 h-6"
							>
								<path
									fill-rule="evenodd"
									d="M4.5 3.75a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V6.75a3 3 0 0 0-3-3h-15Zm4.125 3a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Zm-3.873 8.703a4.126 4.126 0 0 1 7.746 0 .75.75 0 0 1-.351.92 7.47 7.47 0 0 1-3.522.877 7.47 7.47 0 0 1-3.522-.877.75.75 0 0 1-.351-.92ZM15 8.25a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 0-1.5H15ZM14.25 12a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H15a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 0-1.5H15Z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl pt-8 pb-4 font-bold mt-auto">-</p>
					<p className="text-sm mt-auto">TICKET PROMEDIO</p>
				</div>
			</div>

			<div className="flex flex-col md:flex-row  gap-4">
				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>-</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="w-6 h-6"
							>
								<path d="M6 3a3 3 0 0 0-3 3v1.5a.75.75 0 0 0 1.5 0V6A1.5 1.5 0 0 1 6 4.5h1.5a.75.75 0 0 0 0-1.5H6ZM16.5 3a.75.75 0 0 0 0 1.5H18A1.5 1.5 0 0 1 19.5 6v1.5a.75.75 0 0 0 1.5 0V6a3 3 0 0 0-3-3h-1.5ZM12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5ZM4.5 16.5a.75.75 0 0 0-1.5 0V18a3 3 0 0 0 3 3h1.5a.75.75 0 0 0 0-1.5H6A1.5 1.5 0 0 1 4.5 18v-1.5ZM21 16.5a.75.75 0 0 0-1.5 0V18a1.5 1.5 0 0 1-1.5 1.5h-1.5a.75.75 0 0 0 0 1.5H18a3 3 0 0 0 3-3v-1.5Z" />
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl pt-8 pb-4 font-bold mt-auto">-</p>
					<p className="text-sm mt-auto">VISUALIZACIÓN LOCAL</p>
				</div>
				<NavLink
					to={"/seguidores"}
					className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative"
				>
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>-73</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="w-6 h-6"
							>
								<path
									fill-rule="evenodd"
									d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z"
									clip-rule="evenodd"
								/>
								<path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl pt-8 pb-4 font-bold mt-auto">-</p>
					<p className="text-sm mt-auto">NUEVOS SEGUIDORES</p>
				</NavLink>
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
								viewBox="0 0 24 24"
								fill="currentColor"
								class="w-6 h-6"
							>
								<path d="M7.493 18.5c-.425 0-.82-.236-.975-.632A7.48 7.48 0 0 1 6 15.125c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75A.75.75 0 0 1 15 2a2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23h-.777ZM2.331 10.727a11.969 11.969 0 0 0-.831 4.398 12 12 0 0 0 .52 3.507C2.28 19.482 3.105 20 3.994 20H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 0 1-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227Z" />
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl pt-8 pb-4 font-bold mt-auto">-</p>
					<p className="text-sm mt-auto">PROMEDIO DE LIKES</p>
				</div>
				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>-</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="w-6 h-6"
							>
								<path
									fill-rule="evenodd"
									d="M12 2.25c-2.429 0-4.817.178-7.152.521C2.87 3.061 1.5 4.795 1.5 6.741v6.018c0 1.946 1.37 3.68 3.348 3.97.877.129 1.761.234 2.652.316V21a.75.75 0 0 0 1.28.53l4.184-4.183a.39.39 0 0 1 .266-.112c2.006-.05 3.982-.22 5.922-.506 1.978-.29 3.348-2.023 3.348-3.97V6.741c0-1.947-1.37-3.68-3.348-3.97A49.145 49.145 0 0 0 12 2.25ZM8.25 8.625a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Zm2.625 1.125a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875-1.125a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl pt-8 pb-4 font-bold mt-auto">-</p>
					<p className="text-sm mt-auto">PROMEDIO DE COMENTARIOS</p>
				</div>
				<div className="flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-antonio font-black p-4 relative">
					{/* Recuadro chiquito arriba a la derecha */}
					<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
						<p>-</p>
					</div>
					<div className="absolute top-4 left-4 text-black ">
						{/* Contenido principal */}
						<div className="flex flex-col">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="w-6 h-6"
							>
								<path
									fill-rule="evenodd"
									d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						{/* Puedes cambiar el ícono según tus necesidades */}
					</div>
					<p className=" text-4xl pt-8 pb-4 font-bold mt-auto">-</p>
					<p className="text-sm mt-auto">PROMEDIO DE COMPARTIDOS</p>
				</div>
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
						dataFacturacionSemana,
						dataFacturacionSemana,
						dataFacturacionSemana,
						dataFacturacionSemana,
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
				<MapStats />
			</div>
		</div>
	);
};
