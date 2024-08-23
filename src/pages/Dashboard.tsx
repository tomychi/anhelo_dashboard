import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import currencyFormat from "../helpers/currencyFormat";
import Calendar from "../components/Calendar";
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
import { getCustomers } from "../helpers/orderByweeks";
import { calculateKMS } from "../helpers";
import {
	calcularPromedioTiempoElaboracion,
	promedioTiempoDeEntregaTotal,
	contarPedidosDemorados,
} from "../helpers/dateToday";

export const Dashboard = () => {
	const {
		orders,
		facturacionTotal,
		totalProductosVendidos,
		neto,
		telefonos,
		valueDate,
	} = useSelector((state: RootState) => state.data);

	const startDate = new Date(valueDate?.startDate || new Date());

	const customers = getCustomers(telefonos, orders, startDate);

	return (
		<div className="min-h-screen font-coolvetica bg-gray-100 flex flex-col">
			<div className="bg-black p-4">
				<Calendar />
				<p className="text-white text-5xl mt-8 mb-4">Hola Tobias</p>
			</div>
			<div className="flex-grow p-4 pt-16 relative">
				<div className="absolute left-4 right-4 -top-5 bg-white rounded-lg shadow-2xl shadow-black p-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
							info={`${Math.round(
								calcularPromedioTiempoElaboracion(orders)
							)} M`}
							title={"Tiempo cocción promedio"}
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
						/>
						<CardInfo
							info={0}
							title={"Promedio de compartidos"}
							svgComponent={<PromedioCompartidosSVG />}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};
