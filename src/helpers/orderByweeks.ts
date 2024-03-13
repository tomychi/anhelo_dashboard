import { PedidoProps } from '../types/types';
import { startOfWeek, endOfWeek, addWeeks, isDate } from 'date-fns';
import { ExpenseProps } from '../firebase/UploadGasto';
import { calcularTotales } from './calculator';
import { convertDateFormat } from './dateToday';
const getWeekRange = (startDate: Date): [Date, Date] => {
  const start = startOfWeek(startDate, { weekStartsOn: 1 }); // El segundo parámetro indica que la semana empieza en lunes (lunes = 1, domingo = 0)
  const end = endOfWeek(startDate, { weekStartsOn: 1 });
  return [start, end];
};

export const groupOrdersByWeek = (
  ordersData: (PedidoProps | ExpenseProps)[],
  startDate: Date | undefined,
  endDate: Date | undefined
): {
  productsSoldByWeek: Record<string, number>;
  salesByWeek: Record<string, number>;
  totalRevenueByWeek: Record<string, number>;
} => {
  const productsSoldByWeek: Record<string, number> = {};
  const salesByWeek: Record<string, number> = {};
  const totalRevenueByWeek: Record<string, number> = {};

  // Verificar si startDate y endDate son fechas válidas
  if (!startDate || !isDate(startDate) || !endDate || !isDate(endDate)) {
    return { productsSoldByWeek, salesByWeek, totalRevenueByWeek }; // Retorna objetos vacíos si alguna de las fechas es undefined o no es una fecha válida
  }

  // Calcular la diferencia en días entre startDate y endDate
  const differenceInDays = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calcular el número de semanas
  const weeks = Math.ceil(differenceInDays / 7);

  // Iterar a través de cada semana
  for (let i = 0; i < weeks; i++) {
    const [weekStart, weekEnd] = getWeekRange(addWeeks(startDate, i));
    const ordersInWeek = ordersData.filter((order) => {
      const convertedDate = convertDateFormat(order.fecha);
      const orderDate = new Date(convertedDate);
      return orderDate >= weekStart && orderDate <= weekEnd;
    });
    const weekKey = `${weekStart.toISOString().split('T')[0]}_${
      weekEnd.toISOString().split('T')[0]
    }`;
    // Calcular la cantidad de productos vendidos en la semana
    const { totalProductosVendidos, facturacionTotal } =
      calcularTotales(ordersInWeek);
    productsSoldByWeek[weekKey] = totalProductosVendidos;
    totalRevenueByWeek[weekKey] = facturacionTotal;
    // Calcular la cantidad de ventas en la semana
    salesByWeek[weekKey] = ordersInWeek.length;
  }

  return { productsSoldByWeek, salesByWeek, totalRevenueByWeek };
};
