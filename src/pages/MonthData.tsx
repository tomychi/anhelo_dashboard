import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import { CardInfo } from "../components/dashboard/CardInfo";
import { NetoSVG, GastosSVG, ExcedenteSVG } from "../components/icons";
import currencyFormat from "../helpers/currencyFormat";

export const MonthData = () => {
	const { expenseData } = useSelector((state: RootState) => state.data);
	const { neto } = useSelector((state: RootState) => state.data);

	// Calcular la suma de todos los gastos que no sean de la categoría "ingredientes"
	const totalGastos = expenseData.reduce((total, expense) => {
		// Excluir los gastos que tengan la categoría "ingredientes"
		if (
			expense.category !== "ingredientes" &&
			expense.category !== "igredientes" &&
			expense.category !== "bebidas" &&
			expense.category !== "packaging" &&
			expense.name !== "carne"
		) {
			return total + expense.total;
		} else {
			return total;
		}
	}, 0);

	// Agrupar los gastos por categoría excluyendo las categorías y nombres especificados
	const gastosPorCategoria = expenseData.reduce((result, expense) => {
		if (
			expense.category !== "ingredientes" &&
			expense.category !== "igredientes" &&
			expense.category !== "bebidas" &&
			expense.category !== "packaging" &&
			expense.name !== "carne"
		) {
			// Si la categoría ya existe en el objeto result, se suma el total
			if (result[expense.category]) {
				result[expense.category] += expense.total;
			} else {
				// Si la categoría no existe en el objeto result, se crea con el total actual
				result[expense.category] = expense.total;
			}
		}
		return result;
	}, {});

	console.log(
		"Gastos por categoría (excluyendo ciertas categorías y nombres):",
		gastosPorCategoria
	);

	console.log("Gastos por categoría:", gastosPorCategoria);

	// Calcular el balance mensual (neto - gastos)
	const balanceMensual = neto - totalGastos;
	return (
		<div className="p-4 flex flex-col gap-4">
			<CardInfo
				info={currencyFormat(neto)}
				title={"NETO"}
				svgComponent={<NetoSVG />}
			/>
			<div>
				<table className="h-min w-full font-antonio text-sm text-left rtl:text-right text-black">
					<thead className="text-xs uppercase text-black border border-red-main bg-custom-red ">
						<tr>
							<th scope="col" className="px-6 py-3">
								GASTOS POR Categoría
							</th>
							<th scope="col" className="px-6 py-3">
								Monto
							</th>
						</tr>
					</thead>
					<tbody>
						{Object.entries(gastosPorCategoria).map(([category, total]) => (
							<tr
								key={category}
								className="bg-black text-custom-red uppercase font-black border border-red-main"
							>
								<th
									scope="row"
									className="px-6 py-4 font-black text-custom-red whitespace-nowrap"
								>
									{category}
								</th>
								<td className="px-6 py-4">{currencyFormat(total)}</td>
							</tr>
						))}
					</tbody>
				</table>
				<CardInfo
					info={currencyFormat(totalGastos)}
					title={"TOTAL GASTOS"}
					svgComponent={<GastosSVG />}
				/>
			</div>
			<CardInfo
				info={currencyFormat(balanceMensual)}
				title={"EXCEDENTE"}
				svgComponent={<ExcedenteSVG />}
			/>
		</div>
	);
};
