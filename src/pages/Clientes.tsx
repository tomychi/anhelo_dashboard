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
				acc[phone].push({
					total: order.total,
					items: order.detallePedido.reduce(
						(sum, item) => sum + item.quantity,
						0
					),
					fecha: order.fecha,
					couponCodes: order.couponCodes || [],
				});
				return acc;
			}, {});

			let evolutionStats = [];
			let previousAverage = null;

			for (let i = 0; i < 9; i++) {
				let totalAmount = 0;
				let totalItems = 0;
				let count = 0;
				let totalDays = 0;
				let daysCount = 0;
				let couponsCount = 0;

				Object.values(ordersByPhone).forEach((customerOrders: any[]) => {
					if (customerOrders[i]) {
						totalAmount += customerOrders[i].total;
						totalItems += customerOrders[i].items;
						count++;

						// Contar cupones solo si hay al menos un cupón válido
						if (
							customerOrders[i].couponCodes &&
							customerOrders[i].couponCodes.length > 0 &&
							customerOrders[i].couponCodes.some(
								(code) => code && code.trim() !== ""
							)
						) {
							couponsCount++;
						}

						if (i > 0 && customerOrders[i - 1]) {
							const currentDate = new Date(
								customerOrders[i].fecha.split("/").reverse().join("-")
							);
							const prevDate = new Date(
								customerOrders[i - 1].fecha.split("/").reverse().join("-")
							);
							const diffDays = Math.round(
								(currentDate - prevDate) / (1000 * 60 * 60 * 24)
							);
							totalDays += diffDays;
							daysCount++;
						}
					}
				});

				if (count > 0) {
					const averageAmount = totalAmount / count;
					const averageItems = totalItems / count;
					const percentageChange = previousAverage
						? (averageAmount / previousAverage - 1) * 100
						: 0;
					const averageDays =
						daysCount > 0 ? Math.round(totalDays / daysCount) : null;

					const previousStat = evolutionStats[i - 1];
					const itemsPercentageChange = previousStat
						? (averageItems / previousStat.averageItems - 1) * 100
						: 0;

					const ordersCountChange = previousStat
						? (count / previousStat.count - 1) * 100
						: 0;

					const couponPercentage = (couponsCount / count) * 100;
					const couponPercentageChange = previousStat
						? (couponPercentage / previousStat.couponPercentage - 1) * 100
						: 0;

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
					});

					previousAverage = averageAmount;
				}
			}

			setTicketEvolution(evolutionStats); // Calcular estadísticas para pedidos 10+
			const laterOrders = {
				totalAmount: 0,
				totalItems: 0,
				count: 0,
				averageItems: 0,
				averageAmount: 0,
				percentageChange: 0,
				itemsPercentageChange: 0,
				ordersCountChange: 0,
				couponPercentage: 0,
				couponPercentageChange: 0,
			};

			let couponsCount = 0;
			Object.values(ordersByPhone).forEach((customerOrders: any[]) => {
				const laterOrdersForCustomer = customerOrders.slice(9);
				laterOrdersForCustomer.forEach((order) => {
					laterOrders.totalAmount += order.total;
					laterOrders.totalItems += order.items;
					laterOrders.count++;

					// Contar cupones solo si hay al menos un cupón válido
					if (
						order.couponCodes &&
						order.couponCodes.length > 0 &&
						order.couponCodes.some((code) => code && code.trim() !== "")
					) {
						couponsCount++;
					}
				});
			});

			if (laterOrders.count > 0) {
				laterOrders.averageAmount = laterOrders.totalAmount / laterOrders.count;
				laterOrders.averageItems = laterOrders.totalItems / laterOrders.count;
				laterOrders.couponPercentage = (couponsCount / laterOrders.count) * 100;

				if (evolutionStats.length > 0) {
					const lastStat = evolutionStats[evolutionStats.length - 1];
					laterOrders.percentageChange =
						(laterOrders.averageAmount / lastStat.averageAmount - 1) * 100;
					laterOrders.itemsPercentageChange =
						(laterOrders.averageItems / lastStat.averageItems - 1) * 100;
					laterOrders.ordersCountChange =
						(laterOrders.count / lastStat.count - 1) * 100;
					laterOrders.couponPercentageChange =
						(laterOrders.couponPercentage / lastStat.couponPercentage - 1) *
						100;
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
	};

	const telefonosConPedidos = filteredTelefonos.filter((t) =>
		t.telefono.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const sortTelefonos = () => {
		return telefonosConPedidos.sort((a, b) => {
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

				<div className="bg-white p-4 rounded-md mb-4 shadow-sm">
					<h3 className="text-lg font-bold mb-4">Customer Journey Map</h3>
					<div className="space-y-2">
						{ticketEvolution.map((stat, index) => (
							<div
								key={index}
								className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
							>
								<div className="flex-1">
									<span className="font-medium">Pedido {stat.position}: </span>
									<span className="text-green-600">
										${stat.averageAmount.toFixed(0)}
									</span>
									{stat.position > 1 && (
										<>
											<span
												className={`ml-2 text-sm ${
													stat.percentageChange > 0
														? "text-green-600"
														: "text-red-600"
												}`}
											>
												({stat.percentageChange > 0 ? "+" : ""}
												{stat.percentageChange.toFixed(1)}%)
											</span>
											{stat.averageDays && (
												<span className="text-gray-500 text-sm">
													({stat.averageDays} días después)
												</span>
											)}
										</>
									)}
									<span className="text-gray-500 text-sm ml-2">
										(Basado en {stat.count} pedidos
										{stat.position > 1 && (
											<span
												className={`${
													stat.ordersCountChange > 0
														? "text-green-600"
														: "text-red-600"
												}`}
											>
												{" "}
												({stat.ordersCountChange > 0 ? "+" : ""}
												{stat.ordersCountChange.toFixed(1)}%)
											</span>
										)}
										)
									</span>
									<span className="text-gray-600 text-sm ml-2">
										({stat.averageItems.toFixed(1)} productos
										{stat.position > 1 && (
											<span
												className={`${
													stat.itemsPercentageChange > 0
														? "text-green-600"
														: "text-red-600"
												}`}
											>
												{" "}
												({stat.itemsPercentageChange > 0 ? "+" : ""}
												{stat.itemsPercentageChange.toFixed(1)}%)
											</span>
										)}
										)
									</span>
									{stat.couponPercentage > 0 && (
										<span className="text-gray-600 text-sm ml-2">
											(con cupones {stat.couponPercentage.toFixed(1)}%
											{stat.position > 1 && (
												<span
													className={`${
														stat.couponPercentageChange > 0
															? "text-green-600"
															: "text-red-600"
													}`}
												>
													{" "}
													({stat.couponPercentageChange > 0 ? "+" : ""}
													{stat.couponPercentageChange.toFixed(1)}%)
												</span>
											)}
											)
										</span>
									)}
								</div>
							</div>
						))}

						{laterOrdersStats && (
							<div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded bg-gray-100">
								<div className="flex-1">
									<span className="font-medium">Pedidos 10+: </span>
									<span className="text-green-600">
										${laterOrdersStats.averageAmount.toFixed(0)}
									</span>
									{ticketEvolution.length > 0 && (
										<span
											className={`ml-2 text-sm ${
												laterOrdersStats.percentageChange > 0
													? "text-green-600"
													: "text-red-600"
											}`}
										>
											({laterOrdersStats.percentageChange > 0 ? "+" : ""}
											{laterOrdersStats.percentageChange.toFixed(1)}%)
										</span>
									)}
									<span className="text-gray-500 text-sm ml-2">
										(Basado en {laterOrdersStats.count} pedidos
										{ticketEvolution.length > 0 && (
											<span
												className={`${
													laterOrdersStats.ordersCountChange > 0
														? "text-green-600"
														: "text-red-600"
												}`}
											>
												{" "}
												({laterOrdersStats.ordersCountChange > 0 ? "+" : ""}
												{laterOrdersStats.ordersCountChange.toFixed(1)}%)
											</span>
										)}
										)
									</span>
									<span className="text-gray-600 text-sm ml-2">
										({laterOrdersStats.averageItems.toFixed(1)} productos
										{ticketEvolution.length > 0 && (
											<span
												className={`${
													laterOrdersStats.itemsPercentageChange > 0
														? "text-green-600"
														: "text-red-600"
												}`}
											>
												{" "}
												({laterOrdersStats.itemsPercentageChange > 0 ? "+" : ""}
												{laterOrdersStats.itemsPercentageChange.toFixed(1)}%)
											</span>
										)}
										)
									</span>
									{laterOrdersStats.couponPercentage > 0 && (
										<span className="text-gray-600 text-sm ml-2">
											(con cupones{" "}
											{laterOrdersStats.couponPercentage.toFixed(1)}%
											{ticketEvolution.length > 0 && (
												<span
													className={`${
														laterOrdersStats.couponPercentageChange > 0
															? "text-green-600"
															: "text-red-600"
													}`}
												>
													{" "}
													(
													{laterOrdersStats.couponPercentageChange > 0
														? "+"
														: ""}
													{laterOrdersStats.couponPercentageChange.toFixed(1)}%)
												</span>
											)}
											)
										</span>
									)}
								</div>
							</div>
						)}
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
