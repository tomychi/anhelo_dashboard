import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
	cleanPhoneNumber,
	getOrdersByPhoneNumber,
	getCustomers,
} from "../helpers/orderByweeks";
import { PedidoProps } from "../types/types";
import { CardOrderCliente } from "../components/Card";
import { NavLink } from "react-router-dom";
import arrow from "../assets/arrowIcon.png";
import Calendar from "../components/Calendar";

interface LoadingElementProps {
	className: string;
	width?: number | string;
}

const LoadingElement: React.FC<LoadingElementProps> = ({
	className,
	width,
}) => (
	<div
		className={`bg-gray-200 rounded overflow-hidden ${className}`}
		style={{ width }}
	>
		<motion.div
			className="h-full w-full bg-gradient-to-r from-gray-200 via-white to-gray-200"
			animate={{ x: ["100%", "-100%"] }}
			transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
		/>
	</div>
);

export const Clientes = () => {
	const { orders, telefonos, valueDate, isLoading } = useSelector(
		(state: RootState) => state.data
	);

	const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string | null>(
		null
	);
	const [pedidosByPhone, setPedidosByPhone] = useState<PedidoProps[] | null>(
		null
	);
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
	const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
	const [filteredOrders, setFilteredOrders] = useState(orders);
	const [filteredTelefonos, setFilteredTelefonos] = useState(telefonos);
	const [newCustomers, setNewCustomers] = useState<string[]>([]);
	const [ticketEvolution, setTicketEvolution] = useState<any[]>([]);
	const [laterOrdersStats, setLaterOrdersStats] = useState<any>(null);

	// Función auxiliar para cálculos seguros de cambio porcentual
	const calculatePercentageChange = (
		current: number,
		previous: number | undefined
	): number | string => {
		if (previous === undefined || previous === 0) {
			if (current === 0) return 0; // Sin cambio
			return "N/A"; // Cambio no aplicable
		}
		const change = (current / previous - 1) * 100;
		return isFinite(change) ? change : "N/A";
	};

	useEffect(() => {
		if (valueDate?.startDate && valueDate?.endDate) {
			const startDate = new Date(valueDate.startDate);
			const endDate = new Date(valueDate.endDate);
			endDate.setHours(23, 59, 59, 999);

			const filtered = orders.filter((order) => {
				const orderDate = new Date(order.fecha.split("/").reverse().join("-"));
				return orderDate >= startDate && orderDate <= endDate;
			});

			setFilteredOrders(filtered);

			const phonesWithOrders = new Set(
				filtered.map((order) => cleanPhoneNumber(order.telefono))
			);
			const filteredPhones = telefonos.filter((t) =>
				phonesWithOrders.has(t.telefono)
			);

			setFilteredTelefonos(filteredPhones);

			const { newCustomers } = getCustomers(telefonos, filtered, startDate);
			setNewCustomers(newCustomers.map((customer) => customer.telefono));

			const ordersByPhone = filtered.reduce((acc, order) => {
				const phone = order.telefono;
				if (!acc[phone]) acc[phone] = [];

				// Verificar si hay algún producto 2x1 en el pedido
				const has2x1Promo = order.detallePedido.some((item) =>
					item.burger.toLowerCase().startsWith("2x1")
				);

				acc[phone].push({
					total: order.total,
					items: order.detallePedido.reduce(
						(sum, item) => sum + item.quantity,
						0
					),
					fecha: order.fecha,
					couponCodes: order.couponCodes || [],
					has2x1Promo,
				});
				return acc;
			}, {});

			// **Añadir console.log para un cliente de ejemplo con al menos 4 pedidos**
			const clienteEjemploTelefono = Object.keys(ordersByPhone).find(
				(phone) => ordersByPhone[phone].length >= 4
			);

			if (clienteEjemploTelefono) {
				console.log(
					"Cliente en el grupo Pedido 4:",
					clienteEjemploTelefono,
					ordersByPhone[clienteEjemploTelefono]
				);
			} else {
				console.log("No se encontró ningún cliente con al menos 4 pedidos.");
			}

			let evolutionStats = [];
			let previousAverage = null;

			for (let i = 0; i < 9; i++) {
				let totalAmount = 0;
				let totalItems = 0;
				let count = 0;
				let totalDays = 0;
				let daysCount = 0;
				let couponsCount = 0;
				let promos2x1Count = 0;

				Object.values(ordersByPhone).forEach((customerOrders: any[]) => {
					if (customerOrders[i]) {
						totalAmount += customerOrders[i].total;
						totalItems += customerOrders[i].items;
						count++;

						if (
							customerOrders[i].couponCodes &&
							customerOrders[i].couponCodes.length > 0 &&
							customerOrders[i].couponCodes.some(
								(code) => code && code.trim() !== ""
							)
						) {
							couponsCount++;
						}

						if (customerOrders[i].has2x1Promo) {
							promos2x1Count++;
						}

						if (i > 0 && customerOrders[i - 1]) {
							const currentDate = new Date(
								customerOrders[i].fecha.split("/").reverse().join("-")
							);
							const prevDate = new Date(
								customerOrders[i - 1].fecha.split("/").reverse().join("-")
							);
							const diffDays = Math.round(
								(currentDate.getTime() - prevDate.getTime()) /
									(1000 * 60 * 60 * 24)
							);
							totalDays += diffDays;
							daysCount++;
						}
					}
				});

				if (count > 0) {
					const averageAmount = totalAmount / count;
					const averageItems = totalItems / count;
					const percentageChange = calculatePercentageChange(
						averageAmount,
						previousAverage
					);
					const averageDays =
						daysCount > 0 ? Math.round(totalDays / daysCount) : null;

					const previousStat = evolutionStats[i - 1];
					const itemsPercentageChange = calculatePercentageChange(
						averageItems,
						previousStat?.averageItems
					);
					const ordersCountChange = calculatePercentageChange(
						count,
						previousStat?.count
					);

					const couponPercentage = (couponsCount / count) * 100;
					const couponPercentageChange = calculatePercentageChange(
						couponPercentage,
						previousStat?.couponPercentage
					);

					const promo2x1Percentage = (promos2x1Count / count) * 100;
					const promo2x1PercentageChange = calculatePercentageChange(
						promo2x1Percentage,
						previousStat?.promo2x1Percentage
					);

					evolutionStats.push({
						position: i + 1,
						averageAmount,
						averageItems,
						totalItems,
						count,
						percentageChange,
						itemsPercentageChange,
						averageDays,
						ordersCountChange,
						couponPercentage,
						couponPercentageChange,
						promo2x1Percentage,
						promo2x1PercentageChange,
					});

					previousAverage = averageAmount;
				}
			}

			setTicketEvolution(evolutionStats);

			// Calcular estadísticas para pedidos 10+
			const laterOrders = {
				totalAmount: 0,
				totalItems: 0,
				count: 0,
				averageItems: 0,
				averageAmount: 0,
				percentageChange: "N/A",
				itemsPercentageChange: "N/A",
				ordersCountChange: "N/A",
				couponPercentage: 0,
				couponPercentageChange: "N/A",
				promo2x1Percentage: 0,
				promo2x1PercentageChange: "N/A",
			};

			let couponsCountLater = 0;
			let promos2x1CountLater = 0;
			Object.values(ordersByPhone).forEach((customerOrders: any[]) => {
				const laterOrdersForCustomer = customerOrders.slice(9);
				laterOrdersForCustomer.forEach((order) => {
					laterOrders.totalAmount += order.total;
					laterOrders.totalItems += order.items;
					laterOrders.count++;

					if (
						order.couponCodes &&
						order.couponCodes.length > 0 &&
						order.couponCodes.some((code) => code && code.trim() !== "")
					) {
						couponsCountLater++;
					}

					if (order.has2x1Promo) {
						promos2x1CountLater++;
					}
				});
			});

			if (laterOrders.count > 0) {
				laterOrders.averageAmount = laterOrders.totalAmount / laterOrders.count;
				laterOrders.averageItems = laterOrders.totalItems / laterOrders.count;
				laterOrders.couponPercentage =
					(couponsCountLater / laterOrders.count) * 100;
				laterOrders.promo2x1Percentage =
					(promos2x1CountLater / laterOrders.count) * 100;

				if (evolutionStats.length > 0) {
					const lastStat = evolutionStats[evolutionStats.length - 1];
					laterOrders.percentageChange = calculatePercentageChange(
						laterOrders.averageAmount,
						lastStat.averageAmount
					);
					laterOrders.itemsPercentageChange = calculatePercentageChange(
						laterOrders.averageItems,
						lastStat.averageItems
					);
					laterOrders.ordersCountChange = calculatePercentageChange(
						laterOrders.count,
						lastStat.count
					);
					laterOrders.couponPercentageChange = calculatePercentageChange(
						laterOrders.couponPercentage,
						lastStat.couponPercentage
					);
					laterOrders.promo2x1PercentageChange = calculatePercentageChange(
						laterOrders.promo2x1Percentage,
						lastStat.promo2x1Percentage
					);
				}

				setLaterOrdersStats(laterOrders);
			} else {
				setLaterOrdersStats(null);
			}
		} else {
			setFilteredOrders(orders);
			setFilteredTelefonos(telefonos);
			setNewCustomers([]);
			setTicketEvolution([]);
			setLaterOrdersStats(null);
		}
	}, [valueDate, orders, telefonos]);

	const averageOrdersPerPhoneNumber =
		filteredTelefonos.length > 0
			? (filteredOrders.length / filteredTelefonos.length).toFixed(2)
			: "N/A";

	const handlePhoneNumberClick = (phoneNumber: string) => {
		setSelectedPhoneNumber((prevPhoneNumber) =>
			prevPhoneNumber === phoneNumber ? null : phoneNumber
		);
		const pedidos = getOrdersByPhoneNumber(phoneNumber, filteredOrders);
		setPedidosByPhone(pedidos);

		// **Añadir console.log para el cliente seleccionado**
		console.log("Detalles del cliente seleccionado:", phoneNumber, pedidos);
	};

	const telefonosConPedidos = filteredTelefonos.filter((t) =>
		t.telefono.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const sortTelefonos = () => {
		return [...telefonosConPedidos].sort((a, b) => {
			const countA = getCantidadPedidos(a.telefono);
			const countB = getCantidadPedidos(b.telefono);
			if (sortDirection === "desc") {
				return countB - countA;
			} else {
				return countA - countB;
			}
		});
	};

	const getCantidadPedidos = (phoneNumber: string) => {
		return filteredOrders.filter(
			(order) => cleanPhoneNumber(order.telefono) === phoneNumber
		).length;
	};

	const LoadingSkeleton = () => (
		<tr className="border-b border-black border-opacity-20">
			<td className="pl-4 py-2.5 w-2/5">
				<LoadingElement className="h-4 w-3/4" />
			</td>
			<td className="pl-4 py-2.5 w-1/6">
				<LoadingElement className="h-4 w-1/2" />
			</td>
			<td className="pl-4 py-2.5 w-1/6">
				<LoadingElement className="h-4 w-3/4" />
			</td>
		</tr>
	);

	return (
		<div className="flex flex-col">
			<style>
				{`
                    .arrow-down {
                        transition: transform 0.3s ease;
                        transform: rotate(90deg);
                    }
                    .arrow-down.open {
                        transform: rotate(-90deg);
                    }
                    .journey-map {
                        position: relative;
                        margin: 40px 0;
                        height: 200px; /* Incrementado para acomodar etiquetas */
                    }
                    .journey-line {
                        position: absolute;
                        top: 50%;
                        left: 5%;
                        right: 5%;
                        height: 2px;
                        background-color: black;
                        z-index: 1;
                    }
                    .journey-point {
                        position: absolute;
                        top: 50%;
                        transform: translate(-50%, -50%);
                        width: 12px;
                        height: 12px;
                        background-color: black;
                        border-radius: 50%;
                        cursor: pointer;
                        z-index: 2;
                    }
                    .journey-label {
                        position: absolute;
                        top: 60%;
                        transform: translateX(-50%);
                        background-color: white;
                        padding: 8px 12px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        font-size: 12px;
                        text-align: left;
                        margin-top: 8px;
                        width: max-content;
                        max-width: 200px;
                        word-wrap: break-word;
                    }
                    .variation-positive {
                        color: green;
                    }
                    .variation-negative {
                        color: red;
                    }
                    .variation-neutral {
                        color: gray;
                    }
                    @media (max-width: 768px) {
                        .journey-map {
                            height: 240px;
                        }
                        .journey-label {
                            font-size: 10px;
                            max-width: 150px;
                        }
                    }
                `}
			</style>
			<div className="flex flex-row justify-between font-coolvetica items-center mt-8 mx-4 mb-4">
				<p className="text-black font-bold text-4xl mt-1">Clientes</p>
				<NavLink
					className="bg-gray-300 gap-2 text-black rounded-full flex items-center pt-3 pb-4 pl-3 pr-4 h-10"
					to="/clientesAnalisis"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="h-6 mt-1"
					>
						<path
							fillRule="evenodd"
							d="M2.25 2.25a.75.75 0 0 0 0 1.5H3v10.5a3 3 0 0 0 3 3h1.21l-1.172 3.513a.75.75 0 0 0 1.424.474l.329-.987h8.418l.33.987a.75.75 0 0 0 1.422-.474l-1.17-3.513H18a3 3 0 0 0 3-3V3.75h.75a.75.75 0 0 0 0-1.5H2.25Zm6.54 15h6.42l.5 1.5H8.29l.5-1.5Zm8.085-8.995a.75.75 0 1 0-.75-1.299 12.81 12.81 0 0 0-3.558 3.05L11.03 8.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l2.47-2.47 1.617 1.618a.75.75 0 0 0 1.146-.102 11.312 11.312 0 0 1 3.612-3.321Z"
							clipRule="evenodd"
						/>
					</svg>

					<p className="font-bold">Ver análisis</p>
				</NavLink>
			</div>

			<div className="px-4 pb-8">
				<Calendar />

				<div className="bg-gray-100 p-4 rounded-md mb-4">
					<p className="text-black font-bold">
						Pedidos: {filteredOrders.length}, Teléfonos:{" "}
						{filteredTelefonos.length}
					</p>
					<p className="text-black font-bold">
						Cantidad promedio de pedidos por número de teléfono:{" "}
						{averageOrdersPerPhoneNumber}
					</p>
				</div>

				{/* Customer Journey Map */}
				<div className="bg-gray-300 pt-6 pb-4 px-4 rounded-xl mb-6">
					<h3 className="text-4xl font-bold mb-6 text-gray-900 text-center">
						Comportamiento del Cliente
					</h3>

					<div className="relative">
						{/* Timeline base */}
						<div
							className="absolute left-0 right-0 h-1 bg-black"
							style={{ top: "40px" }}
						/>

						{/* Journey Points and Cards */}
						<div className="flex justify-between relative ">
							{ticketEvolution.map((stat, index) => {
								const totalPoints =
									ticketEvolution.length + (laterOrdersStats ? 1 : 0);
								return (
									<div
										key={index}
										className="relative"
										style={{ width: `${95 / totalPoints}%` }}
									>
										{/* Point */}
										<div
											className="absolute left-1/2 -translate-x-1/2"
											style={{ top: "34px" }}
										>
											<div className="w-4 h-4 bg-black " />
										</div>

										{/* Content Card */}
										<div className="mt-16 bg-gray-100 rounded-lg py-4  text-center">
											<div className="mb-3 pb-2 w-full border-b border-gray-200">
												<span className="text-sm font-semibold text-gray-900">
													Pedido {stat.position}
												</span>
											</div>

											<div className="space-y-2.5 text-sm">
												<div className="flex flex-col items-center">
													<span className="text-gray-600">Monto</span>
													<div>
														<span className="font-medium">
															${stat.averageAmount.toFixed(2)}{" "}
														</span>
														{typeof stat.percentageChange === "number" && (
															<span
																className={`text-xs ${
																	stat.percentageChange > 0
																		? "text-emerald-600"
																		: stat.percentageChange < 0
																		? "text-red-500"
																		: "text-gray-400"
																}`}
															>
																({stat.percentageChange > 0 ? "+" : ""}
																{stat.percentageChange.toFixed(1)}%)
															</span>
														)}
													</div>
												</div>

												<div className="flex flex-col items-center">
													<span className="text-gray-600">Pedidos</span>
													<div>
														<span className="font-medium">{stat.count} </span>
														{typeof stat.ordersCountChange === "number" && (
															<span
																className={`text-xs ${
																	stat.ordersCountChange > 0
																		? "text-emerald-600"
																		: stat.ordersCountChange < 0
																		? "text-red-500"
																		: "text-gray-400"
																}`}
															>
																({stat.ordersCountChange > 0 ? "+" : ""}
																{stat.ordersCountChange.toFixed(1)}%)
															</span>
														)}
													</div>
												</div>

												<div className="flex flex-col items-center">
													<span className="text-gray-600">Cupones</span>
													<div>
														<span className="font-medium">
															{stat.couponPercentage.toFixed(1)}%{" "}
														</span>
														{typeof stat.couponPercentageChange ===
															"number" && (
															<span
																className={`text-xs ${
																	stat.couponPercentageChange > 0
																		? "text-emerald-600"
																		: stat.couponPercentageChange < 0
																		? "text-red-500"
																		: "text-gray-400"
																}`}
															>
																({stat.couponPercentageChange > 0 ? "+" : ""}
																{stat.couponPercentageChange.toFixed(1)}%)
															</span>
														)}
													</div>
												</div>

												<div className="flex flex-col items-center">
													<span className="text-gray-600">2x1</span>
													<div>
														<span className="font-medium">
															{stat.promo2x1Percentage.toFixed(1)}%{" "}
														</span>
														{typeof stat.promo2x1PercentageChange ===
															"number" && (
															<span
																className={`text-xs ${
																	stat.promo2x1PercentageChange > 0
																		? "text-emerald-600"
																		: stat.promo2x1PercentageChange < 0
																		? "text-red-500"
																		: "text-gray-400"
																}`}
															>
																({stat.promo2x1PercentageChange > 0 ? "+" : ""}
																{stat.promo2x1PercentageChange.toFixed(1)}%)
															</span>
														)}
													</div>
												</div>

												{stat.averageDays && (
													<div className="flex flex-col items-center pt-2 border-t border-gray-100">
														<span className="text-gray-600">Días</span>
														<span className="font-medium">
															{stat.averageDays}
														</span>
													</div>
												)}
											</div>
										</div>
									</div>
								);
							})}

							{/* 10+ Orders Point */}
							{laterOrdersStats && (
								<div
									className="relative"
									style={{ width: `${95 / (ticketEvolution.length + 1)}%` }}
								>
									<div
										className="absolute left-1/2 -translate-x-1/2"
										style={{ top: "34px" }}
									>
										<div className="w-4 h-4 bg-black " />
									</div>

									<div className="mt-16 bg-gray-100 rounded-lg py-4  text-center">
										<div className="mb-3 pb-2 border-b w-full border-gray-200">
											<span className="text-sm font-semibold text-gray-900">
												Pedidos 10+
											</span>
										</div>

										<div className="space-y-2.5 text-sm">
											<div className="flex flex-col items-center">
												<span className="text-gray-600">Monto</span>
												<div>
													<span className="font-medium">
														${laterOrdersStats.averageAmount.toFixed(2)}{" "}
													</span>
													{typeof laterOrdersStats.percentageChange ===
														"number" && (
														<span
															className={`text-xs ${
																laterOrdersStats.percentageChange > 0
																	? "text-emerald-600"
																	: laterOrdersStats.percentageChange < 0
																	? "text-red-500"
																	: "text-gray-400"
															}`}
														>
															(
															{laterOrdersStats.percentageChange > 0 ? "+" : ""}
															{laterOrdersStats.percentageChange.toFixed(1)}%)
														</span>
													)}
												</div>
											</div>

											<div className="flex flex-col items-center">
												<span className="text-gray-600">Pedidos</span>
												<div>
													<span className="font-medium">
														{laterOrdersStats.count}{" "}
													</span>
													{typeof laterOrdersStats.ordersCountChange ===
														"number" && (
														<span
															className={`text-xs ${
																laterOrdersStats.ordersCountChange > 0
																	? "text-emerald-600"
																	: laterOrdersStats.ordersCountChange < 0
																	? "text-red-500"
																	: "text-gray-400"
															}`}
														>
															(
															{laterOrdersStats.ordersCountChange > 0
																? "+"
																: ""}
															{laterOrdersStats.ordersCountChange.toFixed(1)}%)
														</span>
													)}
												</div>
											</div>

											<div className="flex flex-col items-center">
												<span className="text-gray-600">Cupones</span>
												<div>
													<span className="font-medium">
														{laterOrdersStats.couponPercentage.toFixed(1)}%{" "}
													</span>
													{typeof laterOrdersStats.couponPercentageChange ===
														"number" && (
														<span
															className={`text-xs ${
																laterOrdersStats.couponPercentageChange > 0
																	? "text-emerald-600"
																	: laterOrdersStats.couponPercentageChange < 0
																	? "text-red-500"
																	: "text-gray-400"
															}`}
														>
															(
															{laterOrdersStats.couponPercentageChange > 0
																? "+"
																: ""}
															{laterOrdersStats.couponPercentageChange.toFixed(
																1
															)}
															%)
														</span>
													)}
												</div>
											</div>

											<div className="flex flex-col items-center">
												<span className="text-gray-600">2x1</span>
												<div>
													<span className="font-medium">
														{laterOrdersStats.promo2x1Percentage.toFixed(1)}%{" "}
													</span>
													{typeof laterOrdersStats.promo2x1PercentageChange ===
														"number" && (
														<span
															className={`text-xs ${
																laterOrdersStats.promo2x1PercentageChange > 0
																	? "text-emerald-600"
																	: laterOrdersStats.promo2x1PercentageChange <
																	  0
																	? "text-red-500"
																	: "text-gray-400"
															}`}
														>
															(
															{laterOrdersStats.promo2x1PercentageChange > 0
																? "+"
																: ""}
															{laterOrdersStats.promo2x1PercentageChange.toFixed(
																1
															)}
															%)
														</span>
													)}
												</div>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				<div className="flex flex-row gap-2 mt-2">
					<div className="relative flex items-center pr-2 w-1/3 h-10 gap-1 rounded-lg border-4 border-black focus:ring-0 font-coolvetica justify-between text-black text-xs font-light">
						<div
							className="flex flex-row items-center gap-1 cursor-pointer"
							onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="1.5"
								stroke="currentColor"
								className="h-6 ml-1.5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
								/>
							</svg>
							<p>Todos </p>
						</div>
						<img
							src={arrow}
							className={`h-2 arrow-down ${showCategoryDropdown ? "open" : ""}`}
							alt=""
						/>
					</div>
					<div className="flex items-center w-2/3 h-10 gap-1 rounded-lg border-4 border-black focus:ring-0 font-coolvetica text-black text-xs font-light">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth="1.5"
							stroke="currentColor"
							className="h-6 ml-1.5 mb-0.5"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
							/>
						</svg>
						<input
							type="text"
							placeholder="Buscar cliente"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full bg-transparent outline-none"
						/>
					</div>
				</div>
			</div>

			<div className="font-coolvetica">
				<table className="w-full text-xs text-left text-black">
					<thead className="text-black border-b h-10">
						<tr>
							<th scope="col" className="pl-4  w-2/5">
								Teléfono
							</th>
							<th scope="col" className="pl-4  w-1/6">
								Pedidos
								<button
									className="ml-2  text-xs text-black"
									onClick={() =>
										setSortDirection((prevDirection) =>
											prevDirection === "asc" ? "desc" : "asc"
										)
									}
								>
									<img
										src={arrow}
										alt="Sort"
										className={`h-2 inline-block transition-transform duration-300 ${
											sortDirection === "asc" ? "-rotate-90" : "rotate-90"
										}`}
									/>
								</button>
							</th>
							<th scope="col" className="pl-4 w-1/6"></th>
						</tr>
					</thead>
					<tbody className="divide-y divide-black divide-opacity-20">
						{isLoading
							? Array(10)
									.fill(0)
									.map((_, index) => <LoadingSkeleton key={index} />)
							: sortTelefonos().map((t, i) => (
									<React.Fragment key={i}>
										<tr className="text-black border font-light h-10 border-black border-opacity-20">
											<td scope="row" className="pl-4  w-2/5 font-light">
												{t.telefono}
												{newCustomers.includes(t.telefono) && (
													<span className="bg-black text-white font-bold  py-1 px-2  ml-2 rounded-full">
														Nuevo
													</span>
												)}
											</td>
											<td className="pl-4  w-1/6 font-light">
												{getCantidadPedidos(t.telefono)}
											</td>
											<td className="pl-4 pr-4 w-1/7 font-black text-2xl flex items-center justify-end h-full relative">
												<p
													onClick={() => handlePhoneNumberClick(t.telefono)}
													className="absolute top-[-4px] cursor-pointer"
												>
													. . .
												</p>
											</td>
										</tr>
										{selectedPhoneNumber === t.telefono && (
											<tr>
												<td colSpan={3}>
													<div className="py-4">
														<div className="flex flex-row gap-4">
															{pedidosByPhone?.map((p) => (
																<CardOrderCliente key={p.id} p={p} />
															))}
														</div>
													</div>
												</td>
											</tr>
										)}
									</React.Fragment>
							  ))}
					</tbody>
				</table>
			</div>
		</div>
	);
};
