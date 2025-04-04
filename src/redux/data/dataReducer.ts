import { DateValueType } from 'react-tailwindcss-datepicker';
import { ExpenseProps } from '../../firebase/UploadGasto';
import { BurgersPedidas, calcularTotales } from '../../helpers/calculator';
import { Cadete, PedidoProps, TelefonosProps } from '../../types/types';
import { formatDate } from '../../helpers/dateToday';

export interface DataState {
  orders: PedidoProps[];
  expenseData: ExpenseProps[];
  error: string | null; // Cambia 'string' por el tipo adecuado del mensaje de error
  facturacionTotal: number;
  totalProductosVendidos: number;
  productosPedidos: BurgersPedidas[];
  gastosTotal: number;
  neto: number;
  toppingsData: {
    name: string;
    quantity: number;
  }[];
  valueDate: DateValueType;
  telefonos: TelefonosProps[];
  vueltas: Cadete[];
  isLoading: boolean;
}

interface DataAction {
  type: string;
  payload?: DataState;
  // Otros campos específicos de tu acción, si los hay
}

const initialState: DataState = {
  orders: [],
  telefonos: [],
  expenseData: [],
  error: null,
  facturacionTotal: 0,
  totalProductosVendidos: 0,
  productosPedidos: [],
  gastosTotal: 0,
  neto: 0,
  vueltas: [],
  toppingsData: [],
  isLoading: false,
  valueDate: {
    startDate: formatDate(new Date()),
    endDate: formatDate(new Date()), // Último día de diciembre del año actual
  },
};

const dataReducer = (state = initialState, action: DataAction) => {
  switch (action.type) {
    case 'SET_VALUEDATE': {
      const valueDate = action.payload;
      return {
        ...state,
        valueDate,
      };
    }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_TELEFONOS': {
      const telefonos = action.payload;
      return {
        ...state,
        telefonos,
      };
    }

    case 'SET_VUELTAS': {
      const vueltas = action.payload;
      return {
        ...state,
        vueltas,
      };
    }

    case 'READ_ORDERS': {
      const orders = action.payload?.orders;
      if (!orders) {
        return state;
      }

      // Filtrar pedidos no cancelados y corregir estructuras problemáticas
      const activeOrders = orders.filter(order => {
        // Verificar si está cancelado
        const isCanceled = order.canceled;

        // Asegurar que detallePedido sea siempre un array
        if (!order.detallePedido || !Array.isArray(order.detallePedido)) {
          order.detallePedido = [];
        }

        return !isCanceled;
      });

      // Calcular totales basados solo en órdenes activas
      const { facturacionTotal, totalProductosVendidos, productosPedidos } =
        calcularTotales(activeOrders);

      // Calcular costo total solo de órdenes activas
      const totalCostoBurger = activeOrders.reduce((total, order) => {
        const costoBurgerOrden = order.detallePedido.reduce(
          (subtotal, pedido) => {
            if (pedido.costoBurger) {
              return subtotal + pedido.costoBurger;
            }
            return subtotal;
          },
          0
        );
        return total + costoBurgerOrden;
      }, 0);

      // Obtener todos los toppings solo de órdenes activas
      const allToppings = activeOrders
        .flatMap((o) =>
          o.detallePedido.flatMap((d) =>
            Array.from({ length: d.quantity }, () => d.toppings)
          )
        )
        .flat();

      // Contar la cantidad de cada topping
      const toppingCounts = allToppings.reduce((acc, topping) => {
        if (topping) {
          topping = topping.toLowerCase();
          acc[topping] = (acc[topping] || 0) + 1;
        }
        return acc;
      }, {} as { [topping: string]: number });

      // Construir el objeto con la cantidad y el nombre de cada topping
      const toppingsData = Object.entries(toppingCounts).map(
        ([name, quantity]) => ({
          name,
          quantity,
        })
      );

      return {
        ...state,
        orders,
        toppingsData,
        neto: facturacionTotal - totalCostoBurger,
        facturacionTotal,
        totalProductosVendidos,
        productosPedidos,
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