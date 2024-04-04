import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import React, { useState } from "react";
import {
	cleanPhoneNumber,
	getOrdersByPhoneNumber,
} from "../helpers/orderByweeks";
import { PedidoProps } from "../types/types";
import { CardOrderCliente } from "../components/Card";

export const Clientes = () => {
	const { orders, telefonos } = useSelector((state: RootState) => state.data);

	const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string | null>(
		null
	);

	const [pedidosByPhone, setPedidosByPhone] = useState<PedidoProps[] | null>(
		null
	);

	const [searchTerm, setSearchTerm] = useState<string>("");

	// Función para manejar el clic en una fila de teléfono
	const handlePhoneNumberClick = (phoneNumber: string) => {
		// Si el número de teléfono seleccionado es igual al actual, lo deseleccionamos
		setSelectedPhoneNumber((prevPhoneNumber) =>
			prevPhoneNumber === phoneNumber ? null : phoneNumber
		);

		const pedidos = getOrdersByPhoneNumber(phoneNumber, orders);
		setPedidosByPhone(pedidos);
	};
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

	// Filtrar los teléfonos según el término de búsqueda
	const filteredTelefonos = telefonos.filter((t) =>
		t.telefono.includes(searchTerm)
	);

	// Filtrar los teléfonos que tienen pedidos asociados
	const telefonosConPedidos = filteredTelefonos.filter((t) =>
		orders.some((o) => cleanPhoneNumber(o.telefono) === t.telefono)
	);

	// Función para ordenar los teléfonos según la cantidad de pedidos
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
	// Función para obtener la cantidad de pedidos por número de teléfono
	const getCantidadPedidos = (phoneNumber: string) => {
		const pedidos = orders.filter(
			(order) => cleanPhoneNumber(order.telefono) === phoneNumber
		);
		return pedidos.length;
	};

	return (
		<div className="p-4 font-antonio font-black">
			<div className="pb-4 bg-white  dark:bg-gray-900">
				<label className="sr-only">Search</label>
				<div className="relative ">
					<div className="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-2 pointer-events-none">
						<svg
							className="w-4 h-4 text-gray-500 dark:text-gray-400"
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 20 20"
						>
							<path
								stroke="currentColor"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
							/>
						</svg>
					</div>
					<input
						type="text"
						id="table-search"
						className="block p-1 ps-8  text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
						placeholder="BUSCAR CLIENTE"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
			</div>
			<table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
				<thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
					<tr>
						<th scope="col" className="px-6 py-3">
							Teléfonos
						</th>
						<th scope="col" className="px-6 py-3">
							Cantidad de Pedidos
							<button
								className="ml-2 text-xs text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
								onClick={() =>
									setSortDirection((prevDirection) =>
										prevDirection === "asc" ? "desc" : "asc"
									)
								}
							>
								{sortDirection === "asc" ? (
									<svg
										className="w-4 h-4 inline-block"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fillRule="evenodd"
											d="M5.293 6.707a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
											clipRule="evenodd"
										/>
									</svg>
								) : (
									<svg
										className="w-4 h-4 inline-block"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fillRule="evenodd"
											d="M5.293 6.707a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
											clipRule="evenodd"
										/>
									</svg>
								)}
							</button>
						</th>
					</tr>
				</thead>
				<tbody>
					{sortTelefonos().map((t, i) => (
						<React.Fragment key={i}>
							<tr
								className={`${
									selectedPhoneNumber === t.telefono ? "bg-gray-100" : ""
								} hover:bg-gray-50 cursor-pointer bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600`}
								onClick={() => handlePhoneNumberClick(t.telefono)}
							>
								<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
									{t.telefono}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
									{getCantidadPedidos(t.telefono)}
								</td>
							</tr>
							{selectedPhoneNumber === t.telefono && (
								<tr>
									<td
										colSpan={1}
										className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
									>
										{pedidosByPhone?.map((p) => (
											<CardOrderCliente p={p} />
										))}
									</td>
								</tr>
							)}
						</React.Fragment>
					))}
				</tbody>
			</table>
		</div>
	);
};
