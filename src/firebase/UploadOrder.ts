import {
  getFirestore,
  collection,
  DocumentReference,
  doc,
  getDoc,
  setDoc,
  runTransaction,
} from 'firebase/firestore';
import { DetallePedidoProps } from '../pages/DynamicForm';
import { obtenerFechaActual } from '../helpers/dateToday';
import { v4 as uuidv4 } from 'uuid';
import { PedidoProps } from '../types/types';

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
  orderDetail: OrderDetailProps
): Promise<DocumentReference> => {
  const firestore = getFirestore();
  const pedidoId = uuidv4();
  const fechaFormateada = obtenerFechaActual();
  const [dia, mes, anio] = fechaFormateada.split('/');
  const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
  const pedidoDocRef = doc(pedidosCollectionRef, dia);

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
    console.log('Pedido subido correctamente');
    return pedidoDocRef;
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

    getDoc(pedidoDocRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const existingData = docSnap.data();
          const pedidosDelDia = existingData.pedidos || [];

          // Buscar el pedido por su ID y actualizar el cadete
          const pedidosActualizados = pedidosDelDia.map(
            (pedido: PedidoProps) => {
              if (pedido.fecha === fechaPedido && pedido.id === pedidoId) {
                return { ...pedido, cadete: nuevoCadete };
              } else {
                return pedido;
              }
            }
          );

          setDoc(pedidoDocRef, {
            ...existingData,
            pedidos: pedidosActualizados,
          }).then(() => {
            resolve();
          });
        } else {
          reject(new Error('El pedido no existe para la fecha especificada.'));
        }
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

    getDoc(pedidoDocRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const existingData = docSnap.data();
          const pedidosDelDia = existingData.pedidos || [];

          // Buscar el pedido por su ID y actualizar el cadete
          const pedidosActualizados = pedidosDelDia.map(
            (pedido: PedidoProps) => {
              if (pedido.fecha === fechaPedido && pedido.id === pedidoId) {
                return { ...pedido, dislike };
              } else {
                return pedido;
              }
            }
          );

          setDoc(pedidoDocRef, {
            ...existingData,
            pedidos: pedidosActualizados,
          }).then(() => {
            resolve();
          });
        } else {
          reject(new Error('El pedido no existe para la fecha especificada.'));
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const updateDelayForOrder = (
  fechaPedido: string,
  pedidoId: string,
  delay: boolean
): Promise<void> => {
  const firestore = getFirestore();

  return new Promise((resolve, reject) => {
    const [dia, mes, anio] = fechaPedido.split('/');

    const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
    const pedidoDocRef = doc(pedidosCollectionRef, dia);

    getDoc(pedidoDocRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const existingData = docSnap.data();
          const pedidosDelDia = existingData.pedidos || [];

          // Buscar el pedido por su ID y actualizar el cadete
          const pedidosActualizados = pedidosDelDia.map(
            (pedido: PedidoProps) => {
              if (pedido.fecha === fechaPedido && pedido.id === pedidoId) {
                return { ...pedido, delay };
              } else {
                return pedido;
              }
            }
          );

          setDoc(pedidoDocRef, {
            ...existingData,
            pedidos: pedidosActualizados,
          }).then(() => {
            resolve();
          });
        } else {
          reject(new Error('El pedido no existe para la fecha especificada.'));
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};
