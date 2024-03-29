import { DateValueType } from 'react-tailwindcss-datepicker';
import { ExpenseProps } from '../../firebase/UploadGasto';
import { PedidoProps, TelefonosProps } from '../../types/types';

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

export const updateNeto = (value: number) => {
  return {
    type: 'UPDATE_NETO',
    payload: value,
  };
};

export const setValueDate = (valueDate: DateValueType) => {
  return {
    type: 'SET_VALUEDATE',
    payload: valueDate,
  };
};

export const setTelefonos = (telefonos: TelefonosProps[]) => {
  return {
    type: 'SET_TELEFONOS',
    payload: telefonos,
  };
};
