import { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { ReadOrdersForToday } from "../firebase/ReadData";
import { PedidoProps } from "../types/types";
import { RootState } from "../redux/configureStore";
import { useSelector, useDispatch } from "react-redux";
import { readOrdersData } from "../redux/data/dataAction";
import { useLocation } from "react-router-dom";
import currencyFormat from "../helpers/currencyFormat";
import { calcularPromedioTiempoElaboracion } from "../helpers/dateToday";

export const Comandera = () => {
	const [seccionActiva, setSeccionActiva] = useState("porHacer");
	const [cadeteSeleccionado, setCadeteSeleccionado] = useState("");
	const [sumaTotalPedidos, setSumaTotalPedidos] = useState(0);
	const [sumaTotalEfectivo, setSumaTotalEfectivo] = useState(0);
	const [promedioTiempoElaboracion, setPromedioTiempoElaboracion] = useState(0);

	const dispatch = useDispatch();
	const { orders } = useSelector((state: RootState) => state.data);
	const location = useLocation();
	// Filtra los pedidos según la sección activa
	const pedidosPorHacer = orders.filter(
		(o) =>
			!o.elaborado && (!cadeteSeleccionado || o.cadete === cadeteSeleccionado)
	);
	const pedidosHechos = orders.filter(
		(o) =>
			o.elaborado &&
			!o.entregado &&
			(!cadeteSeleccionado || o.cadete === cadeteSeleccionado)
	);

	const pedidosEntragados = orders.filter(
		(o) =>
			o.entregado && (!cadeteSeleccionado || o.cadete === cadeteSeleccionado)
	);
	useEffect(() => {
		if (location.pathname === "/comandas") {
			const unsubscribe = ReadOrdersForToday((pedidos: PedidoProps[]) => {
				console.log("db");
				dispatch(readOrdersData(pedidos));
			});

			return () => {
				unsubscribe(); // Detiene la suscripción cuando el componente se desmonta
			};
		}
		const promedio = calcularPromedioTiempoElaboracion(pedidosHechos);
		setPromedioTiempoElaboracion(promedio);
	}, [dispatch, location]);

	const cadetesUnicos = Array.from(
		new Set(orders.map((order) => order.cadete))
	);
	// Manejar el cambio en el select de cadetes
	const handleCadeteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const nuevoCadeteSeleccionado = event.target.value;
		setCadeteSeleccionado(nuevoCadeteSeleccionado);

		// Calcular la suma total de pedidos para el cadete seleccionado
		const totalPedidosCadete = orders.reduce((total, pedido) => {
			if (pedido.cadete === nuevoCadeteSeleccionado) {
				return total + 1; // Si no se ha seleccionado ningún cadete o si el cadete del pedido coincide con el seleccionado, sumar 1 al total
			} else {
				return total;
			}
		}, 0);

		setSumaTotalPedidos(totalPedidosCadete);

		// Calcular la suma total de los montos de los pedidos que fueron en efectivo para el cadete seleccionado
		const totalEfectivoCadete = orders.reduce((total, pedido) => {
			if (
				pedido.cadete === nuevoCadeteSeleccionado &&
				pedido.metodoPago === "efectivo"
			) {
				return total + pedido.total; // Si no se ha seleccionado ningún cadete o si el cadete del pedido coincide con el seleccionado y el pago fue en efectivo, sumar el monto total del pedido
			} else {
				return total;
			}
		}, 0);

		setSumaTotalEfectivo(totalEfectivoCadete);
	};

	const customerSuccess =
		100 -
		(orders.filter((order) => order.dislike || order.delay).length * 100) /
			orders.length;
	return (
		<div className="p-4 bg-black min-h-screen">
			<div className="flex justify-center font-antonio gap-4 mb-4 ">
				<button
					className={`p-4 ${
						seccionActiva === "porHacer"
							? "bg-custom-red"
							: "border-2 border-red-main text-custom-red"
					} text-black font-black uppercase `}
					onClick={() => setSeccionActiva("porHacer")}
				>
					Por Hacer
				</button>
				<button
					className={`p-4 ${
						seccionActiva === "hechos"
							? "bg-custom-red"
							: "border-2 border-red-main text-custom-red"
					} text-black font-black uppercase `}
					onClick={() => setSeccionActiva("hechos")}
				>
					Hechos
				</button>
				<button
					className={`p-4 ${
						seccionActiva === "entregados"
							? "bg-custom-red"
							: "border-2 border-red-main text-custom-red"
					} text-black font-black uppercase `}
					onClick={() => setSeccionActiva("entregados")}
				>
					Entregados
				</button>
			</div>
			<div className="text-custom-red uppercase font-antonio   flex flex-col gap-4 items-center text-center">
				{location.pathname === "/comandas" ? null : (
					<div>
						<p className="border-b-2 font-black border-red-main ">
							Customer success: {Math.round(customerSuccess)}%
						</p>

						<p className=" border-b-2 font-black  text-center border-red-main">
							Promedio de tiempo de elaboración por pedido:{" "}
							{Math.round(promedioTiempoElaboracion)} minutos
						</p>
					</div>
				)}
				<div className="flex  text-center flex-row border-b-2 font-black border-red-main mb-4">
					<p>Filtrar por cadetes:</p>
					<select
						value={cadeteSeleccionado}
						onChange={handleCadeteChange}
						className="bg-black uppercase"
					>
						<option value="">Todos los cadetes</option>
						{cadetesUnicos.map((cadete, index) => {
							if (cadete === undefined) return;
							return (
								<option key={index} value={cadete}>
									{cadete}
								</option>
							);
						})}
					</select>
				</div>
				{cadeteSeleccionado && (
					<div>
						<p>
							Suma total de pedidos para {cadeteSeleccionado}:{" "}
							{sumaTotalPedidos}
						</p>
						<p>
							Suma total de pagos en efectivo para {cadeteSeleccionado}:{" "}
							{currencyFormat(sumaTotalEfectivo)}
						</p>
					</div>
				)}
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 ">
				{seccionActiva === "porHacer" ? (
					Array.isArray(pedidosPorHacer) && pedidosPorHacer.length > 0 ? (
						pedidosPorHacer.map((comanda) => (
							<div key={comanda.id}>
								<Card comanda={comanda} />
							</div>
						))
					) : (
						<p className="text-custom-red font-antonio p-4">
							No hay pedidos por hacer.
						</p>
					)
				) : seccionActiva === "hechos" ? (
					Array.isArray(pedidosHechos) && pedidosHechos.length > 0 ? (
						pedidosHechos.map((comanda) => (
							<div key={comanda.id}>
								<Card comanda={comanda} />
							</div>
						))
					) : (
						<p className="text-custom-red font-antonio p-4">
							No hay pedidos hechos.
						</p>
					)
				) : Array.isArray(pedidosEntragados) && pedidosEntragados.length > 0 ? (
					pedidosEntragados.map((comanda) => (
						<div key={comanda.id}>
							<Card comanda={comanda} />
						</div>
					))
				) : (
					<p className="text-custom-red font-antonio p-4">
						No hay pedidos por hacer.
					</p>
				)}
			</div>
		</div>
	);
};
