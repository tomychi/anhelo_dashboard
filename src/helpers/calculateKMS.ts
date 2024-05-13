import { PedidoProps } from '../types/types';

// sumar todos los kms de los pedidos y los que no tengan la prop km, sumarlos como 0
export const calculateKMS = (pedidos: PedidoProps[]) => {
  return pedidos.reduce((acc, pedido) => {
    return acc + (pedido.kms || 0);
  }, 0);
};

// los pedidos que esten a menos de 2km es viaje cerca, entre 2km y 3.5km es viaje lejos y superando 3.5 es viaje muy lejos hacer una funcion que te devuelva el tipo de viaje y te devuelva la cantidad de pedidos de cada tipo

const tipoViaje = (kms: number) => {
  if (kms < 2) {
    return 'viaje cerca';
  } else if (kms >= 2 && kms < 3.5) {
    return 'viaje lejos';
  } else {
    return 'viaje muy lejos';
  }
};

export const tipoViajes = (pedidos: PedidoProps[]) => {
  return pedidos.reduce(
    (acc, pedido) => {
      const tipo = tipoViaje(pedido.kms || 0);
      return {
        ...acc,
        [tipo]: acc[tipo] + 1,
      };
    },
    {
      'viaje cerca': 0,
      'viaje lejos': 0,
      'viaje muy lejos': 0,
    }
  );
};
