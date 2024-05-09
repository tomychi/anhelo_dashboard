import {
  getFirestore,
  collection,
  doc,
  runTransaction,
} from 'firebase/firestore';
import { DetallePedidoProps } from '../pages/DynamicForm';
import { obtenerFechaActual } from '../helpers/dateToday';
import { v4 as uuidv4 } from 'uuid';
import { PedidoProps } from '../types/types';
import { UploadAfip } from './afip';
import { restaurantLocation } from '../data/restaurantLocation';
import { obtenerDistanciaYMinuto } from '../apis/getCoords';

// Agregar orderDetail a la colección 'pedidos'

interface OrderDetailProps {
  envio: number;
  detallePedido: DetallePedidoProps[];
  subTotal: number;
  total: number;
  fecha: string;
  aclaraciones: string;
  metodoPago: string;
  direccion: string;
  telefono: string;
  hora: string;
}
export const UploadOrder = async (
  orderDetail: OrderDetailProps,
  aliasCuenta: string
): Promise<string> => {
  const firestore = getFirestore();
  const pedidoId = uuidv4();
  const fechaFormateada = obtenerFechaActual();
  const [dia, mes, anio] = fechaFormateada.split('/');
  const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
  const pedidoDocRef = doc(pedidosCollectionRef, dia);

  if (orderDetail.metodoPago === 'mercadopago') {
    UploadAfip({ monto: orderDetail.total, aliasCuenta });
  }

  try {
    await runTransaction(firestore, async (transaction) => {
      const docSnapshot = await transaction.get(pedidoDocRef);
      const existingData = docSnapshot.exists() ? docSnapshot.data() : {};
      const pedidosDelDia = existingData.pedidos || [];
      pedidosDelDia.push({ ...orderDetail, id: pedidoId });
      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosDelDia,
      });
    });
    return pedidoId;
  } catch (error) {
    console.error('Error al subir el pedido:', error);
    throw error;
  }
};

export const updateCadeteForOrder = (
  fechaPedido: string,
  pedidoId: string,
  nuevoCadete: string
): Promise<void> => {
  const firestore = getFirestore();

  return new Promise((resolve, reject) => {
    const [dia, mes, anio] = fechaPedido.split('/');
    const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
    const pedidoDocRef = doc(pedidosCollectionRef, dia);

    runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);
      if (!pedidoDocSnapshot.exists()) {
        reject(new Error('El pedido no existe para la fecha especificada.'));
        return;
      }

      const existingData = pedidoDocSnapshot.data();
      const pedidosDelDia = existingData.pedidos || [];

      const pedidosActualizados = pedidosDelDia.map((pedido: PedidoProps) => {
        if (pedido.fecha === fechaPedido && pedido.id === pedidoId) {
          return { ...pedido, cadete: nuevoCadete };
        } else {
          return pedido;
        }
      });

      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosActualizados,
      });
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const updateDislikeForOrder = (
  fechaPedido: string,
  pedidoId: string,
  dislike: boolean
): Promise<void> => {
  const firestore = getFirestore();

  return new Promise((resolve, reject) => {
    const [dia, mes, anio] = fechaPedido.split('/');
    const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
    const pedidoDocRef = doc(pedidosCollectionRef, dia);

    runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);
      if (!pedidoDocSnapshot.exists()) {
        reject(new Error('El pedido no existe para la fecha especificada.'));
        return;
      }

      const existingData = pedidoDocSnapshot.data();
      const pedidosDelDia = existingData.pedidos || [];

      const pedidosActualizados = pedidosDelDia.map((pedido: PedidoProps) => {
        if (pedido.fecha === fechaPedido && pedido.id === pedidoId) {
          return { ...pedido, dislike };
        } else {
          return pedido;
        }
      });

      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosActualizados,
      });
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const updateCompesasionForOrder = (
  fechaPedido: string,
  pedidoId: string,
  compensasion: number,
  bonificacion: number
): Promise<void> => {
  const firestore = getFirestore();

  return new Promise((resolve, reject) => {
    const [dia, mes, anio] = fechaPedido.split('/');
    const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
    const pedidoDocRef = doc(pedidosCollectionRef, dia);

    runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);
      if (!pedidoDocSnapshot.exists()) {
        reject(new Error('El pedido no existe para la fecha especificada.'));
        return;
      }

      const existingData = pedidoDocSnapshot.data();
      const pedidosDelDia = existingData.pedidos || [];

      const pedidosActualizados = pedidosDelDia.map((pedido: PedidoProps) => {
        if (pedido.fecha === fechaPedido && pedido.id === pedidoId) {
          // Calcular el nuevo total restando la compensación y la bonificación
          const nuevoTotal = pedido.total - compensasion - bonificacion;
          return {
            ...pedido,
            compensacionPorError: compensasion,
            bonificacion: bonificacion,
            total: nuevoTotal, // Actualizar el total
          };
        } else {
          return pedido;
        }
      });

      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosActualizados,
      });
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const updateTiempoEntregaForOrder = (
  fechaPedido: string,
  pedidoId: string,
  nuevoTiempoEntrega: string
): Promise<void> => {
  const firestore = getFirestore();

  return new Promise((resolve, reject) => {
    const [dia, mes, anio] = fechaPedido.split('/');
    const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
    const pedidoDocRef = doc(pedidosCollectionRef, dia);

    runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);
      if (!pedidoDocSnapshot.exists()) {
        reject(new Error('El pedido no existe para la fecha especificada.'));
        return;
      }

      const existingData = pedidoDocSnapshot.data();
      const pedidosDelDia = existingData.pedidos || [];

      const pedidosActualizados = pedidosDelDia.map((pedido: PedidoProps) => {
        if (pedido.fecha === fechaPedido && pedido.id === pedidoId) {
          return {
            ...pedido,
            tiempoEntregado: nuevoTiempoEntrega, // Actualizar el tiempo de entrega
          };
        } else {
          return pedido;
        }
      });

      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosActualizados,
      });
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const updateTiempoElaboradoForOrder = (
  fechaPedido: string,
  pedidoId: string,
  nuevoTiempoElaborado: string
): Promise<void> => {
  const firestore = getFirestore();

  return new Promise((resolve, reject) => {
    const [dia, mes, anio] = fechaPedido.split('/');
    const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
    const pedidoDocRef = doc(pedidosCollectionRef, dia);

    runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);
      if (!pedidoDocSnapshot.exists()) {
        reject(new Error('El pedido no existe para la fecha especificada.'));
        return;
      }

      const existingData = pedidoDocSnapshot.data();
      const pedidosDelDia = existingData.pedidos || [];

      const pedidosActualizados = pedidosDelDia.map((pedido: PedidoProps) => {
        if (pedido.fecha === fechaPedido && pedido.id === pedidoId) {
          return {
            ...pedido,
            tiempoElaborado: nuevoTiempoElaborado, // Actualizar el tiempo de entrega
          };
        } else {
          return pedido;
        }
      });

      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosActualizados,
      });
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const handleAddressSave = async (
  fechaPedido: string,
  pedidoId: string,
  coords: [number, number]
): Promise<void> => {
  const firestore = getFirestore();

  try {
    const [dia, mes, anio] = fechaPedido.split('/');
    const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
    const pedidoDocRef = doc(pedidosCollectionRef, dia);

    await runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);
      if (!pedidoDocSnapshot.exists()) {
        throw new Error('El pedido no existe para la fecha especificada.');
      }

      const existingData = pedidoDocSnapshot.data();
      const pedidosDelDia = existingData.pedidos || [];

      const { kms, minutosDistancia } = await obtenerDistanciaYMinuto(
        restaurantLocation,
        coords
      );

      const pedidosActualizados = pedidosDelDia.map((pedido: PedidoProps) => {
        if (pedido.fecha === fechaPedido && pedido.id === pedidoId) {
          return { ...pedido, map: coords, kms, minutosDistancia };
        } else {
          return pedido;
        }
      });

      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosActualizados,
      });
    });

    console.log('Pedido actualizado correctamente en Firestore');
  } catch (error) {
    console.error('Error al manejar la dirección:', error);
    throw error;
  }
};
