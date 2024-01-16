import {
  getFirestore,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { ComandaProps } from '../types/types';

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

// Función para convertir la cadena "DD/MM/YYYY" a un objeto Date

const obtenerFechaActual = () => {
  const fechaActual = new Date(); // Obtiene la fecha y hora actuales

  const dia = fechaActual.getDate();
  const mes = fechaActual.getMonth() + 1; // Los meses comienzan desde 0
  const anio = fechaActual.getFullYear();

  // Formatea la fecha como "DD/MM/AAAA"
  const fechaFormateada = `${dia}/${mes}/${anio}`;

  return fechaFormateada;
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
