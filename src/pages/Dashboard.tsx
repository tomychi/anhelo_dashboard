import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import currencyFormat from "../helpers/currencyFormat";
import Calendar from "../components/Calendar";
import { CardInfo } from "../components/dashboard";
import { projectAuth } from "../firebase/config";
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
import { calcularCostoHamburguesa } from "../helpers/calculator";
import { ProductStateProps } from "../redux/products/productReducer";
import Swal from "sweetalert2";

export const Dashboard = () => {
	const dispatch = useDispatch();
	const [totalPaga, setTotalPaga] = useState(0);
	const [productosVendidos, setProductosVendidos] = useState(0);
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

				Swal.fire({
					icon: "success",
					title: "Datos Actualizados",
					text: "Se actualizaron productos y materiales",
				});
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
		const total2x1 = orders.reduce((total, order) => {
			return (
				total +
				order.detallePedido.reduce((sum, item) => {
					return item.burger.includes("2x1") ? sum + item.quantity : sum;
				}, 0)
			);
		}, 0);

		const calculoProductosVendidos =
			totalProductosVendidos - total2x1 + total2x1 * 2;

		setProductosVendidos(calculoProductosVendidos);
	}, [orders, totalProductosVendidos]);
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
	}, [vueltas]);

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
			info={productosVendidos}
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
			<div className="absolute left-4 right-4 top-[130px] rounded-lg   ">
				{/* <div className="mt-8 px-4">
					{isLoading ? (
						<p className="text-center text-white">Cargando datos...</p> // Mostrar mensaje de carga
					) : vueltas && vueltas.length > 0 ? (
						vueltas.map((cadete) => (
							<div key={cadete.id} className="mb-8">
								<h3 className="text-2xl font-semibold">{cadete.name}</h3>
								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
									{cadete.vueltas && cadete.vueltas.length > 0 ? (
										cadete.vueltas.map((vuelta, index) => (
											<div
												key={vuelta.rideId}
												className="p-4 bg-white rounded-lg shadow-md"
											>
												<h4 className="text-xl font-bold mb-2">
													Vuelta {index + 1}
												</h4>
												<p>
													<strong>Paga:</strong>
													{currencyFormat(vuelta.paga)}
												</p>
												<p>
													<strong>Distancia Total:</strong>{" "}
													{vuelta.totalDistance} km
												</p>
												<p>
													<strong>Duración Total:</strong>{" "}
													{vuelta.totalDuration.toFixed(2)} min
												</p>
											</div>
										))
									) : (
										<p>No hay vueltas disponibles para este cadete.</p>
									)}
								</div>
							</div>
						))
					) : (
						<p className="text-center text-white">
							No hay datos de vueltas disponibles.
						</p>
					)}
				</div> */}
				{!isLoading && (
					<div className="flex flex-col shadow-2xl shadow-black mb-8 rounded-lg">
						{" "}
						{cardsToRender.map((card, index) =>
							React.cloneElement(card, {
								key: index,
								className: `
                                    ${index === 0 ? "rounded-t-lg" : ""}
                                    ${
																			index === cardsToRender.length - 1
																				? "rounded-b-lg"
																				: ""
																		}
                                `,
							})
						)}
					</div>
				)}
			</div>
		</div>
	);
};
