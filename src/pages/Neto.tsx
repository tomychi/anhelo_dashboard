import React, { useEffect, useMemo, useState, useRef } from "react";
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

	// Función auxiliar para Alquiler
	const getAlquilerTotal = () => {
		const alquilerExpense = expenseData.find(
			(expense) => expense.name === "Alquiler"
		);
		if (alquilerExpense) {
			return { total: alquilerExpense.total, isEstimated: false };
		} else {
			// Buscar en gastosHaceDosMeses
			const alquilerExpenses = gastosHaceDosMeses.filter(
				(expense) => expense.name === "Alquiler"
			);
			if (alquilerExpenses.length > 0) {
				// Ordenar por fecha para encontrar el más reciente
				alquilerExpenses.sort(
					(a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
				);
				return { total: alquilerExpenses[0].total, isEstimated: true };
			} else {
				return { total: 0, isEstimated: true };
			}
		}
	};

	// Función auxiliar para Marketing
	const getMarketingTotal = () => {
		const marketingExpense = expenseData.find(
			(expense) => expense.category === "marketing"
		);
		if (marketingExpense) {
			return { total: marketingExpense.total, isEstimated: false };
		} else {
			// Buscar en gastosHaceDosMeses
			const marketingExpenses = gastosHaceDosMeses.filter(
				(expense) => expense.category === "marketing"
			);
			if (marketingExpenses.length > 0) {
				// Sumar todos los gastos de marketing
				const totalMarketing = marketingExpenses.reduce(
					(acc, expense) => acc + expense.total,
					0
				);
				return { total: totalMarketing, isEstimated: true };
			} else {
				return { total: 0, isEstimated: true };
			}
		}
	};

	// Función auxiliar para Agua
	const getAguaTotal = () => {
		const aguaExpense = expenseData.find(
			(expense) => expense.name.toLowerCase() === "agua"
		);
		if (aguaExpense) {
			return { total: aguaExpense.total, isEstimated: false };
		} else {
			// Buscar en gastosHaceDosMeses
			const aguaExpenses = gastosHaceDosMeses.filter(
				(expense) => expense.name.toLowerCase() === "agua"
			);
			if (aguaExpenses.length > 0) {
				// Ordenar por fecha para encontrar el más reciente
				aguaExpenses.sort(
					(a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
				);
				return { total: aguaExpenses[0].total, isEstimated: true };
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

	const cocinaTotal =
		expenseData.find((expense) => expense.category === "cocina")?.total ||
		totalProductosVendidos * 230 * 2 + 100000;

	const errorValue = facturacionTotal * 0.05;

	// Obtener datos de Alquiler
	const alquilerData = getAlquilerTotal();

	// Obtener datos de Marketing
	const marketingData = getMarketingTotal();

	// Obtener datos de Agua
	const aguaData = getAguaTotal();

	const totalExpenses = [
		neto,
		cadeteTotal,
		cocinaTotal,
		marketingData.total,
		alquilerData.total,
		aguaData.total,
		errorValue,
	].reduce((acc, curr) => acc + curr, 0);

	const excedenteValue = facturacionTotal - totalExpenses;

	const data = [
		{
			label: "Bruto",
			value: facturacionTotal,
			percentage: "100%",
			estado: "Exacto",
		},
		{
			label: "Materia prima",
			value: facturacionTotal - neto,
			percentage: `${(
				((facturacionTotal - neto) * 100) /
				facturacionTotal
			).toFixed(1)}%`,
			estado: "Exacto",
		},
		{
			label: "Cadete",
			value: cadeteTotal,
			percentage: "9.0%",
			manual: !expenseData.find((expense) => expense.category === "cadetes"),
			estado: expenseData.find((expense) => expense.category === "cadetes")
				? "Exacto"
				: "Estimado",
		},
		{
			label: "Cocina y produccion",
			value: cocinaTotal,
			percentage: "10.7%",
			manual: !expenseData.find((expense) => expense.category === "cocina"),
			estado: expenseData.find((expense) => expense.category === "cocina")
				? "Exacto"
				: "Estimado",
		},
		{
			label: "Marketing",
			value: marketingData.total,
			percentage: "0.0%",
			manual: marketingData.isEstimated,
			estado: marketingData.isEstimated ? "Estimado" : "Exacto",
		},
		{
			label: "Alquiler",
			value: alquilerData.total,
			percentage: "0.0%",
			manual: alquilerData.isEstimated,
			estado: alquilerData.isEstimated ? "Estimado" : "Exacto",
		},
		{
			label: "Agua",
			value: aguaData.total,
			percentage: "0%",
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
			percentage: "-",
			estado: "Estimado",
		},
	];

	// Estilos copiados de Gastos.tsx
	const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [openSelects, setOpenSelects] = useState<{ [key: string]: boolean }>(
		{}
	);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setShowCategoryDropdown(false);
			}

			// Cerrar todos los selects al hacer clic fuera
			setOpenSelects({});
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const handleSelectClick = (id: string) => {
		setOpenSelects((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	return (
		<div className="flex flex-col">
			<style>
				{`
          .arrow-down {
            transition: transform 0.3s ease;
            transform: rotate(90deg); /* Inicialmente apunta hacia abajo */
          }
          .arrow-down.open {
            transform: rotate(-90deg); /* Apunta hacia arriba cuando está abierto */
          }
          .select-wrapper {
            position: relative;
            display: inline-block;
          }
          .select-wrapper select {
            appearance: none;
            padding-right: 25px;
          }
          .select-wrapper .arrow-down {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%) rotate(90deg);
            pointer-events: none;
            transition: transform 0.3s ease;
          }
          .select-wrapper .arrow-down.open {
            transform: translateY(-50%) rotate(-90deg);
          }
        `}
			</style>
			<div className="flex flex-row justify-between font-coolvetica items-center mt-8 mx-4 mb-4">
				<p className="text-black font-bold text-4xl mt-1">Neto</p>
				{/* Aquí puedes agregar botones o enlaces si es necesario */}
			</div>

			<div className="px-4 pb-8">
				<Calendar />
				{/* Puedes agregar controles adicionales o filtros aquí */}
			</div>

			<div className="font-coolvetica">
				<table className="w-full text-xs text-left text-black">
					<thead className="text-black border-b h-10">
						<tr>
							<th scope="col" className="pl-4 w-2/5">
								Estructura de costos
							</th>
							<th scope="col" className="pl-4 w-1/5">
								Total
							</th>
							<th scope="col" className="pl-4 w-1/5">
								Estado
							</th>
							<th scope="col" className="pl-4 w-1/5">
								%
							</th>
						</tr>
					</thead>
					<tbody>
						{data.map(({ label, value, percentage, manual, estado }, index) => (
							<tr
								key={index}
								className={`text-black border font-light h-10 border-black border-opacity-20 ${
									manual ? "bg-gray-300" : ""
								}`}
							>
								<th scope="row" className="pl-4 w-2/5 font-light">
									{label}
								</th>
								<td className="pl-4 w-1/5 font-light">{`$ ${value.toLocaleString()}`}</td>
								<td className="pl-4 w-1/5 font-bold">
									<div className="select-wrapper">
										<select
											className="bg-gray-300 py-1 pl-2 rounded-full"
											value={estado}
											onClick={() => handleSelectClick(label)}
											// Puedes agregar un onChange si es necesario
										>
											<option value="Exacto">Exacto</option>
											<option value="Estimado">Estimado</option>
										</select>
										<img
											src={arrow}
											className={`h-2 arrow-down ${
												openSelects[label] ? "open" : ""
											}`}
											alt=""
										/>
									</div>
								</td>
								<td className="pl-4 w-1/5 font-light">{percentage}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};
