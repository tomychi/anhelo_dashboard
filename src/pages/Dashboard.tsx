import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import currencyFormat from "../helpers/currencyFormat";
import Calendar from "../components/Calendar";
import { CardInfo } from "../components/dashboard";
import { projectAuth } from "../firebase/config";
import {
	getFirestore,
	collection,
	getDocs,
	query,
	where,
	Timestamp,
} from "firebase/firestore";
import { DateRangeType } from "react-tailwindcss-datepicker/dist/types";
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
import { getCustomers } from "../helpers/orderByweeks";
import { calculateKMS } from "../helpers";
import {
	calcularPromedioTiempoElaboracion,
	promedioTiempoDeEntregaTotal,
	contarPedidosDemorados,
} from "../helpers/dateToday";
import { ReadMateriales } from "../firebase/Materiales";
import { readMaterialsAll } from "../redux/materials/materialAction";
import { readProductsAll } from "../redux/products/productAction";
import { ReadData } from "../firebase/ReadData";

const convertTimestamps = (obj: any): any => {
	if (obj instanceof Timestamp) {
		return obj.toDate();
	} else if (Array.isArray(obj)) {
		return obj.map(convertTimestamps);
	} else if (typeof obj === "object" && obj !== null) {
		return Object.fromEntries(
			Object.entries(obj).map(([key, value]) => [key, convertTimestamps(value)])
		);
	}
	return obj;
};

const isDateInRange = (date: Date, startDate: Date, endDate: Date) => {
	return date >= startDate && date <= endDate;
};

interface Cadete {
	id: string;
	name: string;
	available: boolean;
	category: string;
	vueltas?: Vuelta[];
}

interface Vuelta {
	startTime: Date;
	endTime?: Date;
	rideId: string;
	status: string;
	totalDistance: number;
	totalDuration: number;
	paga: number;
	orders: any[];
}

export const Dashboard = () => {
	const dispatch = useDispatch();
	const [cadetes, setCadetes] = useState<Cadete[]>([]);
	const [totalPaga, setTotalPaga] = useState(0);
	const {
		valueDate,
		orders,
		facturacionTotal,
		totalProductosVendidos,
		neto,
		telefonos,
	} = useSelector((state: RootState) => state.data);
	const currentUserEmail = projectAuth.currentUser?.email;
	const isMarketingUser = currentUserEmail === "marketing@anhelo.com";

	console.log(calculateKMS);

	const filteredCadetes = useMemo(() => {
		if (!valueDate || !valueDate.startDate) return [];

		const startDate = new Date(valueDate.startDate);
		const endDate = new Date(valueDate.endDate || valueDate.startDate);
		startDate.setHours(0, 0, 0, 0);
		endDate.setHours(23, 59, 59, 999);

		return cadetes
			.map((cadete) => ({
				...cadete,
				vueltas:
					cadete.vueltas?.filter(
						(vuelta) =>
							vuelta.startTime &&
							isDateInRange(new Date(vuelta.startTime), startDate, endDate)
					) || [],
			}))
			.filter((cadete) => cadete.vueltas.length > 0);
	}, [cadetes, valueDate]);

	useEffect(() => {
		const fetchMateriales = async () => {
			try {
				const materiales = await ReadMateriales();
				dispatch(readMaterialsAll(materiales));
			} catch (error) {
				console.error("Error al leer los materiales:", error);
			}
		};

		const fetchProducts = async () => {
			try {
				const products = await ReadData();
				dispatch(readProductsAll(products));
			} catch (error) {
				console.error("Error al leer los productos:", error);
			}
		};

		fetchProducts();
		fetchMateriales();
	}, [dispatch]);

	useEffect(() => {
		const fetchCadetes = async () => {
			const firestore = getFirestore();
			const empleadosRef = collection(firestore, "empleados");
			const cadetesQuery = query(
				empleadosRef,
				where("category", "==", "cadete")
			);
			try {
				const snapshot = await getDocs(cadetesQuery);
				const cadetesData = snapshot.docs.map((doc) => {
					const data = doc.data();
					return convertTimestamps({ id: doc.id, ...data }) as Cadete;
				});
				setCadetes(cadetesData);
			} catch (error) {
				console.error("Error al obtener los cadetes:", error);
			}
		};

		fetchCadetes();
	}, []);

	useEffect(() => {
		if (filteredCadetes.length > 0) {
			console.log(
				"Cadetes con vueltas filtradas por fecha (excluyendo vueltas vacías):",
				filteredCadetes
			);

			const calculatedTotalPaga = filteredCadetes.reduce((total, cadete) => {
				return (
					total +
					cadete.vueltas.reduce(
						(cadetePaga, vuelta) => cadetePaga + vuelta.paga,
						0
					)
				);
			}, 0);

			setTotalPaga(calculatedTotalPaga);
			console.log("Total paga de todas las vueltas:", calculatedTotalPaga);
		}
	}, [filteredCadetes]);

	const startDate = valueDate?.startDate
		? new Date(valueDate.startDate)
		: new Date();
	const customers = getCustomers(telefonos, orders, startDate);

	const marketingCards = [
		<CardInfo
			key="visualizacion"
			info={0}
			title={"Visualización local"}
			svgComponent={<VisualizacionLocalSVG />}
		/>,
		<CardInfo
			key="seguidores"
			info={0}
			title={"Nuevos seguidores"}
			svgComponent={<NuevosSeguidoresSVG />}
		/>,
		<CardInfo
			key="likes"
			info={0}
			title={"Promedio de likes"}
			svgComponent={<PromedioLikesSVG />}
		/>,
		<CardInfo
			key="comentarios"
			info={0}
			title={"Promedio de comentarios"}
			svgComponent={<PromedioComentariosSVG />}
		/>,
		<CardInfo
			key="compartidos"
			info={0}
			title={"Promedio de compartidos"}
			svgComponent={<PromedioCompartidosSVG />}
		/>,
	];

	const allCards = [
		<CardInfo
			key="bruto"
			info={currencyFormat(facturacionTotal)}
			link={"bruto"}
			title={"Facturación bruta"}
			svgComponent={<BrutoSVG />}
		/>,
		<CardInfo
			key="neto"
			info={currencyFormat(neto)}
			link={"neto"}
			cuadrito={(neto * 100) / facturacionTotal}
			title={"Facturación neta"}
			svgComponent={<NetoSVG />}
		/>,
		<CardInfo
			key="productos"
			info={totalProductosVendidos}
			link={"productosVendidos"}
			title={"Productos vendidos"}
			svgComponent={<ProductoVendidosSVG />}
		/>,
		<CardInfo
			key="delivery"
			info={orders.length}
			link={"ventas"}
			title={"Ventas delivery"}
			svgComponent={<VentasSVG />}
		/>,
		<CardInfo
			key="takeaway"
			info="-"
			link={"ventas"}
			title={"Ventas take away"}
			svgComponent={<VentasSVG />}
		/>,
		<CardInfo
			key="success"
			info={`${Math.ceil(
				orders.length > 0
					? 100 - (contarPedidosDemorados(orders) * 100) / orders.length
					: 0
			)}%`}
			title={"Customer success"}
			svgComponent={<CustomerSuccessSVG />}
		/>,
		<CardInfo
			key="coccion"
			info={`${Math.round(calcularPromedioTiempoElaboracion(orders))} M`}
			title={"Tiempo cocción promedio"}
			svgComponent={<TiempoCoccionSVG />}
		/>,
		<CardInfo
			key="entrega"
			info={`${Math.round(promedioTiempoDeEntregaTotal(orders))} M`}
			title={"Tiempo total promedio"}
			svgComponent={<EntregaPromedioSVG />}
		/>,
		<CardInfo
			key="km"
			info={`${Math.round(calculateKMS(orders))} km`}
			title={"Km recorridos"}
			svgComponent={<TruckKM />}
		/>,
		<CardInfo
			key="costokm"
			info={
				orders.length > 0
					? currencyFormat(totalPaga / orders.length)
					: currencyFormat(0)
			}
			title={"Costo promedio delivery"}
			svgComponent={<TruckKM />}
		/>,
		<CardInfo
			key="clientes"
			info={customers.newCustomers.length}
			link={"clientes"}
			title={"Nuevos clientes"}
			svgComponent={<NuevosClientesSVG />}
		/>,
		<CardInfo
			key="ticket"
			info={
				orders.length > 0
					? currencyFormat(facturacionTotal / orders.length)
					: currencyFormat(0)
			}
			title={"Ticket promedio"}
			svgComponent={<TicketPromedioSVG />}
		/>,
	];

	const cardsToRender = isMarketingUser
		? marketingCards
		: [...allCards, ...marketingCards];

	const greetingName = isMarketingUser ? "Lucho" : "Tobias";

	return (
		<div className="min-h-screen font-coolvetica bg-gray-100 flex flex-col relative ">
			<div className="bg-black px-4 pb-4">
				<Calendar />
				<p className="text-white text-5xl mt-8 mb-4">Hola {greetingName}</p>
			</div>
			<div className="absolute left-4 right-4 top-[130px] rounded-lg shadow-2xl shadow-black ">
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ">
					{cardsToRender.map((card, index) => {
						let className = "";
						if (index === 0) className = "rounded-t-lg";
						if (index === cardsToRender.length - 1) className = "rounded-b-lg";

						return React.cloneElement(card, {
							key: index,
							className: className,
						});
					})}
				</div>
			</div>
		</div>
	);
};
