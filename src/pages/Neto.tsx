import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import Calendar from "../components/Calendar";
import { ReadGastosSinceTwoMonthsAgo } from "../firebase/ReadData";
import arrow from "../assets/arrowIcon.png";

interface Gasto {
	id: string;
	category: string;
	description: string;
	estado: string;
	fecha: string;
	name: string;
	quantity: number;
	total: number;
	unit: string;
}

export const Neto = () => {
	const {
		facturacionTotal,
		neto,
		expenseData,
		totalProductosVendidos,
		vueltas,
		valueDate,
	} = useSelector((state: RootState) => state.data);

	const [gastosHaceDosMeses, setGastosHaceDosMeses] = useState<Gasto[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const data = await ReadGastosSinceTwoMonthsAgo();
				setGastosHaceDosMeses(data as Gasto[]);
			} catch (error) {
				console.error("Error fetching gastos:", error);
			}
		};

		fetchData();
	}, []);

	// Función para calcular los días seleccionados en el rango
	const calcularDiasSeleccionados = () => {
		if (!valueDate || !valueDate.startDate || !valueDate.endDate) {
			return 0;
		}
		const startDate = new Date(valueDate.startDate);
		const endDate = new Date(valueDate.endDate);
		const diferenciaTiempo = endDate.getTime() - startDate.getTime();
		return Math.ceil(diferenciaTiempo / (1000 * 3600 * 24)) + 1;
	};

	// Función para convertir la fecha de dd/mm/yyyy a yyyy-mm-dd
	const convertirFecha = (fecha) => {
		const [dia, mes, año] = fecha.split("/");
		return `${año}-${mes}-${dia}`;
	};

	// Función auxiliar general para calcular el total ajustado por días del mes y rango
	const getGastoAjustadoPorDias = (total, fecha) => {
		const fechaFormateada = convertirFecha(fecha);
		const fechaGasto = new Date(fechaFormateada);
		const diasDelMes = new Date(
			fechaGasto.getFullYear(),
			fechaGasto.getMonth() + 1,
			0
		).getDate();
		const gastoDiario = total / diasDelMes;
		const diasSeleccionados = calcularDiasSeleccionados();
		return gastoDiario * diasSeleccionados;
	};

	// Modificar la función auxiliar para Alquiler
	const getAlquilerTotal = () => {
		const alquilerExpense = expenseData.find(
			(expense) => expense.name === "Alquiler"
		);
		if (alquilerExpense) {
			return {
				total: getGastoAjustadoPorDias(
					alquilerExpense.total,
					alquilerExpense.fecha
				),
				isEstimated: false,
			};
		} else {
			// Buscar en gastosHaceDosMeses
			const alquilerExpenses = gastosHaceDosMeses.filter(
				(expense) => expense.name === "Alquiler"
			);
			if (alquilerExpenses.length > 0) {
				// Ordenar por fecha para encontrar el más reciente
				alquilerExpenses.sort(
					(a, b) =>
						new Date(convertirFecha(b.fecha)).getTime() -
						new Date(convertirFecha(a.fecha)).getTime()
				);
				const totalAjustado = getGastoAjustadoPorDias(
					alquilerExpenses[0].total,
					alquilerExpenses[0].fecha
				);
				return { total: totalAjustado, isEstimated: true };
			} else {
				return { total: 0, isEstimated: true };
			}
		}
	};

	// Modificar la función auxiliar para Marketing
	const getMarketingTotal = () => {
		const marketingExpense = expenseData.find(
			(expense) => expense.category === "marketing"
		);
		if (marketingExpense) {
			return {
				total: getGastoAjustadoPorDias(
					marketingExpense.total,
					marketingExpense.fecha
				),
				isEstimated: false,
			};
		} else {
			// Buscar en gastosHaceDosMeses
			const marketingExpenses = gastosHaceDosMeses.filter(
				(expense) => expense.category === "marketing"
			);
			if (marketingExpenses.length > 0) {
				// Ordenar por fecha para encontrar el más reciente
				marketingExpenses.sort(
					(a, b) =>
						new Date(convertirFecha(b.fecha)).getTime() -
						new Date(convertirFecha(a.fecha)).getTime()
				);
				const gastoMásReciente = marketingExpenses[0];
				const totalAjustado = getGastoAjustadoPorDias(
					gastoMásReciente.total,
					gastoMásReciente.fecha
				);
				return { total: totalAjustado, isEstimated: true };
			} else {
				return { total: 0, isEstimated: true };
			}
		}
	};

	// Modificar la función auxiliar para Agua
	const getAguaTotal = () => {
		const aguaExpense = expenseData.find(
			(expense) => expense.name.toLowerCase() === "agua"
		);
		if (aguaExpense) {
			return {
				total: getGastoAjustadoPorDias(aguaExpense.total, aguaExpense.fecha),
				isEstimated: false,
			};
		} else {
			// Buscar en gastosHaceDosMeses
			const aguaExpenses = gastosHaceDosMeses.filter(
				(expense) => expense.name.toLowerCase() === "agua"
			);
			if (aguaExpenses.length > 0) {
				// Ordenar por fecha para encontrar el más reciente
				aguaExpenses.sort(
					(a, b) =>
						new Date(convertirFecha(b.fecha)).getTime() -
						new Date(convertirFecha(a.fecha)).getTime()
				);
				const totalAjustado = getGastoAjustadoPorDias(
					aguaExpenses[0].total,
					aguaExpenses[0].fecha
				);
				return { total: totalAjustado, isEstimated: true };
			} else {
				return { total: 0, isEstimated: true };
			}
		}
	};

	const cadetePagas = useMemo(() => {
		const pagas: { [key: string]: number } = {};
		vueltas.forEach((cadete) => {
			if (cadete.name && cadete.vueltas) {
				const totalPaga = cadete.vueltas.reduce(
					(sum, vuelta) => sum + (vuelta.paga || 0),
					0
				);
				pagas[cadete.name] = totalPaga;
			}
		});
		return pagas;
	}, [vueltas]);

	const cadeteTotal =
		expenseData.find((expense) => expense.category === "cadetes")?.total ||
		Object.values(cadetePagas).reduce((acc, val) => acc + val, 0);

	// Función para calcular la cantidad de días del mes basado en la fecha seleccionada
	const calcularDiasDelMes = () => {
		if (!valueDate || !valueDate.startDate) {
			return 0;
		}
		const startDate = new Date(valueDate.startDate);
		return new Date(
			startDate.getFullYear(),
			startDate.getMonth() + 1,
			0
		).getDate();
	};

	const cocinaTotal =
		expenseData.find((expense) => expense.category === "cocina")?.total ||
		totalProductosVendidos * 230 * 2 +
			(400000 / calcularDiasDelMes()) * calcularDiasSeleccionados();

	const errorValue = facturacionTotal * 0.05;

	// Calcular Materia prima
	const materiaPrima = facturacionTotal - neto;

	// Obtener datos de Alquiler
	const alquilerData = getAlquilerTotal();

	// Obtener datos de Marketing
	const marketingData = getMarketingTotal();

	// Obtener datos de Agua
	const aguaData = getAguaTotal();

	// Calcular gastos totales
	const totalExpenses = [
		materiaPrima,
		cadeteTotal,
		cocinaTotal,
		marketingData.total,
		alquilerData.total,
		aguaData.total,
		errorValue,
	].reduce((acc, curr) => acc + curr, 0);

	// Calcular excedente
	const excedenteValue = facturacionTotal - totalExpenses;

	const calculatePercentage = (value) => {
		return ((value / facturacionTotal) * 100).toFixed(1) + "%";
	};

	const data = [
		{
			label: "Bruto",
			value: facturacionTotal,
			percentage: "100%",
			estado: "Exacto",
		},
		{
			label: "Materia prima",
			value: materiaPrima,
			percentage: calculatePercentage(materiaPrima),
			estado: "Exacto",
		},
		{
			label: "Cadete",
			value: cadeteTotal,
			percentage: calculatePercentage(cadeteTotal),
			manual: !expenseData.find((expense) => expense.category === "cadetes"),
			estado: expenseData.find((expense) => expense.category === "cadetes")
				? "Exacto"
				: "Estimado",
		},
		{
			label: "Cocina y producción",
			value: cocinaTotal,
			percentage: calculatePercentage(cocinaTotal),
			manual: !expenseData.find((expense) => expense.category === "cocina"),
			estado: expenseData.find((expense) => expense.category === "cocina")
				? "Exacto"
				: "Estimado",
		},
		{
			label: "Marketing",
			value: marketingData.total,
			percentage: calculatePercentage(marketingData.total),
			manual: marketingData.isEstimated,
			estado: marketingData.isEstimated ? "Estimado" : "Exacto",
		},
		{
			label: "Alquiler",
			value: alquilerData.total,
			percentage: calculatePercentage(alquilerData.total),
			manual: alquilerData.isEstimated,
			estado: alquilerData.isEstimated ? "Estimado" : "Exacto",
		},
		{
			label: "Agua",
			value: aguaData.total,
			percentage: calculatePercentage(aguaData.total),
			manual: aguaData.isEstimated,
			estado: aguaData.isEstimated ? "Estimado" : "Exacto",
		},
		{
			label: "Error",
			value: errorValue,
			percentage: "5.0%",
			estado: "Estimado",
		},
		{
			label: "Excedente",
			value: excedenteValue,
			percentage: calculatePercentage(excedenteValue),
			estado: "Estimado",
		},
	];

	return (
		<div className="flex flex-col">
			<div className="flex flex-row justify-between font-coolvetica items-center mt-8 mx-4 mb-4">
				<p className="text-black font-bold text-4xl mt-1">Neto</p>
			</div>

			<div className="px-4 pb-8">
				<Calendar />
			</div>

			<div className="font-coolvetica">
				<table className="w-full text-xs text-left text-black">
					<thead className="text-black border-b h-10">
						<tr>
							<th scope="col" className="pl-4 h-10 w-2/5">
								Estructura
							</th>
							<th scope="col" className="pl-4 h-10 w-1/5">
								Total
							</th>
							<th scope="col" className="pl-4 h-10 pr-1 w-1/5">
								Estado
							</th>
							<th scope="col" className="pl-4 h-10 pr-8 w-1/5">
								%
							</th>
							<th scope="col" className="pl-4 h-10 w-1/5"></th>
						</tr>
					</thead>
					<tbody>
						{data.map(({ label, value, percentage, manual, estado }, index) => (
							<tr
								key={index}
								className={`text-black border font-light h-10 border-black border-opacity-20`}
							>
								<th scope="row" className="pl-4 h-10 w-2/5 font-light">
									{label}
								</th>
								<td className="pl-4 w-1/5 h-10 font-light">{`$ ${value.toFixed(
									0
								)}`}</td>
								<td className="pl-4 w-1/5 h-10 pr-1 font-bold">
									<div className="bg-gray-300 py-1 px-2 rounded-full">
										<p
											className={`text-center ${
												manual ? "text-red-500" : "text-black"
											}`}
										>
											{estado}
										</p>
									</div>
								</td>
								<td className="pl-4 pr-8 w-1/5 h-10 font-light">
									{percentage}
								</td>
								<td className="pl-4 w-1/5 h-10 font-light relative">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
										className="h-5 absolute right-3.5 bottom-2.5"
									>
										<path
											fillRule="evenodd"
											d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM8.94 6.94a.75.75 0 1 1-1.061-1.061 3 3 0 1 1 2.871 5.026v.345a.75.75 0 0 1-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 1 0 8.94 6.94ZM10 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
											clipRule="evenodd"
										/>
									</svg>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};
