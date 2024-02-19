import { ExpenseProps } from '../../firebase/UploadGasto';
import { PedidoProps } from '../../types/types';

export const readOrdersData = (orders: PedidoProps[]) => {
  return {
    type: 'READ_ORDERS',
    payload: orders ? { orders } : undefined, // Proporcionar payload solo si orders no es undefined
  };
};

export const readExpensesData = (expenseData: ExpenseProps[]) => {
  return {
    type: 'READ_EXPENSES',
    payload: expenseData ? { expenseData } : undefined,
  };
};
