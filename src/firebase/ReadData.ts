import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
  getDoc,
} from 'firebase/firestore';
import { PedidoProps } from '../types/types';
import { obtenerFechaActual } from '../helpers/dateToday';
import { ExpenseProps } from './UploadGasto';

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

type OrdersCallback = (pedidos: PedidoProps[]) => void;

export const ReadOrdersForToday = (callback: OrdersCallback): Unsubscribe => {
  const firestore = getFirestore();
  const todayDateString = obtenerFechaActual(); // Asumiendo que tienes una función obtenerFechaActual() definida en otro lugar

  // Obtener el año, mes y día actual
  const [day, month, year] = todayDateString.split('/');

  // Referencia al documento del día actual dentro de la colección del mes actual
  const ordersDocRef = doc(firestore, 'pedidos', year, month, day);

  // Escuchar cambios en el documento del día actual
  return onSnapshot(
    ordersDocRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        // Si el documento existe, obtener el arreglo de pedidos
        const pedidosDelDia = docSnapshot.data()?.pedidos || [];
        callback(pedidosDelDia as PedidoProps[]); // Llamar a la función de devolución de llamada con los pedidos encontrados
      } else {
        // Si el documento no existe, no hay pedidos para el día actual
        callback([]); // Llamar a la función de devolución de llamada con un arreglo vacío
      }
    },
    (error) => {
      console.error('Error al obtener los pedidos para el día actual:', error);
    }
  );
};

// Función para marcar un pedido como elaborado en Firestore
export const marcarPedidoComoElaborado = async (pedidoId: string) => {
  const todayDateString = obtenerFechaActual(); // Asumiendo que tienes una función obtenerFechaActual() definida en otro lugar

  // Obtener el año, mes y día actual
  const [dia, mes, anio] = todayDateString.split('/');
  try {
    // Obtener referencia al documento del día dentro de la colección de pedidos en Firestore
    const pedidoDocRef = doc(getFirestore(), 'pedidos', anio, mes, dia);

    // Obtener el documento del día
    const pedidoDocSnapshot = await getDoc(pedidoDocRef);

    if (pedidoDocSnapshot.exists()) {
      // Si el documento existe, obtener el arreglo de pedidos
      const pedidosDelDia = pedidoDocSnapshot.data()?.pedidos || [];

      // Encontrar el índice del pedido en el arreglo de pedidos
      const index = pedidosDelDia.findIndex(
        (pedido: PedidoProps) => pedido.id === pedidoId
      );

      if (index !== -1) {
        // Si se encuentra el pedido en el arreglo, marcarlo como elaborado
        pedidosDelDia[index].elaborado = true;

        // Actualizar el documento del día con el arreglo de pedidos modificado
        await updateDoc(pedidoDocRef, {
          pedidos: pedidosDelDia,
        });

        console.log('Pedido marcado como elaborado en Firestore');
      } else {
        console.error(
          'El pedido no fue encontrado en el arreglo de pedidos del día'
        );
      }
    } else {
      console.error('No se encontró el documento del día en Firestore');
    }
  } catch (error) {
    console.error('Error al marcar pedido como elaborado en Firestore:', error);
  }
};

// Función para eliminar un pedido de la base de datos en Firestore
export const eliminarDocumento = async (
  dbName: string,
  documentoId: string
) => {
  try {
    const todayDateString = obtenerFechaActual(); // Asumiendo que tienes una función obtenerFechaActual() definida en otro lugar

    // Obtener el año, mes y día actual
    const [dia, mes, anio] = todayDateString.split('/');

    // Obtener referencia al documento del día dentro de la colección en Firestore
    const docRef = doc(getFirestore(), dbName, anio, mes, dia);

    // Obtener el documento del día
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      // Si el documento existe, obtener el arreglo de pedidos o gastos
      const data = docSnapshot.data()?.[dbName] || [];

      // Filtrar el arreglo para excluir el documento que se va a eliminar
      const dataActualizado = data.filter(
        (item: ExpenseProps | PedidoProps) => item.id !== documentoId
      );

      // Actualizar el documento del día con el arreglo actualizado
      await updateDoc(docRef, {
        [dbName]: dataActualizado,
      });

      console.log(`${dbName} eliminado de Firestore`);
    } else {
      console.error(
        `No se encontró el documento del día en Firestore para ${dbName}`
      );
    }
  } catch (error) {
    console.error(`Error al eliminar ${dbName} de Firestore:`, error);
  }
};

export const ReadOrdersForDate = (
  year: string,
  month: string,
  day: string,
  callback: OrdersCallback
) => {
  const firestore = getFirestore();
  const ordersDocRef = doc(firestore, 'pedidos', year, month, day);

  // Obtener una vez los datos del documento para la fecha especificada
  getDoc(ordersDocRef)
    .then((docSnapshot) => {
      if (docSnapshot.exists()) {
        // Si el documento existe, obtener el arreglo de pedidos
        const pedidosDelDia = docSnapshot.data()?.pedidos || [];
        callback(pedidosDelDia as PedidoProps[]); // Llamar a la función de devolución de llamada con los pedidos encontrados
      } else {
        // Si el documento no existe, no hay pedidos para la fecha especificada
        callback([]); // Llamar a la función de devolución de llamada con un arreglo vacío
      }
    })
    .catch((error) => {
      console.error(
        'Error al obtener los pedidos para la fecha especificada:',
        error
      );
    });
};

type DataCallback<T> = (data: T[]) => void;

interface DateProps {
  startDate: Date;
  endDate: Date;
}

export const ReadDataForDateRange = <T>(
  dbName: string,
  valueDate: DateProps,
  callback: DataCallback<T>
) => {
  const { startDate, endDate } = valueDate;
  const firestore = getFirestore();

  const allData: { [key: string]: T[] } = {};

  const getDataForDate = async (date: Date) => {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    const docRef = doc(firestore, dbName, year, month, day);

    try {
      const docSnapshot = await getDoc(docRef);
      if (docSnapshot.exists()) {
        const data = docSnapshot.data()?.[dbName] || []; // Cambia 'pedidos' por el nombre correcto del campo
        allData[`${year}-${month}-${day}`] = data;
      } else {
        allData[`${year}-${month}-${day}`] = [];
      }
    } catch (error) {
      console.error(
        `Error al obtener los datos para la fecha ${year}-${month}-${day}:`,
        error
      );
    }
  };

  const datesInRange = [];
  const currentDate = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (currentDate <= end) {
    datesInRange.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const getDataPromises = datesInRange.map((date) => getDataForDate(date));

  Promise.all(getDataPromises).then(() => {
    const mergedData = Object.values(allData).reduce(
      (merged, data) => [...merged, ...data],
      []
    );
    callback(mergedData);
  });
};
