import {
  getFirestore,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { ComandaProps } from '../types/types';
import { obtenerFechaActual } from '../helpers/dateToday';

export const ReadData = async () => {
  const firestore = getFirestore();

  const collections = ['burgers', 'drinks', 'fries', 'toppings'];

  const fetchedData = await Promise.all(
    collections.map(async (collectionName) => {
      const collectionRef = collection(firestore, collectionName);
      const snapshot = await getDocs(collectionRef);

      const dataWithIds = snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
        collectionName: collectionName,
      }));

      return dataWithIds;
    })
  );

  return fetchedData.flat();
};

type OrdersCallback = (pedidos: ComandaProps[]) => void;

// Obtener pedidos para la fecha actual
export const ReadOrdersForToday = (callback: OrdersCallback) => {
  const firestore = getFirestore();
  const ordersCollectionRef = collection(firestore, 'pedidos');

  const todayDateString = obtenerFechaActual();

  const queryToday = query(
    ordersCollectionRef,
    where('fecha', '==', todayDateString)
  );

  return onSnapshot(queryToday, (snapshot) => {
    const fetchedData = snapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
    })) as ComandaProps[]; // Asegúrate de ajustar DocumentData según los datos reales
    callback(fetchedData);
  });
};

export const ReadOrdersAll = (callback: OrdersCallback) => {
  const firestore = getFirestore();
  const ordersCollectionRef = collection(firestore, 'pedidos');

  return onSnapshot(ordersCollectionRef, (snapshot) => {
    const fetchedData = snapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
    })) as ComandaProps[]; // Asegúrate de ajustar DocumentData según los datos reales
    callback(fetchedData);
  });
};

// Función para marcar un pedido como elaborado en Firestore
export const marcarPedidoComoElaborado = async (pedidoId: string) => {
  try {
    // Obtener referencia al documento del pedido en Firestore
    const pedidoRef = doc(getFirestore(), 'pedidos', pedidoId);

    // Actualizar el documento para marcarlo como elaborado
    await updateDoc(pedidoRef, {
      elaborado: true,
    });

    console.log('Pedido marcado como elaborado en Firestore');
  } catch (error) {
    console.error('Error al marcar pedido como elaborado en Firestore:', error);
  }
};
