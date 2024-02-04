import { useEffect, useState } from "react";
import { FormGasto } from "../components/gastos";
import { ReadDataForDateRange } from "../firebase/ReadData";
import { ExpenseProps } from "../firebase/UploadGasto";
import currencyFormat from "../helpers/currencyFormat";

export const Neto = () => {
	const [expenseData, setExpenseData] = useState<ExpenseProps[]>([]);
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

	return (
		<div className="">
			<div className="p-4 font-antonio">
				<table className="w-full  text-sm text-left rtl:text-right text-black">
					<thead className="text-xs  uppercase text-black border border-red-main bg-custom-red ">
						{/* Encabezados de la tabla */}
						<tr>
							<th scope="col" className="px-6 py-3">
								Product name
							</th>
							<th scope="col" className="px-6 py-3">
								Category
							</th>
							<th scope="col" className="px-6 py-3">
								Fecha
							</th>
							<th scope="col" className="px-6 py-3">
								Descripcion
							</th>
							<th scope="col" className="px-6 py-3">
								Cantidad
							</th>
							<th scope="col" className="px-6 py-3">
								Unidad
							</th>
							<th scope="col" className="px-6 py-3">
								Total
							</th>
							<th scope="col" className="px-6 py-3">
								<span className="sr-only">Edit</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{/* Mapeo de datos de burgers */}
						{expenseData.map(
							({
								quantity,
								fecha,
								category,
								name,
								total,
								unit,
								description,
								id,
							}) => (
								<tr
									key={id}
									className="bg-black text-custom-red uppercase font-black border border-red-main"
								>
									<th
										scope="row"
										className="px-6 py-4 font-black text-custom-red whitespace-nowrap "
									>
										{name}
									</th>
									<td className="px-6 py-4">{category}</td>
									<td className="px-6 py-4">{fecha}</td>
									<td className="px-6 py-4 ">{description}</td>
									<td className="px-6 py-4 ">{quantity}</td>
									<td className="px-6 py-4 ">{unit}</td>
									<td className="px-6 py-4">{currencyFormat(total)}</td>
									<td className="px-6 py-4 text-center">
										<div className="font-black border border-red-main text-custom-red hover:underline">
											Borrar
										</div>
									</td>
								</tr>
							)
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};
