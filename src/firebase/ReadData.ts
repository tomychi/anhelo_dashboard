import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  updateDoc,
} from 'firebase/firestore';
import { PedidoProps } from '../types/types';
import { obtenerFechaActual } from '../helpers/dateToday';
import { ExpenseProps } from './UploadGasto';
import { DateValueType } from 'react-tailwindcss-datepicker';
import { Unsubscribe } from 'redux';

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

export const addIngredientsToBurger = async (
  burgerId: string,
  ingredientes: Map<string, number>
): Promise<Record<string, number>> => {
  const firestore = getFirestore();
  const burgerDocRef = doc(firestore, 'burgers', burgerId);
  const friesDocRef = doc(firestore, 'fries', burgerId); // Usar el mismo ID para buscar en "fries"
  const drinksDocRef = doc(firestore, 'drinks', burgerId); // Usar el mismo ID para buscar en "drinks"
  const toppingsDocRef = doc(firestore, 'toppings', burgerId); // Usar el mismo ID para buscar en "toppings"

  try {
    // Intentar actualizar el documento en la colección "burgers"
    await updateDoc(burgerDocRef, {
      ingredients: Object.fromEntries(ingredientes.entries()),
    });

    // Devolver algún valor si es necesario
    return Promise.resolve(Object.fromEntries(ingredientes.entries())); // Por ejemplo, podrías devolver un valor, una cadena, etc.
  } catch (error) {
    // Si ocurre un error, intentar actualizar el documento en la colección "fries"
    try {
      await updateDoc(friesDocRef, {
        ingredients: Object.fromEntries(ingredientes.entries()),
      });

      // Devolver algún valor si es necesario
      return Promise.resolve(Object.fromEntries(ingredientes.entries())); // Por ejemplo, podrías devolver un valor, una cadena, etc.
    } catch (error) {
      // Si ocurre un error, intentar actualizar el documento en la colección "drinks"
      try {
        await updateDoc(drinksDocRef, {
          ingredients: Object.fromEntries(ingredientes.entries()),
        });

        // Devolver algún valor si es necesario
        return Promise.resolve(Object.fromEntries(ingredientes.entries())); // Por ejemplo, podrías devolver un valor, una cadena, etc.
      } catch (error) {
        // Si ocurre un error, intentar actualizar el documento en la colección "toppings"
        try {
          await updateDoc(toppingsDocRef, {
            ingredients: Object.fromEntries(ingredientes.entries()),
          });

          // Devolver algún valor si es necesario
          return Promise.resolve(Object.fromEntries(ingredientes.entries())); // Por ejemplo, podrías devolver un valor, una cadena, etc.
        } catch (error) {
          console.error('Error adding ingredients: ', error);
          throw new Error(
            'Failed to add ingredients to burger, fries, drinks, or toppings'
          );
        }
      }
    }
  }
};

export const ReadDataSell = async () => {
  const firestore = getFirestore();

  const collections = ['burgers', 'fries', 'toppings', 'drinks'];

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
export const marcarPedidoComoElaborado = async (
  pedidoId: string,
  tiempo: string
) => {
  const todayDateString = obtenerFechaActual();
  const [dia, mes, anio] = todayDateString.split('/');

  try {
    const firestore = getFirestore();
    const pedidoDocRef = doc(firestore, 'pedidos', anio, mes, dia);

    await runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);

      if (!pedidoDocSnapshot.exists()) {
        console.error('No se encontró el documento del día en Firestore');
        return;
      }

      const pedidosDelDia = pedidoDocSnapshot.data()?.pedidos || [];
      const index = pedidosDelDia.findIndex(
        (pedido: PedidoProps) => pedido.id === pedidoId
      );

      if (index !== -1) {
        pedidosDelDia[index].elaborado = true;
        pedidosDelDia[index].tiempoElaborado = tiempo;
        transaction.set(pedidoDocRef, { pedidos: pedidosDelDia });
        console.log('Pedido marcado como elaborado en Firestore');
      } else {
        console.error(
          'El pedido no fue encontrado en el arreglo de pedidos del día'
        );
      }
    });
  } catch (error) {
    console.error('Error al marcar pedido como elaborado en Firestore:', error);
  }
};

export const marcarPedidoComoEntregado = async (
  pedidoId: string,
  tiempo: string
) => {
  const todayDateString = obtenerFechaActual();
  const [dia, mes, anio] = todayDateString.split('/');

  try {
    const firestore = getFirestore();
    const pedidoDocRef = doc(firestore, 'pedidos', anio, mes, dia);

    await runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);

      if (!pedidoDocSnapshot.exists()) {
        console.error('No se encontró el documento del día en Firestore');
        return;
      }

      const pedidosDelDia = pedidoDocSnapshot.data()?.pedidos || [];
      const index = pedidosDelDia.findIndex(
        (pedido: PedidoProps) => pedido.id === pedidoId
      );

      if (index !== -1) {
        pedidosDelDia[index].tiempoEntregado = tiempo;
        pedidosDelDia[index].entregado = true;
        transaction.set(pedidoDocRef, { pedidos: pedidosDelDia });
        console.log('Pedido marcado como entregado en Firestore');
      } else {
        console.error(
          'El pedido no fue encontrado en el arreglo de pedidos del día'
        );
      }
    });
  } catch (error) {
    console.error('Error al marcar pedido como entregado en Firestore:', error);
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

    runTransaction(getFirestore(), async (transaction) => {
      const docSnapshot = await transaction.get(docRef);

      if (!docSnapshot.exists()) {
        console.error(
          `No se encontró el documento del día en Firestore para ${dbName}`
        );
        return;
      }

      // Si el documento existe, obtener el arreglo de pedidos o gastos
      const data = docSnapshot.data()?.[dbName] || [];

      // Filtrar el arreglo para excluir el documento que se va a eliminar
      const dataActualizado = data.filter(
        (item: ExpenseProps | PedidoProps) => item.id !== documentoId
      );

      // Actualizar el documento del día con el arreglo actualizado
      transaction.set(docRef, {
        [dbName]: dataActualizado,
      });
    })
      .then(() => {
        console.log(`${dbName} eliminado de Firestore`);
      })
      .catch((error) => {
        console.error(`Error al eliminar ${dbName} de Firestore:`, error);
      });
  } catch (error) {
    console.error(`Error al eliminar ${dbName} de Firestore:`, error);
  }
};
export const ReadDataForDateRange = <T>(
  dbName: string,
  valueDate: DateValueType
): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    let requestCount = 0; // Inicializa el contador de solicitudes

    try {
      if (!valueDate || !valueDate.startDate || !valueDate.endDate) {
        throw new Error('Fecha de inicio o fin no especificada.');
      }
      const { startDate, endDate } = valueDate;
      const firestore = getFirestore();

      const allData: { [key: string]: T[] } = {};

      const getDataForDate = async (date: Date) => {
        requestCount++; // Incrementa el contador en cada solicitud

        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        const docRef = doc(firestore, dbName, year, month, day);

        try {
          const docSnapshot = await getDoc(docRef);
          if (docSnapshot.exists()) {
            const data = docSnapshot.data()?.[dbName] || [];
            allData[`${year}-${month}-${day}`] = data;
          } else {
            allData[`${year}-${month}-${day}`] = [];
          }
        } catch (error) {
          throw new Error(
            `Error al obtener los datos para la fecha ${year}-${month}-${day}: ${error}`
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

      Promise.all(getDataPromises)
        .then(() => {
          console.log(
            `Número total de solicitudes a la base de datos: ${requestCount}`
          );
          const mergedData = Object.values(allData).reduce(
            (merged, data) => [...merged, ...data],
            []
          );
          resolve(mergedData);
        })
        .catch((error) => {
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
};
