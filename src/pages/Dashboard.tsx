import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import currencyFormat from "../helpers/currencyFormat";
import Calendar from "../components/Calendar";
import { CardInfo } from "../components/dashboard";
import { projectAuth } from "../firebase/config";
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
import { calcularCostoHamburguesa } from "../helpers/calculator";
import { ProductStateProps } from "../redux/products/productReducer";
import Swal from "sweetalert2";
import { Cadete } from "../types/types";
import KPILineChart from "../components/dashboard/KPILineChart";

export const Dashboard = () => {
	const dispatch = useDispatch();
	const [totalPaga, setTotalPaga] = useState(0);
	const [totalDirecciones, setTotalDirecciones] = useState(0);
	const {
		valueDate,
		orders,
		facturacionTotal,
		totalProductosVendidos,
		neto,
		telefonos,
		vueltas,
		isLoading,
	} = useSelector((state: RootState) => state.data);
	const currentUserEmail = projectAuth.currentUser?.email;
	const isMarketingUser = currentUserEmail === "marketing@anhelo.com";

	useEffect(() => {
		const fetchData = async () => {
			try {
				const materialesData = await ReadMateriales();
				dispatch(readMaterialsAll(materialesData));

				const productsData = await ReadData();
				const formattedData: ProductStateProps[] = productsData.map((item) => ({
					collectionName: item.collectionName,
					id: item.id,
					data: {
						description: item.data.description,
						img: item.data.img,
						name: item.data.name,
						price: item.data.price,
						type: item.data.type,
						ingredients: item.data.ingredients,
						id: item.id,
						costo: calcularCostoHamburguesa(
							materialesData,
							item.data.ingredients
						),
					},
				}));

				dispatch(readProductsAll(formattedData));
			} catch (error) {
				Swal.fire({
					icon: "error",
					title: "Error",
					text: `Error al traer datos: ${error}`,
				});
			}
		};

		fetchData();
	}, [dispatch]);

	const startDate = valueDate?.startDate
		? new Date(valueDate.startDate)
		: new Date();
	const customers = getCustomers(telefonos, orders, startDate);

	useEffect(() => {
		const calcularTotalPaga = () => {
			if (!vueltas || vueltas.length === 0) return 0;

			return vueltas.reduce((totalCadetes, cadete) => {
				if (!cadete.vueltas || cadete.vueltas.length === 0) return totalCadetes;

				const totalCadete = cadete.vueltas.reduce((totalVueltas, vuelta) => {
					return totalVueltas + (vuelta.paga || 0);
				}, 0);

				return totalCadetes + totalCadete;
			}, 0);
		};

		const nuevoTotalPaga = calcularTotalPaga();
		setTotalPaga(nuevoTotalPaga);

		const nuevaTotalDirecciones = calculateTotalDirecciones(vueltas);
		setTotalDirecciones(nuevaTotalDirecciones);
	}, [vueltas]);

	const calculateAverageRatings = (orders) => {
		const ordersWithRatings = orders.filter((order) =>
			order.hasOwnProperty("rating")
		);

		if (ordersWithRatings.length === 0) return null;

		const generalRatings = ["presentacion", "tiempo", "temperatura", "pagina"];

		const totals = ordersWithRatings.reduce((acc, order) => {
			Object.entries(order.rating).forEach(([key, value]) => {
				if (typeof value === "number") {
					if (!generalRatings.includes(key.toLowerCase())) {
						if (!acc.productos) {
							acc.productos = { sum: 0, count: 0 };
						}
						acc.productos.sum += value;
						acc.productos.count += 1;
					} else {
						if (!acc[key]) {
							acc[key] = { sum: 0, count: 0 };
						}
						acc[key].sum += value;
						acc[key].count += 1;
					}
				}
			});
			return acc;
		}, {});

		const generalTotal = Object.entries(totals).reduce(
			(acc, [key, value]) => {
				if (key !== "productos") {
					acc.sum += value.sum;
					acc.count += value.count;
				}
				return acc;
			},
			{ sum: 0, count: 0 }
		);

		return Object.entries(totals).reduce(
			(acc, [key, value]) => {
				acc[key] = {
					average: (value.sum / value.count).toFixed(1),
					count: value.count,
				};
				return acc;
			},
			{
				general: {
					average: (generalTotal.sum / generalTotal.count).toFixed(1),
					count: generalTotal.count,
				},
			}
		);
	};

	const averageRatings = calculateAverageRatings(orders);

	const ratingCards = averageRatings
		? [
				<CardInfo
					key="general"
					info={averageRatings.general.average || "0"}
					title={"Rating general"}
					cuadrito={averageRatings.general.count}
					isLoading={isLoading}
				/>,
				<CardInfo
					key="temperatura"
					info={averageRatings.temperatura.average || "0"}
					title={"Temperatura"}
					cuadrito={averageRatings.temperatura.count}
					isLoading={isLoading}
				/>,
				<CardInfo
					key="presentacion"
					info={averageRatings.presentacion.average || "0"}
					title={"Presentación"}
					cuadrito={averageRatings.presentacion.count}
					isLoading={isLoading}
				/>,
				<CardInfo
					key="pagina"
					info={averageRatings.pagina.average || "0"}
					title={"Página"}
					cuadrito={averageRatings.pagina.count}
					isLoading={isLoading}
				/>,
				<CardInfo
					key="tiempo"
					info={averageRatings.tiempo.average || "0"}
					title={"Tiempo"}
					cuadrito={averageRatings.tiempo.count}
					isLoading={isLoading}
				/>,
				<CardInfo
					key="productos"
					info={averageRatings.productos.average || "0"}
					title={"Productos"}
					cuadrito={averageRatings.productos.count}
					isLoading={isLoading}
				/>,
		  ]
		: [];

	const marketingCards = [
		<CardInfo
			key="visualizacion"
			info={0}
			title={"Visualización local"}
			isLoading={isLoading}
		/>,
		<CardInfo
			key="seguidores"
			info={0}
			title={"Nuevos seguidores"}
			isLoading={isLoading}
		/>,
		<CardInfo
			key="likes"
			info={0}
			title={"Promedio de likes"}
			isLoading={isLoading}
		/>,
		<CardInfo
			key="comentarios"
			info={0}
			title={"Promedio de comentarios"}
			isLoading={isLoading}
		/>,
		<CardInfo
			key="compartidos"
			info={0}
			title={"Promedio de compartidos"}
			isLoading={isLoading}
		/>,
	];

	const allCards = [
		<CardInfo
			key="bruto"
			info={currencyFormat(facturacionTotal)}
			link={"bruto"}
			title={"Facturación bruta"}
			isLoading={isLoading}
		/>,
		<CardInfo
			key="neto"
			info={currencyFormat(Math.ceil(neto))}
			link={"neto"}
			cuadrito={(neto * 100) / facturacionTotal}
			title={"Facturación neta"}
			isLoading={isLoading}
		/>,
		<CardInfo
			key="productos"
			info={totalProductosVendidos}
			link={"productosVendidos"}
			title={"Productos vendidos"}
			isLoading={isLoading}
		/>,
		<CardInfo
			key="delivery"
			info={orders.length}
			link={"ventas"}
			title={"Ventas delivery"}
			isLoading={isLoading}
		/>,
		<CardInfo
			key="takeaway"
			info="-"
			link={"ventas"}
			title={"Ventas take away"}
			isLoading={isLoading}
		/>,
		<CardInfo
			key="success"
			info={`${Math.ceil(
				orders.length > 0
					? 100 - (contarPedidosDemorados(orders) * 100) / orders.length
					: 0
			)}%`}
			title={"Customer success"}
			isLoading={isLoading}
		/>,
		<CardInfo
			key="coccion"
			info={`${Math.round(calcularPromedioTiempoElaboracion(orders))} M`}
			title={"Tiempo cocción promedio"}
			isLoading={isLoading}
		/>,
		<CardInfo
			key="entrega"
			info={`${Math.round(promedioTiempoDeEntregaTotal(orders))} M`}
			title={"Tiempo total promedio"}
			isLoading={isLoading}
		/>,
		<CardInfo
			key="km"
			info={`${Math.round(calculateKMS(orders))} km`}
			title={"Km recorridos"}
			isLoading={isLoading}
		/>,
		<CardInfo
			key="costokm"
			info={currencyFormat(
				orders.length > 0 ? totalPaga / totalDirecciones || 0 : 0
			)}
			title={"Costo promedio delivery"}
			isLoading={isLoading}
		/>,
		<CardInfo
			key="clientes"
			info={customers.newCustomers.length}
			link={"clientes"}
			title={"Nuevos clientes"}
			isLoading={isLoading}
		/>,
		<CardInfo
			key="ticket"
			info={
				orders.length > 0
					? currencyFormat(facturacionTotal / orders.length)
					: currencyFormat(0)
			}
			title={"Ticket promedio"}
			isLoading={isLoading}
		/>,
	];

	const cardsToRender = isMarketingUser
		? [...ratingCards]
		: [...allCards, ...ratingCards];

	const greetingName = isMarketingUser ? "Lucho" : "Tobias";

	const calculateTotalDirecciones = (vueltas: Cadete[] | undefined) => {
		if (!vueltas) return 0;
		return vueltas.reduce((total: number, cadete) => {
			if (cadete.vueltas && Array.isArray(cadete.vueltas)) {
				return (
					total +
					cadete.vueltas.reduce((cadeteTotal, vuelta) => {
						return cadeteTotal + (vuelta.orders ? vuelta.orders.length : 0);
					}, 0)
				);
			}
			return total;
		}, 0);
	};

	console.log(orders.filter((order) => order.hasOwnProperty("rating"))); // Orders con rating
	console.log(
		`Porcentaje de orders con rating: ${(
			(orders.filter((order) => order.hasOwnProperty("rating")).length /
				orders.length) *
			100
		).toFixed(2)}%`
	);

	return (
		<div className="min-h-screen font-coolvetica bg-gray-100 flex flex-col relative">
			<div className="bg-black px-4 pb-4">
				<Calendar />
				<p className="text-white text-5xl mt-8 font-bold mb-4">
					Hola {greetingName}
				</p>
			</div>
			<div className="absolute left-4 right-4 top-[130px] rounded-lg">
				<div className="flex flex-col shadow-2xl shadow-black rounded-lg">
					{cardsToRender.map((card, index) =>
						React.cloneElement(card, {
							key: index,
							className: `
								${index === 0 ? "rounded-t-lg" : ""}
								${index === cardsToRender.length - 1 ? "rounded-b-lg" : ""}
							`,
							isLoading: isLoading,
						})
					)}
				</div>
				<KPILineChart orders={orders} />
			</div>
		</div>
	);
};
