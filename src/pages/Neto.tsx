import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import Calendar from "../components/Calendar";
import { ReadGastosSinceTwoMonthsAgo } from "../firebase/ReadData";
import { Gasto, Cadete, Vuelta, PedidoProps } from "../types/types"; // Importamos las interfaces desde types.ts
import Tooltip from "../components/Tooltip"

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
	const calcularDiasSeleccionados = (): number => {
		if (!valueDate || !valueDate.startDate || !valueDate.endDate) {
			return 0;
		}
		const startDate = new Date(valueDate.startDate);
		const endDate = new Date(valueDate.endDate);
		const diferenciaTiempo = endDate.getTime() - startDate.getTime();
		return Math.ceil(diferenciaTiempo / (1000 * 3600 * 24)) + 1;
	};

	// Función para convertir la fecha de dd/mm/yyyy a yyyy-mm-dd
	const convertirFecha = (fecha: string): string => {
		const [dia, mes, año] = fecha.split("/");
		return `${año}-${mes}-${dia}`;
	};

	// Función auxiliar general para calcular el total ajustado por días del mes y rango
	const getGastoAjustadoPorDias = (total: number, fecha: string): number => {
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
	const getAlquilerTotal = (): { total: number; isEstimated: boolean } => {
		const alquilerExpense = expenseData.find(
			(expense: Gasto) => expense.name === "Alquiler"
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
	const getMarketingTotal = (): { total: number; isEstimated: boolean } => {
		const marketingExpense = expenseData.find(
			(expense: Gasto) => expense.category === "marketing"
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
	const getAguaTotal = (): { total: number; isEstimated: boolean } => {
		const aguaExpense = expenseData.find(
			(expense: Gasto) => expense.name.toLowerCase() === "agua"
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

	// Utilizamos la interfaz Cadete de types.ts y ajustamos el código
	const cadetePagas = useMemo(() => {
		const pagas: { [key: string]: number } = {};
		(vueltas as Cadete[]).forEach((cadete: Cadete) => {
			if (cadete.name && cadete.vueltas) {
				const totalPaga = cadete.vueltas.reduce(
					(sum: number, vuelta: Vuelta) => {
						return sum + (vuelta.paga || 0);
					},
					0
				);
				pagas[cadete.name] = totalPaga;
			}
		});
		return pagas;
	}, [vueltas]);

	const cadeteTotal: number =
		expenseData.find((expense: Gasto) => expense.category === "cadetes")
			?.total || Object.values(cadetePagas).reduce((acc, val) => acc + val, 0);

	// Función para calcular la cantidad de días del mes basado en la fecha seleccionada
	const calcularDiasDelMes = (): number => {
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

	const cocinaTotal: number =
		expenseData.find((expense: Gasto) => expense.category === "cocina")
			?.total ||
		totalProductosVendidos * 230 * 2 +
			(400000 / calcularDiasDelMes()) * calcularDiasSeleccionados();

	const errorValue: number = facturacionTotal * 0.05;

	// Calcular Materia prima
	const materiaPrima: number = facturacionTotal - neto;

	// Obtener datos de Alquiler
	const alquilerData = getAlquilerTotal();

	// Obtener datos de Marketing
	const marketingData = getMarketingTotal();

	// Obtener datos de Agua
	const aguaData = getAguaTotal();

	// Calcular gastos totales
	const totalExpenses: number = [
		materiaPrima,
		cadeteTotal,
		cocinaTotal,
		marketingData.total,
		alquilerData.total,
		aguaData.total,
		errorValue,
	].reduce((acc, curr) => acc + curr, 0);

	// Calcular excedente
	const excedenteValue: number = facturacionTotal - totalExpenses;

	const calculatePercentage = (value: number): string => {
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
			manual: !expenseData.find(
				(expense: Gasto) => expense.category === "cadetes"
			),
			estado: expenseData.find(
				(expense: Gasto) => expense.category === "cadetes"
			)
				? "Exacto"
				: "Estimado",
		},
		{
			label: "Cocina y producción",
			value: cocinaTotal,
			percentage: calculatePercentage(cocinaTotal),
			manual: !expenseData.find(
				(expense: Gasto) => expense.category === "cocina"
			),
			estado: expenseData.find(
				(expense: Gasto) => expense.category === "cocina"
			)
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

	const getCalculationDescription = (label: string): string => {
		switch (label) {
		  case "Bruto":
			return `Es la facturación total sin ningún descuento. En este caso es: $ ${facturacionTotal.toFixed(0)}`;
			
		  case "Materia prima":
			return `Se calcula como la diferencia entre la facturación total ($ ${facturacionTotal.toFixed(0)}) y el neto ($ ${neto.toFixed(0)}). En este caso es: $ ${materiaPrima.toFixed(0)}`;
			
		  case "Cadete": {
			const manualGasto = expenseData.find((expense: Gasto) => expense.category === "cadetes");
			if (manualGasto) {
			  return `Se está usando el gasto manual ingresado en la categoría 'cadetes': $ ${manualGasto.total.toFixed(0)}`;
			}
			const detallesCadetes = Object.entries(cadetePagas)
			  .map(([name, paga]) => `${name}: $ ${paga.toFixed(0)}`)
			  .join('<br>');
			return `Se calcula sumando las pagas de todos los cadetes:<br>${detallesCadetes}<br>Total: $ ${cadeteTotal.toFixed(0)}`;
		  }
			
		  case "Cocina y producción": {
			const manualGasto = expenseData.find((expense: Gasto) => expense.category === "cocina");
			if (manualGasto) {
			  return `Se está usando el gasto manual ingresado en la categoría 'cocina': $ ${manualGasto.total.toFixed(0)}`;
			}
			const costoVariable = totalProductosVendidos * 230 * 2;
			const costoFijo = (400000 / calcularDiasDelMes()) * calcularDiasSeleccionados();
			return `Se calcula:<br>
			  - Costo variable: ${totalProductosVendidos} productos × $230 × 2 = $ ${costoVariable.toFixed(0)}<br>
			  - Costo fijo: ($400,000 ÷ ${calcularDiasDelMes()} días) × ${calcularDiasSeleccionados()} días seleccionados = $ ${costoFijo.toFixed(0)}<br>
			  Total: $ ${cocinaTotal.toFixed(0)}`;
		  }
			
		  case "Marketing": {
			const manualGasto = expenseData.find((expense: Gasto) => expense.category === "marketing");
			if (manualGasto) {
			  return `Se está usando el gasto actual en marketing: $ ${manualGasto.total.toFixed(0)}`;
			}
			const marketingGastos = gastosHaceDosMeses.filter(expense => expense.category === "marketing");
			if (marketingGastos.length > 0) {
			  const gastoReciente = marketingGastos[0];
			  return `Se toma el gasto más reciente (${gastoReciente.fecha}) de $ ${gastoReciente.total.toFixed(0)} y se ajusta proporcionalmente a los ${calcularDiasSeleccionados()} días seleccionados: $ ${marketingData.total.toFixed(0)}`;
			}
			return `No hay gastos de marketing registrados`;
		  }
			
		  case "Alquiler": {
			if (alquilerData.isEstimated) {
			  const alquilerGastos = gastosHaceDosMeses.filter(expense => expense.name === "Alquiler");
			  if (alquilerGastos.length > 0) {
				const gastoReciente = alquilerGastos[0];
				return `Se toma el alquiler más reciente (${gastoReciente.fecha}) de $ ${gastoReciente.total.toFixed(0)} y se ajusta proporcionalmente a los ${calcularDiasSeleccionados()} días seleccionados: $ ${alquilerData.total.toFixed(0)}`;
			  }
			  return `No hay gastos de alquiler registrados`;
			}
			const alquilerActual = expenseData.find(expense => expense.name === "Alquiler");
			return `Se está usando el alquiler actual: $ ${alquilerActual?.total.toFixed(0)}`;
		  }
			
		  case "Agua": {
			if (aguaData.isEstimated) {
			  const aguaGastos = gastosHaceDosMeses.filter(expense => expense.name.toLowerCase() === "agua");
			  if (aguaGastos.length > 0) {
				const gastoReciente = aguaGastos[0];
				return `Se toma el gasto de agua más reciente (${gastoReciente.fecha}) de $ ${gastoReciente.total.toFixed(0)} y se ajusta proporcionalmente a los ${calcularDiasSeleccionados()} días seleccionados: $ ${aguaData.total.toFixed(0)}`;
			  }
			  return `No hay gastos de agua registrados`;
			}
			const aguaActual = expenseData.find(expense => expense.name.toLowerCase() === "agua");
			return `Se está usando el gasto de agua actual: $ ${aguaActual?.total.toFixed(0)}`;
		  }
			
		  case "Error":
			return `Se calcula como el 5% de la facturación total:<br>$ ${facturacionTotal.toFixed(0)} × 5% = $ ${errorValue.toFixed(0)}`;
			
		  case "Excedente":
			return `Es la diferencia entre:<br>
			  Facturación total: $ ${facturacionTotal.toFixed(0)}<br>
			  - Total gastos: $ ${totalExpenses.toFixed(0)}<br>
			  = $ ${excedenteValue.toFixed(0)}`;
			
		  default:
			return "No hay información disponible sobre el cálculo de este gasto";
		}
	  };

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
						{data.map(
							(
								{ label, value, percentage, manual = false, estado },
								index: number
							) => (
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
    <div className="absolute right-3.5 bottom-2.5">
      <Tooltip
        text={getCalculationDescription(label)}
        position="left"
      />
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
