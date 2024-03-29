import { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { ReadOrdersForToday } from "../firebase/ReadData";
import { PedidoProps } from "../types/types";
import { RootState } from "../redux/configureStore";
import { useSelector, useDispatch } from "react-redux";
import { readOrdersData } from "../redux/data/dataAction";
import { useLocation } from "react-router-dom";
import currencyFormat from "../helpers/currencyFormat";
import {
	calcularPromedioTiempoElaboracion,
	promedioTiempoDeEntregaTotal,
} from "../helpers/dateToday";
import { ProductStateProps } from "../redux/products/productReducer";
import { updateMaterialStock } from "../firebase/Materiales";

interface ToppingCounts {
	[topping: string]: number;
}

export const Comandera = () => {
	const [seccionActiva, setSeccionActiva] = useState("porHacer");
	const [cadeteSeleccionado, setCadeteSeleccionado] = useState("");
	const [sumaTotalPedidos, setSumaTotalPedidos] = useState(0);
	const [sumaTotalEfectivo, setSumaTotalEfectivo] = useState(0);
	const [promedioTiempoElaboracion, setPromedioTiempoElaboracion] = useState(0);

	const dispatch = useDispatch();
	const { orders, productosPedidos, toppingsData } = useSelector(
		(state: RootState) => state.data
	);
	const { burgers } = useSelector((state: RootState) => state.product);
	const { materiales } = useSelector((state: RootState) => state.materials);

	const fc = () => {
		const totalToppingsQuantity = toppingsData.reduce(
			(totals: ToppingCounts, topping) => {
				// Verificar si ya existe una entrada para este tipo de topping
				if (topping.name in totals) {
					// Si existe, aumentar la cantidad
					totals[topping.name] += topping.quantity;
				} else {
					// Si no existe, crear una nueva entrada con la cantidad de este tipo de topping
					totals[topping.name] = topping.quantity;
				}
				return totals;
			},
			{}
		);

		// Definir una interfaz para el tipo de datos de los productos pedidos

		const totalIngredientesUtilizados = productosPedidos.reduce(
			(total, producto) => {
				// Verificar si el producto es una hamburguesa
				const hamburguesa = burgers.find(
					(burger: ProductStateProps) => burger.data.name === producto.burger
				);
				if (hamburguesa) {
					// Obtener los ingredientes de la hamburguesa
					const ingredientes = hamburguesa.data.ingredients;

					// Sumar la cantidad de cada ingrediente multiplicado por la cantidad de hamburguesas pedidas
					for (const ingrediente in ingredientes) {
						if (
							Object.prototype.hasOwnProperty.call(ingredientes, ingrediente)
						) {
							total[ingrediente] =
								(total[ingrediente] || 0) +
								ingredientes[ingrediente] * producto.quantity;
						}
					}
				}
				return total;
			},
			{} as { [ingredient: string]: number }
		);

		// Combinar los objetos totalToppingsQuantity y totalIngredientesUtilizados
		const totalToppingsAndIngredients: { [key: string]: number } = {
			...totalToppingsQuantity,
		};

		// Iterar sobre los ingredientes utilizados y agregarlos al objeto combinado
		for (const ingrediente in totalIngredientesUtilizados) {
			if (ingrediente in totalIngredientesUtilizados) {
				if (ingrediente in totalToppingsAndIngredients) {
					// Si el ingrediente ya existe en totalToppingsAndIngredients, sumar las cantidades
					totalToppingsAndIngredients[ingrediente] +=
						totalIngredientesUtilizados[ingrediente];
				} else {
					// Si el ingrediente no existe, simplemente agregarlo al objeto combinado
					totalToppingsAndIngredients[ingrediente] =
						totalIngredientesUtilizados[ingrediente];
				}
			}
		}

		// Llamar a la función para actualizar el stock de ingredientes
		const ingredientesUtilizados = Object.keys(totalToppingsAndIngredients);

		for (const ingrediente of ingredientesUtilizados) {
			const cantidadUtilizada = totalToppingsAndIngredients[ingrediente];
			let nombreFiltrado = ingrediente
				.replace(/\b(salsa|caramelizada)\b/gi, "")
				.trim();

			// Manejar el caso específico de "salsa anhelo" que debe convertirse en "alioli"
			if (ingrediente.toLowerCase().includes("salsa anhelo")) {
				nombreFiltrado = "alioli";
			}
			try {
				// Buscar el ID del ingrediente por su nombre
				const ingredienteId = materiales.find(
					(m) => m.nombre === nombreFiltrado
				)?.id;

				if (ingredienteId) {
					// Llamar a la función para actualizar el stock de ingredientes
					updateMaterialStock(ingredienteId, cantidadUtilizada);
				} else {
					console.error(
						`No se encontró el ID del ingrediente con nombre ${ingrediente}`
					);
				}
			} catch (error) {
				console.error("Error actualizando el stock del ingrediente:", error);
			}
		}
	};

	useEffect(() => {
		const ahora = new Date();
		const horaDeseada = new Date(ahora);
		horaDeseada.setHours(23, 59, 0, 0);
		let tiempoHastaProximaEjecucion = horaDeseada.getTime() - ahora.getTime();

		if (tiempoHastaProximaEjecucion < 0) {
			tiempoHastaProximaEjecucion += 24 * 60 * 60 * 1000; // Si ya pasó la hora deseada, esperar hasta mañana
		}

		const temporizadorId = setTimeout(() => {
			fc(); // Ejecutar la tarea
			const intervaloId = setInterval(fc, 24 * 60 * 60 * 1000); // Configurar intervalo diario
			// Limpiar el intervalo cuando el componente se desmonte
			return () => clearInterval(intervaloId);
		}, tiempoHastaProximaEjecucion);

		// Limpiar el temporizador cuando el componente se desmonte
		return () => clearTimeout(temporizadorId);
	}, []); // Ejecutar solo una vez al montar el componente

	const location = useLocation();
	// Filtra los pedidos según la sección activa
	const pedidosPorHacer = orders
		.filter(
			(o) =>
				!o.elaborado &&
				!o.entregado &&
				(!cadeteSeleccionado || o.cadete === cadeteSeleccionado)
		)
		.sort((a, b) => {
			const [horaA, minutosA] = a.hora.split(":").map(Number);
			const [horaB, minutosB] = b.hora.split(":").map(Number);
			return horaA * 60 + minutosA - (horaB * 60 + minutosB);
		});

	const pedidosHechos = orders
		.filter(
			(o) =>
				o.elaborado &&
				!o.entregado &&
				(!cadeteSeleccionado || o.cadete === cadeteSeleccionado)
		)
		.sort((a, b) => {
			const [horaA, minutosA] = a.hora.split(":").map(Number);
			const [horaB, minutosB] = b.hora.split(":").map(Number);
			return horaA * 60 + minutosA - (horaB * 60 + minutosB);
		});

	const pedidosEntragados = orders
		.filter(
			(o) =>
				o.entregado && (!cadeteSeleccionado || o.cadete === cadeteSeleccionado)
		)
		.sort((a, b) => {
			const [horaA, minutosA] = a.hora.split(":").map(Number);
			const [horaB, minutosB] = b.hora.split(":").map(Number);
			return horaA * 60 + minutosA - (horaB * 60 + minutosB);
		});
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
			<div className="flex font-antonio gap-4 mb-4 ">
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
			<div className="text-custom-red uppercase font-antonio   flex flex-col gap-4  mb-8">
				<div>
					<p className="border-b-2 font-black w-max border-red-main  ">
						PEDIDOS ENTREGADOS A TIEMPO: {Math.round(customerSuccess)}%
					</p>

					<p className=" border-b-2 font-black w-max  border-red-main">
						Promedio de tiempo de elaboración:{" "}
						{Math.round(promedioTiempoElaboracion)} minutos
					</p>
					<p className=" border-b-2 font-black w-max   border-red-main">
						Promedio de tiempo de entrega total:{" "}
						{Math.round(promedioTiempoDeEntregaTotal(orders))} MINUTOS
					</p>
				</div>
				<div className="flex w-max  flex-row border-2 pl-1.5 font-black border-red-main ">
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
			<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4  ">
				{seccionActiva === "porHacer" ? (
					Array.isArray(pedidosPorHacer) && pedidosPorHacer.length > 0 ? (
						pedidosPorHacer.map((comanda) => (
							<div key={comanda.id}>
								<Card comanda={comanda} />
							</div>
						))
					) : (
						<p className="text-custom-red  font-antonio ">
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
						<p className="text-custom-red font-antonio ">
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
					<p className="text-custom-red font-antonio ">
						No hay pedidos por hacer.
					</p>
				)}
			</div>
		</div>
	);
};
