import { useState, useEffect, useMemo } from "react";
import currencyFormat from "../helpers/currencyFormat";
import { useSelector } from "react-redux";
import Calendar from "../components/Calendar";
import { readEmpleados } from "../firebase/registroEmpleados";
import { RootState } from "../redux/configureStore";
import { Cadete } from "../types/types";

interface Empleado {
	name: string;
	category: string;
	correo: string;
	available: boolean;
	area: string;
	puesto: string;
	depto: string;
}

export const Neto = () => {
	const { materiales } = useSelector((state: RootState) => state.materials);
	const { burgers, drinks, toppings, fries } = useSelector(
		(state: RootState) => state.product
	);

	const {
		facturacionTotal,
		neto,
		totalProductosVendidos,
		vueltas,
		isLoading,
		valueDate,
		expenseData,
	} = useSelector((state: RootState) => state.data);

	const [empleados, setEmpleados] = useState<Empleado[]>([]);

	// Función para parsear fechas en formato "DD/MM/YYYY"
	const parseDate = (dateString: string) => {
		const [day, month, year] = dateString.split("/");
		return new Date(`${year}-${month}-${day}`);
	};

	useEffect(() => {
		const fetchEmpleados = async () => {
			try {
				const empleadosData = await readEmpleados();
				const filteredEmpleados = empleadosData.filter(
					(empleado) =>
						empleado.name !== "NO ASIGNADO" && empleado.name !== "test"
				);
				setEmpleados(filteredEmpleados);
			} catch (error) {
				console.error("Error al obtener los empleados:", error);
			}
		};

		fetchEmpleados();
	}, []);

	const cadetePagas = useMemo(() => {
		const pagas: { [key: string]: number } = {};
		vueltas.forEach((cadete: Cadete) => {
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

	const salariesByCategory = empleados.reduce((acc, empleado) => {
		let salary = 0;
		if (empleado.area === "cocina") {
			salary = totalProductosVendidos * 230;
		} else if (empleado.puesto === "cadete") {
			salary = cadetePagas[empleado.name] || 0;
		} else if (empleado.depto === "ANHELO Burgers") {
			salary = 205000;
		} else if (empleado.depto === "ANHELO Studio") {
			salary = 200000;
		} else {
			salary = 0;
		}

		const category = empleado.depto || empleado.area;
		if (category && category !== "") {
			if (acc[category]) {
				acc[category] += salary;
			} else {
				acc[category] = salary;
			}
		}

		return acc;
	}, {} as { [key: string]: number });

	const totalSalaries = Object.values(salariesByCategory).reduce(
		(sum, value) => sum + value,
		0
	);

	const materiaPrima = facturacionTotal - neto;
	const materiaPrimaPercent = ((materiaPrima / facturacionTotal) * 100).toFixed(
		1
	);

	const agua = 5000;
	const error = 35402;

	// Obtenemos el último gasto de Alquiler
	const alquilerExpense = useMemo(() => {
		if (!expenseData) return 0;

		const alquilerExpenses = expenseData.filter(
			(expense) => expense.name.toLowerCase() === "alquiler"
		);

		if (alquilerExpenses.length === 0) return 0;

		alquilerExpenses.sort((a, b) => {
			const dateA = parseDate(a.fecha).getTime();
			const dateB = parseDate(b.fecha).getTime();
			return dateB - dateA;
		});

		const lastAlquiler = alquilerExpenses[0];
		console.log("Último gasto de Alquiler:", lastAlquiler);

		return lastAlquiler.total;
	}, [expenseData]);

	// Obtenemos el último gasto de Sueldos de Marketing
	const marketingExpense = useMemo(() => {
		if (!expenseData) return 0;

		const marketingExpenses = expenseData.filter(
			(expense) =>
				expense.name.toLowerCase() === "sueldos" &&
				expense.category.toLowerCase() === "marketing"
		);

		if (marketingExpenses.length === 0) return 0;

		marketingExpenses.sort((a, b) => {
			const dateA = parseDate(a.fecha).getTime();
			const dateB = parseDate(b.fecha).getTime();
			return dateB - dateA;
		});

		const lastMarketingExpense = marketingExpenses[0];
		console.log("Último gasto de Marketing:", lastMarketingExpense);

		return lastMarketingExpense.total;
	}, [expenseData]);

	// Calculamos los días en el mes actual
	const getDaysInMonth = () => {
		if (!valueDate || !valueDate.startDate) return 30;

		const date = new Date(valueDate.startDate);
		return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	};

	// Calculamos los días en el rango seleccionado
	const getDaysInRange = () => {
		if (!valueDate || !valueDate.startDate || !valueDate.endDate) return 1;

		const start = new Date(valueDate.startDate);
		const end = new Date(valueDate.endDate);
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

		return diffDays;
	};

	const daysInMonth = getDaysInMonth();
	const daysInRange = getDaysInRange();

	// Calculamos la tasa diaria y multiplicamos por los días seleccionados
	const marketingDaily = (marketingExpense / daysInMonth) * daysInRange;
	const alquilerDaily = (alquilerExpense / daysInMonth) * daysInRange;

	const totalInfraestructura = alquilerDaily + agua + error;

	const totalCosts =
		materiaPrima + totalSalaries + totalInfraestructura + marketingDaily;

	const excedente = facturacionTotal - totalCosts;
	const excedentePercent = ((excedente / facturacionTotal) * 100).toFixed(1);

	const deudaLocal = 350000;
	const deudaLocalPercent = ((deudaLocal / facturacionTotal) * 100).toFixed(1);

	const finalAmount = excedente - deudaLocal;
	const finalPercent = ((finalAmount / facturacionTotal) * 100).toFixed(1);

	const data = [
		{ item: "BRUTO", value: facturacionTotal, percent: 100 },
		{
			item: "Materia prima",
			value: materiaPrima,
			percent: parseFloat(materiaPrimaPercent),
		},
		...Object.entries(salariesByCategory)
			.filter(
				([category]) =>
					category && category !== "Otros" && category !== "marketing"
			)
			.map(([category, value]) => ({
				item: `${category}`,
				value: value,
				percent: ((value / facturacionTotal) * 100).toFixed(1),
			})),
		{
			item: "Marketing",
			value: marketingDaily,
			percent: ((marketingDaily / facturacionTotal) * 100).toFixed(1),
		},
		{
			item: "Alquiler",
			value: alquilerDaily,
			percent: ((alquilerDaily / facturacionTotal) * 100).toFixed(1),
		},
		{
			item: "Agua",
			value: agua,
			percent: ((agua / facturacionTotal) * 100).toFixed(1),
		},
		{
			item: "Error",
			value: error,
			percent: ((error / facturacionTotal) * 100).toFixed(1),
		},
		{
			item: "Deuda local 1 (Expansión)",
			value: deudaLocal,
			percent: deudaLocalPercent,
		},
		{ item: "Final", value: finalAmount, percent: finalPercent },
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
							<th scope="col" className="pl-4 w-2/5">
								ESTRUCTURA DE COSTOS
							</th>
							<th scope="col" className="pl-4 w-1/6"></th>
							<th scope="col" className="pl-4 w-1/6">
								%
							</th>
						</tr>
					</thead>
					<tbody>
						{data.map((row, index) => (
							<tr
								key={index}
								className="text-black border font-light h-10 border-black border-opacity-20"
							>
								<td className="pl-4 w-1/5 font-light">{row.item}</td>
								<td className="pl-4 w-1/7 font-light">
									{row.value !== null ? `$ ${currencyFormat(row.value)}` : ""}
								</td>
								<td className="pl-4 w-1/7 font-light">
									{row.percent !== null ? `${row.percent}%` : ""}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};
