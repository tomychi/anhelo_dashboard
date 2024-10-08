import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import Calendar from "../components/Calendar";

export const Neto = () => {
	const { facturacionTotal, neto, expenseData } = useSelector(
		(state: RootState) => state.data
	);

	useEffect(() => {
		console.log("Gastos según el calendario:", expenseData);
	}, [expenseData]);

	const errorValue = facturacionTotal * 0.05;

	const totalExpenses = [
		neto,
		expenseData.find((expense) => expense.category === "cadetes")?.total || 0,
		expenseData.find((expense) => expense.category === "cocina")?.total || 0,
		expenseData.find((expense) => expense.category === "marketing")?.total || 0,
		expenseData.find((expense) => expense.name === "Alquiler")?.total || 0,
		expenseData.find((expense) => expense.name === "agua")?.total || 0,
		errorValue,
	].reduce((acc, curr) => acc + curr, 0);

	const excedenteValue = facturacionTotal - totalExpenses;

	const data = [
		{ label: "Bruto", value: facturacionTotal, percentage: "100%" },
		{
			label: "Materia prima",
			value: facturacionTotal - neto,
			percentage: `${(
				((facturacionTotal - neto) * 100) /
				facturacionTotal
			).toFixed(1)}%`,
		},
		{
			label: "Cadete",
			value:
				expenseData.find((expense) => expense.category === "cadetes")?.total ||
				0,
			percentage: "9.0%",
		},
		{
			label: "Cocina y produccion",
			value:
				expenseData.find((expense) => expense.category === "cocina")?.total ||
				0,
			percentage: "10.7%",
		},
		{
			label: "Marketing",
			value:
				expenseData.find((expense) => expense.category === "marketing")
					?.total || 0,
			percentage: "0.0%",
		},
		{
			label: "Alquiler",
			value:
				expenseData.find((expense) => expense.name === "Alquiler")?.total || 0,
			percentage: "0.0%",
		},
		{
			label: "Agua",
			value: expenseData.find((expense) => expense.name === "agua")?.total || 0,
			percentage: "0%",
		},
		{ label: "Error", value: errorValue, percentage: "5.0%" },
		{ label: "Excedente", value: excedenteValue, percentage: "-" },
	];

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
							%
						</th>
					</tr>
				</thead>
				<tbody>
					{data.map(({ label, value, percentage }, index) => (
						<tr
							key={index}
							className="text-black border font-light h-10 border-black border-opacity-20"
						>
							<th scope="row" className="pl-4 w-2/5 font-light">
								{label}
							</th>
							<td className="pl-4 w-1/5 font-light">
								{`$ ${value.toLocaleString()}`}
							</td>
							<td className="pl-4 w-1/5 font-light">{percentage}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};
