import { ExpenseProps } from '../firebase/UploadGasto';
import { PedidoProps } from '../types/types';

export interface BurgersPedidas {
  burger: string;
  quantity: number;
}

export const calcularTotales = (
  ordersData: (PedidoProps | ExpenseProps)[]
): {
  totalFacturacion: number;
  totalProductosVendidos: number;
  hamburguesasPedidas: BurgersPedidas[];
} => {
  if (ordersData.length === 0) {
    return {
      totalFacturacion: 0,
      totalProductosVendidos: 0,
      hamburguesasPedidas: [],
    }; // Devuelve 0 si no hay pedidos
  }

  // Objeto temporal para realizar el seguimiento de las hamburguesas y sus cantidades acumuladas
  const hamburguesasMap: { [burger: string]: number } = {};

  // Función para sumar las cantidades de hamburguesas
  const sumarCantidades = (burger: string, quantity: number) => {
    if (hamburguesasMap[burger]) {
      hamburguesasMap[burger] += quantity;
    } else {
      hamburguesasMap[burger] = quantity;
    }
  };

  // Iterar sobre los pedidos y gastos para calcular los totales y las hamburguesas pedidas
  const { totalFacturacion, totalProductosVendidos } = ordersData.reduce(
    (totals, order) => {
      if ('detallePedido' in order) {
        // Si es un PedidoProps, suma el total de facturación y la cantidad de productos vendidos en el detalle del pedido
        totals.totalFacturacion += order.total || 0;
        totals.totalProductosVendidos += order.detallePedido.reduce(
          (accumulator, detail) => {
            // Acumula la cantidad de productos vendidos y agrega cada hamburguesa al objeto hamburguesasMap
            sumarCantidades(detail.burger, detail.quantity);
            return accumulator + detail.quantity;
          },
          0
        );
      } else {
        // Si es un ExpenseProps, suma el total de facturación y la cantidad directamente
        totals.totalFacturacion += order.total || 0;
        totals.totalProductosVendidos += order.quantity || 0;
      }
      return totals;
    },
    { totalFacturacion: 0, totalProductosVendidos: 0 }
  );

  // Crear un arreglo con los objetos de hamburguesas y cantidades acumuladas
  const hamburguesasPedidas = Object.entries(hamburguesasMap).map(
    ([burger, quantity]) => ({
      burger,
      quantity,
    })
  );

  return { totalFacturacion, totalProductosVendidos, hamburguesasPedidas };
};
