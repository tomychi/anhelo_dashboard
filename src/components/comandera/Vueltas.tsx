import { useEffect, useState } from "react";
import { VueltaInfo, buscarPedidos } from "../../firebase/Cadetes";
import { TiempoCoccionSVG, TruckKM } from "../icons";
import { PedidoProps } from "../../types/types";
import {
	calcularDiferenciaHoraria,
	calcularPromedioTiempoPorViaje,
} from "../../helpers/dateToday";

interface VueltasWithOrders extends VueltaInfo {
	orders: PedidoProps[];
}

export const Vueltas = ({
	vueltas,
}: {
	cadete: string | null;
	vueltas: VueltaInfo[];
}) => {
	const [loading, setLoading] = useState(false);
	const [vueltasWithOrders, setVueltasWithOrders] = useState<
		VueltasWithOrders[]
	>([]);
	const [promediosPorViaje, setPromediosPorViaje] = useState<number[]>([]);

	useEffect(() => {
		setVueltasWithOrders(vueltas.map((vuelta) => ({ ...vuelta, orders: [] })));
	}, [vueltas]);

	useEffect(() => {
		// Actualiza el promedio cuando se actualiza vueltasWithOrders
		const nuevosPromedios = vueltasWithOrders
			.map(({ horaSalida, horaLlegada, ordersId }) => {
				if (horaSalida && horaLlegada && ordersId.length > 0) {
					const diferenciaMinutos = calcularDiferenciaHoraria(
						horaSalida,
						horaLlegada
					);
					return diferenciaMinutos / ordersId.length;
				}
				return 0;
			})
			.filter((promedio) => promedio > 0);

		setPromediosPorViaje(nuevosPromedios);
	}, [vueltasWithOrders]);

	const calcularPromedioGeneral = () => {
		if (promediosPorViaje.length === 0) return "N/A";

		const totalMinutos = promediosPorViaje.reduce(
			(total, tiempo) => total + tiempo,
			0
		);
		const promedioMinutos = totalMinutos / promediosPorViaje.length;
		const horas = Math.floor(promedioMinutos / 60);
		const minutos = Math.round(promedioMinutos % 60);

		return `${horas} horas y ${minutos} minutos`;
	};

	const handleClickVerPedidos = (ordersId: string[], fecha: string) => {
		setLoading(true);
		buscarPedidos(ordersId, fecha).then((pedidos) => {
			const vueltasConPedidos = vueltas.map((vuelta) => ({
				...vuelta,
				orders: pedidos.filter((pedido: PedidoProps) =>
					ordersId.includes(pedido.id)
				),
			}));

			setVueltasWithOrders(vueltasConPedidos);
			setLoading(false);
		});
	};

	return (
		<div className="bg-white p-3 rounded-lg shadow-md">
			<div className="mb-4 p-4 bg-gray-200 rounded-lg">
				<h2 className="text-xl font-bold">
					Tiempo promedio de entrega por pedido:
				</h2>
				<p>{calcularPromedioGeneral()}</p>
			</div>
			<ol className="relative border-s border-gray-200 dark:border-gray-700">
				{vueltasWithOrders &&
					vueltasWithOrders.map(
						({ horaSalida, horaLlegada, ordersId, fecha, orders }) => (
							<li
								key={horaSalida}
								className={`mb-10 ms-6
                  ${horaSalida && !horaLlegada && "border-blue-500"}
                  ${horaSalida && horaLlegada && "border-green-500"}
                  border-l-4
                  p-4
                  rounded-lg
                  shadow-md
                `}
							>
								{horaSalida && !horaLlegada && (
									<div className="flex items-center">
										<TruckKM />
										<span
											className="
                      bg-blue-500
                      text-white
                      px-2
                      py-1
                      rounded-md
                      mr-2
                    "
										>
											{horaSalida} (En camino)
										</span>
									</div>
								)}
								{horaSalida && horaLlegada && (
									<div className="flex items-center">
										<TruckKM />
										<span
											className="
                      bg-green-500
                      text-white
                      px-2
                      py-1
                      rounded-md
                      mr-2
                    "
										>
											{horaSalida} (Entrega completada)
										</span>
									</div>
								)}
								{ordersId && (
									<div className="flex items-center">
										<span
											className="
                      mr-2
                      px-2
                      py-1
                      rounded-md
                      bg-gray-200
                      text-gray-700
                    "
										>
											{ordersId.length} pedidos
										</span>
										<button
											className="
                        text-white
                        bg-custom-red
                        hover:bg-red-500
                        py-2
                        px-4
                        border
                        border-red-700
                        rounded
                        shadow-md
                        cursor-pointer
                      "
											onClick={() => {
												handleClickVerPedidos(ordersId, fecha);
											}}
										>
											Ver pedidos
										</button>
										{loading && (
											<div role="status">
												<svg
													aria-hidden="true"
													className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
													viewBox="0 0 100 101"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
												>
													<path
														d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
														fill="currentColor"
													/>
													<path
														d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
														fill="currentFill"
													/>
												</svg>
												<span className="sr-only">Loading...</span>
											</div>
										)}
										{orders.length > 0 && (
											<ul
												className="
                        mt-4
                        bg-gray-200
                        p-4 
                        rounded-lg
                        shadow-md
                      "
											>
												{orders.map(
													(pedido) =>
														ordersId.includes(pedido.id) && (
															<li key={pedido.id}>
																<p>{pedido.direccion}</p>
																<p>Hay: {pedido.kms}km</p>
																<p>Demora: {pedido.minutosDistancia}m</p>
															</li>
														)
												)}
											</ul>
										)}
									</div>
								)}
								{horaLlegada && (
									<div className="flex items-center">
										<TiempoCoccionSVG />
										<span>{horaLlegada}</span>
									</div>
								)}
								{horaLlegada && horaSalida && (
									<div>
										<span>Llegada: {horaLlegada}</span>
										<div>
											Diferencia:{" "}
											{calcularDiferenciaHoraria(horaSalida, horaLlegada)}{" "}
											minutos
										</div>
										<div>
											Promedio por viaje:{" "}
											{calcularPromedioTiempoPorViaje(
												horaSalida,
												horaLlegada,
												ordersId.length
											)}
										</div>
									</div>
								)}
							</li>
						)
					)}
			</ol>
		</div>
	);
};
