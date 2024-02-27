import {
  getFirestore,
  collection,
  DocumentReference,
  doc,
  getDoc,
  setDoc,
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
export const UploadOrder = (
  orderDetail: OrderDetailProps
): Promise<DocumentReference> => {
  const firestore = getFirestore();

  // Generar un ID único para el pedido
  const pedidoId = uuidv4();

  // Obtener la fecha formateada
  const fechaFormateada = obtenerFechaActual();

  // Separar la fecha en día, mes y año
  const [dia, mes, anio] = fechaFormateada.split('/');

  // Crear la referencia a la colección con tres segmentos: pedidos/año/mes
  const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);

  // Crear la referencia a un documento con el ID igual al día
  const pedidoDocRef = doc(pedidosCollectionRef, dia);

  // Retorna una promesa
  return new Promise((resolve, reject) => {
    // Obtener los datos actuales del documento
    getDoc(pedidoDocRef)
      .then((docSnap) => {
        const existingData = docSnap.exists() ? docSnap.data() : {};

        // Obtener o inicializar el arreglo de pedidos para el día
        const pedidosDelDia = existingData.pedidos || [];

        // Agregar el nuevo pedido al arreglo
        pedidosDelDia.push({ ...orderDetail, id: pedidoId });

        // Actualizar los datos del documento con el nuevo arreglo de pedidos
        setDoc(pedidoDocRef, {
          ...existingData,
          pedidos: pedidosDelDia,
        }).then(() => {
          resolve(pedidoDocRef); // Resuelve la promesa con la referencia al documento
        });
      })
      .catch((error) => {
        reject(error); // Rechaza la promesa con el error
      });
  });
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
