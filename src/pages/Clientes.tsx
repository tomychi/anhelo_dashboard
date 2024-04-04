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
	const { orders, telefonos, expenseData, facturacionTotal, neto } =
		useSelector((state: RootState) => state.data);

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

	//Base de clientes
	const cantidadNumerosTelefono = telefonos.length;

	// Función para filtrar los elementos de expenseData cuya propiedad category sea "Ads" y sumar el valor de la propiedad 'total'
	const calcularTotalAds = () => {
		// Filtrar los elementos de expenseData cuya propiedad category sea "Ads"
		const expenseDataAds = expenseData.filter(
			(item) => item.category === "Ads"
		);

		// Sumar el valor de la propiedad 'total' de cada elemento en expenseDataAds
		const totalAds = expenseDataAds.reduce(
			(total, item) => total + item.total,
			0
		);

		return totalAds;
	};

	// Función para filtrar los objetos cuyo nombre sea "SUELDO FIJO MARKETING" o "SUELDO VARIABLE MARKETING" y sumar la propiedad "Total"
	const calcularTotalInversionMarketing = () => {
		// Filtrar los objetos cuyo nombre sea "SUELDO FIJO MARKETING" o "SUELDO VARIABLE MARKETING"
		const inversionMarketing = expenseData.filter(
			(item) =>
				item.category === "Sueldos" &&
				(item.name === "SUELDO FIJO MARKETING" ||
					item.name === "SUELDO VARIABLE MARKETING")
		);

		// Sumar la propiedad "Total" de los objetos filtrados
		const totalInversionMarketing = inversionMarketing.reduce(
			(total, item) => total + item.total,
			0
		);

		return totalInversionMarketing;
	};

	//CAC
	const cac = parseFloat(
		(
			(calcularTotalAds() + calcularTotalInversionMarketing()) /
			orders.length
		).toFixed(2)
	);

	const ticketBrutoPromedio = facturacionTotal / orders.length;
	const ticketNetoPromedio = neto / orders.length;

	//Life time value averague section

	// Función para obtener la cantidad de pedidos por número de teléfono
	const getCantidadPedidos = (phoneNumber: string) => {
		const pedidos = orders.filter(
			(order) => cleanPhoneNumber(order.telefono) === phoneNumber
		);
		return pedidos.length;
	};

	// Calcular el promedio de pedidos por número de teléfono
	// Función para contar cuántas veces se repite un teléfono en la lista de pedidos
	const contarRepeticionesTelefono = () => {
		const telefonoCount: { [telefono: string]: number } = {}; // Objeto para almacenar el recuento de cada número de teléfono

		// Recorrer la lista de pedidos
		orders.forEach((order) => {
			const telefono = order.telefono;

			// Verificar si el número de teléfono ya está en el objeto de recuento
			if (telefonoCount[telefono]) {
				// Si ya existe, incrementa su contador
				telefonoCount[telefono]++;
			} else {
				// Si no existe, inicializa su contador en 1
				telefonoCount[telefono] = 1;
			}
		});

		return telefonoCount;
	};

	// Función para calcular el promedio de pedidos por número de teléfono
	const calcularPromedioPedidosPorTelefono = () => {
		const repeticionesTelefono = contarRepeticionesTelefono();
		const numerosTelefonosUnicos = Object.keys(repeticionesTelefono).length;
		const totalPedidos = orders.length;

		// Calcular el promedio
		const promedio = totalPedidos / numerosTelefonosUnicos;
		return promedio;
	};

	// Llamar a la función para obtener el promedio de pedidos por número de teléfono
	const promedioPedidosPorTelefono = calcularPromedioPedidosPorTelefono();

	const brutoReportedBeforeDie =
		ticketBrutoPromedio * promedioPedidosPorTelefono;

	const netoReportedBeforeDie = ticketNetoPromedio * promedioPedidosPorTelefono;

	// Calcular la suma de todos los gastos que no sean de la categoría "ingredientes"

	const totalGastos = expenseData.reduce((total, expense) => {
		// Excluir los gastos que tengan la categoría "ingredientes"
		if (
			expense.category !== "ingredientes" &&
			expense.category !== "igredientes" &&
			expense.category !== "bebidas" &&
			expense.category !== "packaging" &&
			expense.category !== "Infraestructura" &&
			expense.name !== "carne"
		) {
			return total + expense.total;
		} else {
			return total;
		}
	}, 0);

	// Calcular el balance mensual (neto - gastos)
	const balanceMensual = neto - totalGastos;
	const rentabilidadPromedioFinal =
		(balanceMensual / orders.length) * promedioPedidosPorTelefono;

	const costoDeOperaciones = ticketNetoPromedio - rentabilidadPromedioFinal;

	return (
		<div className="p-4 font-antonio">
			<div className="flex flex-row gap-4 mb-4">
				<div>
					<div className="relative ">
						<div className="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-4 pointer-events-none">
							<svg
								className="w-4 h-4 text-red-main"
								aria-hidden="true"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 20 20"
							>
								<path
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
								/>
							</svg>
						</div>
						<input
							type="text"
							id="table-search"
							className="block p-4 ps-12  border-2 border-red-main w-80 bg-black"
							placeholder="BUSCAR CLIENTE"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
				</div>
				<div className="bg-custom-red p-4 font-black">
					BASE DE CLIENTES ALL TIME: {cantidadNumerosTelefono}
				</div>
				<div className="bg-custom-red p-4 font-black">
					PEDIDOS POR CLIENTE: {""}
					{promedioPedidosPorTelefono.toFixed(2)}
				</div>
				<div className="bg-custom-red p-4 font-black">
					COSTO DE ADQUISICION DE CLIENTES: ${cac}
				</div>
				<div className="bg-custom-red p-4 font-black">
					COSTO DE OPERACIONES: ${costoDeOperaciones.toFixed(2)}
				</div>

				<div className="bg-custom-red p-4 font-black">
					BRUTO REPORTADO EN EL RANGO DE TIEMPO SELECCIONADO: $
					{brutoReportedBeforeDie.toFixed(2)}
				</div>
				<div className="bg-custom-red p-4 font-black">
					NETO REPORTADO EN EL RANGO DE TIEMPO SELECCIONADO: $
					{netoReportedBeforeDie.toFixed(2)}
				</div>
				<div className="bg-custom-red p-4 font-black">
					RENTABILIDAD FINAL POR CLIENTE: $
					{rentabilidadPromedioFinal.toFixed(2)}
				</div>
			</div>
			<table className="h-min w-full font-antonio text-sm text-left rtl:text-right text-black">
				<thead className="text-xs  uppercase text-black border border-red-main bg-custom-red">
					<tr>
						<th scope="col" className="px-4 text-left py-3">
							Teléfonos
						</th>
						<th
							scope="col"
							className="px-4 py-3  text-black text-right whitespace-nowrap"
						>
							Cantidad de Pedidos
							<button
								className="ml-2 text-xs text-black border-black border-2 hover:text-custom-red hover:bg-black"
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
						<th scope="col" className="px-4  py-3"></th>
					</tr>
				</thead>
				<tbody>
					{sortTelefonos().map((t, i) => (
						<React.Fragment key={i}>
							<tr className="bg-black text-custom-red uppercase font-black border border-red-main">
								<td className="px-4 py-4 font-black text-left text-custom-red whitespace-nowrap">
									{t.telefono}
								</td>
								<td className="px-4 py-4 font-black text-custom-red text-right whitespace-nowrap">
									{getCantidadPedidos(t.telefono)}
								</td>
								<td className="px-4 py-4 font-black text-custom-red text-right whitespace-nowrap">
									<button
										className="font-black border border-red-main text-custom-red hover:underline px-1 uppercase"
										onClick={() => handlePhoneNumberClick(t.telefono)}
									>
										Ver detalle
									</button>
								</td>
							</tr>
							{selectedPhoneNumber === t.telefono && (
								<div className=" py-4">
									<div className="flex flex-row gap-4">
										{pedidosByPhone?.map((p) => (
											<CardOrderCliente p={p} />
										))}
									</div>
								</div>
							)}
						</React.Fragment>
					))}
				</tbody>
			</table>
		</div>
	);
};
