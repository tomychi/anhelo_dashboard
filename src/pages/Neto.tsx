import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import Calendar from "../components/Calendar";
import { ReadGastosSinceTwoMonthsAgo, ReadMaterials } from "../firebase/ReadData";
import { Gasto, Cadete, Vuelta } from "../types/types";
import Tooltip from "../components/Tooltip"


interface Material {
    id: string;
    nombre: string;
    categoria: string;
    costo: number;
    stock: number;
    unidadPorPrecio: number;
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
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [materials, setMaterials] = useState<Material[]>([]);

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const materialsData = await ReadMaterials();
                setMaterials(materialsData);
            } catch (error) {
                console.error('Error fetching materials:', error);
            }
        };

        fetchMaterials();
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
    };// Nueva función para obtener gastos de infraestructura
    const getInfrastructureTotal = (): {
        total: number;
        items: Array<{
            name: string;
            total: number;
            originalTotal: number;
            fecha: string;
            isEstimated: boolean
        }>
    } => {
        const infrastructureExpenses = expenseData.filter(
            (expense: Gasto) => expense.category === "infraestructura"
        );

        if (infrastructureExpenses.length > 0) {
            // Gastos del período actual
            const items = infrastructureExpenses.map(expense => ({
                name: expense.name,
                total: getGastoAjustadoPorDias(expense.total, expense.fecha),
                originalTotal: expense.total,
                fecha: expense.fecha,
                isEstimated: false
            }));
            const total = items.reduce((acc, item) => acc + item.total, 0);
            return { total, items };
        } else {
            // Buscar en datos históricos
            const historicalInfrastructure = gastosHaceDosMeses.filter(
                expense => expense.category === "infraestructura"
            );

            if (historicalInfrastructure.length > 0) {
                const latestByName = new Map();
                historicalInfrastructure.forEach(expense => {
                    const existing = latestByName.get(expense.name);
                    if (!existing || new Date(convertirFecha(expense.fecha)) > new Date(convertirFecha(existing.fecha))) {
                        latestByName.set(expense.name, expense);
                    }
                });

                const items = Array.from(latestByName.values()).map(expense => ({
                    name: expense.name,
                    total: getGastoAjustadoPorDias(expense.total, expense.fecha),
                    originalTotal: expense.total,
                    fecha: expense.fecha,
                    isEstimated: true
                }));

                const total = items.reduce((acc, item) => acc + item.total, 0);
                return { total, items };
            }
        }

        return { total: 0, items: [] };
    };

    const getMarketingTotal = (): {
        total: number;
        items: Array<{
            name: string;
            total: number;
            originalTotal: number;
            fecha: string;
            isEstimated: boolean
        }>
    } => {
        const marketingExpenses = expenseData.filter(
            (expense: Gasto) => expense.category === "marketing"
        );

        if (marketingExpenses.length > 0) {
            // Gastos del período actual
            const items = marketingExpenses.map(expense => ({
                name: expense.name,
                total: getGastoAjustadoPorDias(expense.total, expense.fecha),
                originalTotal: expense.total,
                fecha: expense.fecha,
                isEstimated: false
            }));
            const total = items.reduce((acc, item) => acc + item.total, 0);
            return { total, items };
        } else {
            // Buscar en datos históricos
            const historicalMarketing = gastosHaceDosMeses.filter(
                expense => expense.category === "marketing"
            );

            if (historicalMarketing.length > 0) {
                const latestByName = new Map();
                historicalMarketing.forEach(expense => {
                    const existing = latestByName.get(expense.name);
                    if (!existing || new Date(convertirFecha(expense.fecha)) > new Date(convertirFecha(existing.fecha))) {
                        latestByName.set(expense.name, expense);
                    }
                });

                const items = Array.from(latestByName.values()).map(expense => ({
                    name: expense.name,
                    total: getGastoAjustadoPorDias(expense.total, expense.fecha),
                    originalTotal: expense.total,
                    fecha: expense.fecha,
                    isEstimated: true
                }));

                const total = items.reduce((acc, item) => acc + item.total, 0);
                return { total, items };
            }
        }

        return { total: 0, items: [] };
    };

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

    const getCocinaYProduccionTotal = () => {
        if (!valueDate?.startDate) return 0;

        const cocinaExpenses = expenseData.filter(
            (expense: Gasto) => expense.category === "cocina y produccion"
        );

        console.log("[Debug] Gastos actuales:", cocinaExpenses);

        if (cocinaExpenses.length > 0) {
            const total = cocinaExpenses.reduce((acc, expense) => acc + expense.total, 0);
            console.log("[Debug] Total actual:", total);
            return total;
        }

        const selectedDate = new Date(valueDate.startDate);
        const dayOfWeek = selectedDate.getDay();
        console.log("[Debug] Fecha seleccionada:", selectedDate.toISOString(), "día:", dayOfWeek);

        // Filtrar gastos del mismo día de la semana anterior
        const lastWeekExpenses = gastosHaceDosMeses.filter(expense => {
            const expenseDate = new Date(convertirFecha(expense.fecha));
            const isMatch = expenseDate.getDay() === dayOfWeek &&
                expense.category === "cocina y produccion";

            if (isMatch) {
                console.log("[Debug] Encontrado gasto de la semana anterior:", {
                    fecha: expense.fecha,
                    nombre: expense.name,
                    horas: expense.quantity,
                    total: expense.total
                });
            }
            return isMatch;
        });

        if (lastWeekExpenses.length === 0) {
            console.log("[Debug] No se encontraron gastos del mismo día de la semana anterior");
            return 0;
        }

        const totalHoras = lastWeekExpenses.reduce((acc, expense) => acc + (expense.quantity || 0), 0);
        const totalGastos = lastWeekExpenses.reduce((acc, expense) => acc + expense.total, 0);
        const costoPromedioPorHora = totalGastos / totalHoras;

        console.log("[Debug] Resumen:", {
            totalHoras,
            totalGastos,
            costoPromedioPorHora,
            estimatedTotal: totalHoras * costoPromedioPorHora
        });

        return totalHoras * costoPromedioPorHora;
    };

    const cocinaTotal = getCocinaYProduccionTotal();

    const errorValue: number = facturacionTotal * 0.05;
    const materiaPrima: number = facturacionTotal - neto;
    const marketingData = getMarketingTotal();
    const infrastructureData = getInfrastructureTotal();// Calcular gastos totales incluyendo infraestructura



    const getGastoAjustadoPorDiasPeriodo = (total: number, fecha: string, diasPeriodo: number = 31): number => {
        const gastoDiario = total / diasPeriodo;
        return gastoDiario * calcularDiasSeleccionados();
    };




    const getHistoricalExpenseTotal = (
        expenseData: Gasto[],
        gastosHaceDosMeses: Gasto[],
        category: string
    ) => {
        const historicalExpenses = gastosHaceDosMeses.filter(
            expense => expense.category === category
        );

        if (historicalExpenses.length > 0) {
            const latestByName = new Map();
            historicalExpenses.forEach(expense => {
                const existing = latestByName.get(expense.name);
                if (!existing || new Date(convertirFecha(expense.fecha)) > new Date(convertirFecha(existing.fecha))) {
                    latestByName.set(expense.name, expense);
                }
            });

            const items = Array.from(latestByName.values()).map(expense => ({
                name: expense.name,
                total: getGastoAjustadoPorDiasPeriodo(expense.total, expense.fecha, 62),
                originalTotal: expense.total,
                fecha: expense.fecha,
                isEstimated: true
            }));

            return {
                total: items.reduce((acc, item) => acc + item.total, 0),
                items
            };
        }

        return { total: 0, items: [] };
    };

    const getLegalTotal = () => getHistoricalExpenseTotal(expenseData, gastosHaceDosMeses, "legalidad");
    const getExtraTotal = () => getHistoricalExpenseTotal(expenseData, gastosHaceDosMeses, "extra");

    const legalData = getLegalTotal();
    const extraData = getExtraTotal();










    const totalExpenses: number = [
        materiaPrima,
        cadeteTotal,
        cocinaTotal,
        marketingData.total,
        infrastructureData.total,
        legalData.total,
        extraData.total,
        errorValue,
    ].reduce((acc, curr) => acc + curr, 0);

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
            label: "Legalidad",
            value: legalData.total,
            percentage: calculatePercentage(legalData.total),
            manual: false,
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
                (expense: Gasto) => expense.category === "cocina y produccion"
            ),
            estado: expenseData.find(
                (expense: Gasto) => expense.category === "cocina y produccion"
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
            label: "Infraestructura",
            value: infrastructureData.total,
            percentage: calculatePercentage(infrastructureData.total),
            manual: infrastructureData.items.some(item => item.isEstimated),
            estado: infrastructureData.items.some(item => item.isEstimated) ? "Estimado" : "Exacto",
        },
        {
            label: "Extra",
            value: extraData.total,
            percentage: calculatePercentage(extraData.total),
            manual: false,
            estado: "Exacto",
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
    ]; const getCalculationDescription = (label: string): string | JSX.Element => {
        switch (label) {
            case "Bruto":
                return `Es la facturación total sin ningún descuento. En este caso es: $ ${facturacionTotal.toFixed(0)}`;

            case "Materia prima": {
                const ingredientes = materials
                    .filter(material => material.categoria === "ingredientes")
                    .sort((a, b) => b.costo - a.costo);  // Ordenar por costo descendente



                return (
                    <div>
                        <div className="mb-4">
                            <div className="text-sm font-medium text-gray-100">Cálculo base:</div>
                            <div className="ml-4 text-sm text-gray-100">
                                <div>Facturación total: $ {facturacionTotal.toFixed(0)}</div>
                                <div>Neto: $ {neto.toFixed(0)}</div>
                                <div>Materia prima total: $ {(facturacionTotal - neto).toFixed(0)}</div>
                            </div>
                        </div>

                        <div className="text-sm font-medium mb-2 text-gray-100">
                            Desglose de materiales:
                        </div>
                        <div className="flex flex-col gap-2">
                            {ingredientes.map(material => (
                                <span className="font-medium text-gray-100">{material.nombre}: {material.costo}</span>

                            ))}
                        </div>

                        <div className="mt-4 text-xs text-gray-100">
                            * Los costos mostrados son los registrados en el sistema. Verificar regularmente para mantener actualizado.
                        </div>
                    </div>
                );
            }

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
                const cocinaExpenses = expenseData.filter(
                    (expense: Gasto) => expense.category === "cocina y produccion"
                );

                if (cocinaExpenses.length > 0) {
                    const total = cocinaExpenses.reduce((acc, expense) => acc + expense.total, 0);
                    return `Se calcula sumando los gastos actuales:<br> ${cocinaExpenses.map(expense =>
                        `- ${expense.name}: ${expense.quantity} horas × $${(expense.total / expense.quantity).toFixed(0)} = $${expense.total.toFixed(0)}`
                    ).join('<br>')}<br>Total: $${total.toFixed(0)}`;
                }

                const selectedDate = new Date(valueDate.startDate);
                const dayOfWeek = selectedDate.getDay();

                const lastWeekExpenses = gastosHaceDosMeses.filter(expense => {
                    const expenseDate = new Date(convertirFecha(expense.fecha));
                    return expenseDate.getDay() === dayOfWeek &&
                        expense.category === "cocina y produccion";
                });

                if (lastWeekExpenses.length > 0) {
                    const totalHoras = lastWeekExpenses.reduce((acc, expense) => acc + (expense.quantity || 0), 0);
                    const totalGastos = lastWeekExpenses.reduce((acc, expense) => acc + expense.total, 0);
                    const costoPromedioPorHora = totalGastos / totalHoras;

                    return `Se estima basado en el mismo día de la semana anterior:<br>
                        ${lastWeekExpenses.map(expense =>
                        `- ${expense.name}: ${expense.quantity} horas × $${(expense.total / expense.quantity).toFixed(0)} = $${expense.total}`
                    ).join('<br>')}<br>
                        Total horas: ${totalHoras}<br>
                        Costo promedio por hora: $${costoPromedioPorHora.toFixed(0)}<br>
                        Estimación total: ${totalHoras} horas × $${costoPromedioPorHora.toFixed(0)} = $${(totalHoras * costoPromedioPorHora).toFixed(0)}`;
                }

                return "No hay datos suficientes para calcular el gasto.";
            }

            case "Legalidad": {
                const itemDescriptions = legalData.items.map(item => {
                    return `${item.name}: $ ${item.total.toFixed(0)} (${calculatePercentage(item.total)})
                    → Gasto mensual original: $ ${item.originalTotal.toFixed(0)}
                    → Cálculo: $${item.originalTotal.toFixed(0)} ÷ 62 días × ${calcularDiasSeleccionados()} días
                    → Estado: ${item.isEstimated ? "Estimado (histórico)" : "Exacto"}
                    → Fecha registro: ${item.fecha}`;
                }).join('<br><br>');

                return `Desglose de gastos legales (basado en datos de los últimos 2 meses dividiendolos por 62 dias):<br><br>${itemDescriptions}<br><br>Total: $ ${legalData.total.toFixed(0)}`;
            }

            case "Marketing": {
                const itemDescriptions = marketingData.items.map(item => {
                    const diasDelMes = new Date(
                        new Date(convertirFecha(item.fecha)).getFullYear(),
                        new Date(convertirFecha(item.fecha)).getMonth() + 1,
                        0
                    ).getDate();

                    return `${item.name}: $ ${item.total.toFixed(0)} (${calculatePercentage(item.total)})
                    → Gasto mensual original: $ ${item.originalTotal.toFixed(0)}
                    → Cálculo: $${item.originalTotal.toFixed(0)} ÷ ${diasDelMes} días × ${calcularDiasSeleccionados()} días seleccionados
                    → Estado: ${item.isEstimated ? "Estimado (usando datos históricos)" : "Exacto (datos actuales)"}
                    → Fecha del gasto: ${item.fecha}`;
                }).join('<br><br>');

                return `Desglose detallado de gastos de marketing  (basado en datos de los últimos 2 meses, seleccionando el ultimo en caso de ser un gasto concurrente y dividiendo por 31):<br><br>${itemDescriptions}<br><br>Total de marketing: $ ${marketingData.total.toFixed(0)}`;
            }

            case "Infraestructura": {
                const itemDescriptions = infrastructureData.items.map(item => {
                    const diasDelMes = new Date(new Date(convertirFecha(item.fecha)).getFullYear(),
                        new Date(convertirFecha(item.fecha)).getMonth() + 1, 0).getDate();

                    return `${item.name}: $ ${item.total.toFixed(0)} (${calculatePercentage(item.total)})
                    → Gasto mensual original: $ ${item.originalTotal.toFixed(0)}
                    → Cálculo: $${item.originalTotal.toFixed(0)} ÷ ${diasDelMes} días × ${calcularDiasSeleccionados()} días
                    → Estado: ${item.isEstimated ? "Estimado (histórico)" : "Exacto"}
                    → Fecha registro: ${item.fecha}`;
                }).join('<br><br>');

                return `Desglose de gastos legales (basado en datos de los últimos 2 meses, seleccionando el ultimo en caso de ser un gasto concurrente y dividiendo por 31):<br><br>${itemDescriptions}<br><br>Total: $ ${infrastructureData.total.toFixed(0)}`;
            }

            case "Error":
                return `Se calcula como el 5% de la facturación total:<br>$ ${facturacionTotal.toFixed(0)} × 5% = $ ${errorValue.toFixed(0)}`;

            case "Extra": {
                const itemDescriptions = extraData.items.map(item => {
                    return `${item.name}: $ ${item.total.toFixed(0)} (${calculatePercentage(item.total)})
                        → Gasto mensual original: $ ${item.originalTotal.toFixed(0)}
                        → Cálculo: $${item.originalTotal.toFixed(0)} ÷ 62 días × ${calcularDiasSeleccionados()} días
                        → Estado: ${item.isEstimated ? "Estimado (histórico)" : "Exacto"}
                        → Fecha registro: ${item.fecha}`;
                }).join('<br><br>');

                return `Desglose de gastos extra (basado en datos de los últimos 2 meses dividiendolos por 62 dias):<br><br>${itemDescriptions}<br><br>Total: $ ${extraData.total.toFixed(0)}`;
            }

            case "Excedente":
                return `Es la diferencia entre:<br>
                    Facturación total: $ ${facturacionTotal.toFixed(0)}<br>
                    - Total gastos: $ ${totalExpenses.toFixed(0)}<br>
                    = $ ${excedenteValue.toFixed(0)}`;

            default:
                return "No hay información disponible sobre el cálculo de este gasto";
        }
    };

    const renderHistoricalData = (label: string) => {
        if (label === "Cocina y producción") {
            const cocinaExpenses = expenseData.filter(
                (expense: Gasto) => expense.category === "cocina y produccion"
            );

            return (
                <tr>
                    <td colSpan={5} className="p-0">
                        <div className="bg-gray-50 px-4 py-3">
                            <div className="space-y-2">
                                {cocinaExpenses.map((expense, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between bg-white rounded-lg p-2 shadow-sm"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">{expense.name}</span>
                                            <span className="text-sm text-gray-500">
                                                {expense.quantity} {expense.unit} - {expense.fecha}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span>${expense.total.toFixed(0)}</span>
                                            <span className="text-sm text-gray-500">
                                                {expense.estado}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </td>
                </tr>
            );
        }
        if (label === "Infraestructura" || label === "Marketing" || label === "Extra" || label === "Legalidad") {
            const data = label === "Infraestructura" ? infrastructureData :
                label === "Marketing" ? marketingData :
                    label === "Extra" ? extraData : legalData;
            return (
                <tr>
                    <td colSpan={5} className="p-0">
                        <div className="bg-gray-50 px-4 py-3">
                            <div className="space-y-2">
                                {data.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between bg-white rounded-lg p-2 shadow-sm"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">{item.name}</span>
                                            <span className="text-sm text-gray-500">
                                                {item.fecha}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span>${item.total.toFixed(0)}</span>
                                            <span className="text-gray-500">
                                                {calculatePercentage(item.total)}
                                            </span>
                                            <span className={`text-sm ${item.isEstimated ? "text-red-500" : "text-black"}`}>
                                                {item.isEstimated ? "Estimado" : "Exacto"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </td>
                </tr>
            );
        }
        return null;
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
                        {data.map(({ label, value, percentage, manual = false, estado }, index) => (
                            <React.Fragment key={index}>
                                <tr
                                    className={`text-black border font-light h-10 border-black border-opacity-20 cursor-pointer hover:bg-gray-50 transition-colors`}
                                    onClick={() => {
                                        setExpandedRow(expandedRow === label ? null : label);
                                    }}
                                >
                                    <th scope="row" className="pl-4 h-10 w-2/5 font-light">
                                        {label}
                                    </th>
                                    <td className="pl-4 w-1/5 h-10 font-light">{`$ ${value.toFixed(0)}`}</td>
                                    <td className="pl-4 w-1/5 h-10 pr-1 font-bold">
                                        <div className="bg-gray-300 py-1 px-2 rounded-full">
                                            <p className={`text-center ${manual ? "text-red-500" : "text-black"}`}>
                                                {estado}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="pl-4 pr-8 w-1/5 h-10 font-light">{percentage}</td>
                                    <td className="pl-4 w-1/5 h-10 font-light relative">
                                        <div className="absolute right-3.5 bottom-2.5">
                                            <Tooltip
                                                text={getCalculationDescription(label)}
                                                position="down"
                                            />
                                        </div>
                                    </td>
                                </tr>
                                {expandedRow === label && renderHistoricalData(label)}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};