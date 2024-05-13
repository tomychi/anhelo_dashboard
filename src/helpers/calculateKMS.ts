import { PedidoProps } from '../types/types';

// sumar todos los kms de los pedidos y los que no tengan la prop km, sumarlos como 0
export const calculateKMS = (pedidos: PedidoProps[]) => {
  return pedidos.reduce((acc, pedido) => {
    return acc + (pedido.kms || 0);
  }, 0);
};
