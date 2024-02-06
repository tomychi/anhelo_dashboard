import { useEffect, useState } from "react";
import { ReadDataForDateRange } from "../firebase/ReadData";
import { ExpenseProps } from "../firebase/UploadGasto";
import Calendar from "../components/Calendar";

export const ProductosVendidos = () => {
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		setLoading(true);

		ReadDataForDateRange<ExpenseProps>(
			"gastos",
			"2024",
			"2",
			"1",
			"2024",
			"2",
			"3",
			(gastos) => {
				console.log("Gastos por rango:", gastos);
				setExpenseData(gastos);
			}
		);

		setLoading(false);
	}, []);

	const metodosDePago = {
		Efectivo: 10000,
		Virtual: 10000,
	};

	return (
		<div className="flex p-4 gap-4 justify-between flex-col w-full">
			<Calendar />
			<div className="w-full flex flex-col gap-4">
				<table className="h-min w-full font-antonio text-sm text-left rtl:text-right text-black">
					<thead className="text-xs uppercase text-black border border-red-main bg-custom-red ">
						<tr>
							<th scope="col" className="px-6 py-3">
								METODO DE PAGO
							</th>
							<th scope="col" className="px-6 py-3">
								MONTO
							</th>
							<th scope="col" className="px-6 py-3">
								PORCENTAJES
							</th>
						</tr>
					</thead>
					<tbody>
						{Object.entries(metodosDePago).map(([metodo, monto]) => (
							<tr
								key={metodo}
								className="bg-black text-custom-red uppercase font-black border border-red-main"
							>
								<th
									scope="row"
									className="px-6 py-4 font-black text-custom-red whitespace-nowrap"
								>
									{metodo}
								</th>
								<td className="px-6 py-4">{monto}</td>
								<td className="px-6 py-4">50%</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};
