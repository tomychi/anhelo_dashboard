import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { obtenerFechaActual } from '../helpers/dateToday';
import { Unsubscribe } from 'redux';

interface AfipDetailProps {
  monto: number;
  aliasCuenta: string;
}
export const UploadAfip = async (
  afipDetail: AfipDetailProps
): Promise<string> => {
  const afipId = uuidv4();

  const firestore = getFirestore();
  const fechaFormateada = obtenerFechaActual();
  const [, mes, anio] = fechaFormateada.split('/');
  const pedidosCollectionRef = collection(firestore, 'afip', anio, mes);
  const pedidoDocRef = doc(pedidosCollectionRef, 'datos');

  try {
    await runTransaction(firestore, async (transaction) => {
      const docSnapshot = await transaction.get(pedidoDocRef);
      const existingData = docSnapshot.exists() ? docSnapshot.data() : {};

      // Obtener los montos acumulados para el alias de la cuenta bancaria
      const montosPorAlias = existingData.montosPorAlias || {};

      // Sumar el monto del pedido al valor existente para el alias de la cuenta bancaria en el mismo mes
      montosPorAlias[afipDetail.aliasCuenta] =
        (montosPorAlias[afipDetail.aliasCuenta] || 0) + afipDetail.monto;

      // Actualizar los datos en Firestore
      transaction.set(
        pedidoDocRef,
        {
          montosPorAlias,
        },
        { merge: true }
      );
    });

    console.log('Pedido subido correctamente');
    return afipId;
  } catch (error) {
    console.error('Error al subir el pedido:', error);
    throw error;
  }
};

export const obtenerMontosPorAlias = (
  anio: string,
  mes: string,
  callback: (montos: Record<string, number>) => void
): Unsubscribe => {
  const firestore = getFirestore();
  const pedidosCollectionRef = collection(firestore, 'afip', anio, mes);
  const pedidoDocRef = doc(pedidosCollectionRef, 'datos');

  // Escuchar cambios en el documento
  return onSnapshot(
    pedidoDocRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data && data.montosPorAlias) {
          // Si el documento existe y contiene montos por alias, llamar al callback con esos montos
          callback(data.montosPorAlias as Record<string, number>);
        } else {
          // Si el documento existe pero no contiene montos por alias, llamar al callback con un objeto vacío
          callback({});
        }
      } else {
        // Si el documento no existe, llamar al callback con un objeto vacío
        callback({});
      }
    },
    (error) => {
      console.error('Error al obtener los montos por alias:', error);
    }
  );
};
