import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
	cleanPhoneNumber,
	getOrdersByPhoneNumber,
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

	useEffect(() => {
		if (valueDate?.startDate && valueDate?.endDate) {
			const startDate = new Date(valueDate.startDate);
			const endDate = new Date(valueDate.endDate);
			endDate.setHours(23, 59, 59, 999); // Set to end of day

			console.log("Filtering orders from", startDate, "to", endDate);

			const filtered = orders.filter((order) => {
				const orderDate = new Date(order.fecha.split("/").reverse().join("-"));
				return orderDate >= startDate && orderDate <= endDate;
			});

			console.log("Filtered orders:", filtered);

			setFilteredOrders(filtered);

			// Filter telefonos based on the filtered orders
			const phonesWithOrders = new Set(
				filtered.map((order) => cleanPhoneNumber(order.telefono))
			);
			const filteredPhones = telefonos.filter((t) =>
				phonesWithOrders.has(t.telefono)
			);

			console.log("Filtered telefonos:", filteredPhones);

			setFilteredTelefonos(filteredPhones);
		} else {
			console.log("No date range selected, using all orders and telefonos");
			setFilteredOrders(orders);
			setFilteredTelefonos(telefonos);
		}
	}, [valueDate, orders, telefonos]);

	const handlePhoneNumberClick = (phoneNumber: string) => {
		setSelectedPhoneNumber((prevPhoneNumber) =>
			prevPhoneNumber === phoneNumber ? null : phoneNumber
		);
		const pedidos = getOrdersByPhoneNumber(phoneNumber, filteredOrders);
		setPedidosByPhone(pedidos);
		console.log("Pedidos for phone number", phoneNumber, ":", pedidos);
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
		const count = filteredOrders.filter(
			(order) => cleanPhoneNumber(order.telefono) === phoneNumber
		).length;
		console.log("Cantidad de pedidos para", phoneNumber, ":", count);
		return count;
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
					to="/nuevoCliente"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="h-6 mt-1"
					>
						<path d="M6.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM3.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM19.75 7.5a.75.75 0 00-1.5 0v2.25H16a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H22a.75.75 0 000-1.5h-2.25V7.5z" />
					</svg>
					<p className="font-bold">Nuevo cliente</p>
				</NavLink>
			</div>

			<div className="px-4 pb-8">
				<Calendar />
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
					<thead className="text-black border-b">
						<tr>
							<th scope="col" className="pl-4 py-2.5 w-2/5">
								Teléfono
							</th>
							<th scope="col" className="pl-4 py-2.5 w-1/6">
								Pedidos
								<button
									className="ml-2 text-xs text-black border-black border-2 hover:text-custom-red hover:bg-black"
									onClick={() =>
										setSortDirection((prevDirection) =>
											prevDirection === "asc" ? "desc" : "asc"
										)
									}
								>
									{sortDirection === "asc" ? "▲" : "▼"}
								</button>
							</th>
							<th scope="col" className="pl-4 py-2.5 w-1/6"></th>
						</tr>
					</thead>
					<tbody className="divide-y divide-black divide-opacity-20">
						{isLoading
							? Array(10)
									.fill(0)
									.map((_, index) => <LoadingSkeleton key={index} />)
							: sortTelefonos().map((t, i) => (
									<React.Fragment key={i}>
										<tr>
											<td className="pl-4 py-2.5 w-2/5 font-light">
												{t.telefono}
											</td>
											<td className="pl-4 py-2.5 w-1/6 font-light">
												{getCantidadPedidos(t.telefono)}
											</td>
											<td className="pl-4 py-2.5 w-1/6 font-light">
												<button
													className="font-bold text-custom-red hover:underline"
													onClick={() => handlePhoneNumberClick(t.telefono)}
												>
													Ver detalle
												</button>
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
