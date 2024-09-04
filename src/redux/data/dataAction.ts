import { DateValueType } from 'react-tailwindcss-datepicker';
import { ExpenseProps } from '../../firebase/UploadGasto';
import {
  Cadete,
  CadeteData,
  PedidoProps,
  TelefonosProps,
} from '../../types/types';

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
export const setCatedesVueltas = (
  vueltas: Cadete[],
  cadetesData: CadeteData
) => {
  // Mapear a través de las vueltas y actualizar la paga si es 0
  const vueltasActualizadas = vueltas.map((cadete) => {
    const vueltasActualizadasCadete = (cadete.vueltas || []).map((vuelta) => {
      if (vuelta.paga === 0) {
        const puntosDeEntrega = vuelta.orders.length;
        const pagaPorPuntosDeEntrega =
          puntosDeEntrega * cadetesData.precioPuntoEntrega;
        const pagaPorKmRecorridos =
          vuelta.totalDistance * cadetesData.precioPorKM;
        const pagaVuelta = pagaPorPuntosDeEntrega + pagaPorKmRecorridos;
        return { ...vuelta, paga: pagaVuelta };
      }
      return vuelta;
    });
    return { ...cadete, vueltas: vueltasActualizadasCadete };
  });

  // Despachar la acción para actualizar el estado con las vueltas modificadas
  return {
    type: 'SET_VUELTAS',
    payload: vueltasActualizadas,
  };
};

export const setLoading = (isLoading: boolean) => {
  return {
    type: 'SET_LOADING',
    payload: isLoading,
  };
};
