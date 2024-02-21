import { ExpenseProps } from '../../firebase/UploadGasto';
import { BurgersPedidas, calcularTotales } from '../../helpers/calculator';
import { PedidoProps } from '../../types/types';

export interface DataState {
  orders: PedidoProps[];
  expenseData: ExpenseProps[];
  error: string | null; // Cambia 'string' por el tipo adecuado del mensaje de error
  facturacionTotal: number;
  totalProductosVendidos: number;
  hamburguesasPedidas: BurgersPedidas[];
  gastosTotal: number;
  neto: number;
}

interface DataAction {
  type: string;
  payload?: DataState;
  // Otros campos específicos de tu acción, si los hay
}

const initialState = {
  orders: [],
  expenseData: [],
  error: null,
  facturacionTotal: 0,
  totalProductosVendidos: 0,
  hamburguesasPedidas: [],
  gastosTotal: 0,
  neto: 0,
};

const dataReducer = (state = initialState, action: DataAction) => {
  switch (action.type) {
    case 'READ_ORDERS': {
      const orders = action.payload?.orders;
      if (!orders) return state; // Si orders es undefined, retornar el estado actual

      // Calcular totales basados en las nuevas órdenes
      const { facturacionTotal, totalProductosVendidos, hamburguesasPedidas } =
        calcularTotales(orders);

      // Sumar todos los valores de costoBurger en todos los elementos de orders.detallePedido
      const totalCostoBurger = orders.reduce((total, order) => {
        // Para cada orden, sumamos el costoBurger de cada elemento en su detallePedido
        const costoBurgerOrden = order.detallePedido.reduce(
          (subtotal, pedido) => {
            // Sumamos el costoBurger de este pedido al subtotal
            console.log(pedido.costoBurger, total);
            return total + pedido.costoBurger;
          },
          0
        ); // Comenzamos el subtotal en 0 para esta orden

        // Sumamos el costoBurger de esta orden al total
        return total + costoBurgerOrden;
      }, 0); // Comenzamos el total en 0

      return {
        ...state,
        orders,
        neto: facturacionTotal - totalCostoBurger,
        facturacionTotal: facturacionTotal ?? state.facturacionTotal,
        totalProductosVendidos:
          totalProductosVendidos ?? state.totalProductosVendidos,
        hamburguesasPedidas: hamburguesasPedidas ?? state.hamburguesasPedidas,
      };
    }

    case 'READ_EXPENSES': {
      const expenses = action.payload?.expenseData;
      if (!expenses) return state;
      const { facturacionTotal: gastosTotals } = calcularTotales(expenses);

      return {
        ...state,
        expenseData: expenses,
        gastosTotal: gastosTotals,
      };
    }

    case 'UPDATE_NETO': {
      return {
        ...state,
        neto: action.payload?.neto,
      };
    }
    // Otros casos para manejar acciones adicionales, como cierre de sesión, etc.
    default:
      return state;
  }
};

export default dataReducer;
