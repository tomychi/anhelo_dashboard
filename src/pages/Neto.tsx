import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import Calendar from "../components/Calendar";
import { ReadGastosSinceTwoMonthsAgo } from "../firebase/ReadData";

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

	useEffect(() => {
		console.log("Gastos según el calendario:", expenseData);
	}, [expenseData]);

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

	const totalExpenses = [
		neto,
		cadeteTotal,
		cocinaTotal,
		expenseData.find((expense) => expense.category === "marketing")?.total || 0,
		expenseData.find((expense) => expense.name === "Alquiler")?.total || 0,
		expenseData.find((expense) => expense.name === "agua")?.total || 0,
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
			value:
				expenseData.find((expense) => expense.category === "marketing")
					?.total || 0,
			percentage: "0.0%",
			estado: expenseData.find((expense) => expense.category === "marketing")
				? "Exacto"
				: "Estimado",
		},
		{
			label: "Alquiler",
			value:
				expenseData.find((expense) => expense.name === "Alquiler")?.total || 0,
			percentage: "0.0%",
			estado: expenseData.find((expense) => expense.name === "Alquiler")
				? "Exacto"
				: "Estimado",
		},
		{
			label: "Agua",
			value: expenseData.find((expense) => expense.name === "agua")?.total || 0,
			percentage: "0%",
			estado: expenseData.find((expense) => expense.name === "agua")
				? "Exacto"
				: "Estimado",
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

	const [gastosHaceDosMeses, setGastosHaceDosMeses] = useState<Gasto[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const data = await ReadGastosSinceTwoMonthsAgo();
				setGastosHaceDosMeses(data as Gasto[]); // Asegúrate de tipar los datos
			} catch (error) {
				console.error("Error fetching gastos:", error);
			}
		};

		fetchData();
	}, []);

	console.log("acaa:", gastosHaceDosMeses);

	return (
		<div className="font-coolvetica text-black px-4">
			<h2 className="text-4xl font-bold my-8">Estructura de Costos</h2>
			<Calendar />
			<table className="w-full text-xs text-left">
				<thead className="border-b h-10">
					<tr>
						<th scope="col" className="pl-4 w-2/5">
							Descripcion
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
							<td className="pl-4 w-1/5 font-light">{estado}</td>
							<td className="pl-4 w-1/5 font-light">{percentage}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};
