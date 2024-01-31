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
export const eliminarPedido = async (pedidoId: string) => {
  try {
    const todayDateString = obtenerFechaActual(); // Asumiendo que tienes una función obtenerFechaActual() definida en otro lugar

    // Obtener el año, mes y día actual
    const [dia, mes, anio] = todayDateString.split('/');
    // Obtener referencia al documento del día dentro de la colección de pedidos en Firestore
    const pedidoDocRef = doc(getFirestore(), 'pedidos', anio, mes, dia);

    // Obtener el documento del día
    const pedidoDocSnapshot = await getDoc(pedidoDocRef);

    if (pedidoDocSnapshot.exists()) {
      // Si el documento existe, obtener el arreglo de pedidos
      const pedidosDelDia = pedidoDocSnapshot.data()?.pedidos || [];

      // Filtrar el arreglo de pedidos para excluir el pedido que se va a eliminar
      const pedidosActualizados = pedidosDelDia.filter(
        (pedido: PedidoProps) => pedido.id !== pedidoId
      );

      // Actualizar el documento del día con el arreglo de pedidos actualizado
      await updateDoc(pedidoDocRef, {
        pedidos: pedidosActualizados,
      });

      console.log('Pedido eliminado de Firestore');
    } else {
      console.error('No se encontró el documento del día en Firestore');
    }
  } catch (error) {
    console.error('Error al eliminar pedido de Firestore:', error);
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

export const ReadOrdersForDateRange = (
  startYear: string,
  startMonth: string,
  startDay: string,
  endYear: string,
  endMonth: string,
  endDay: string,
  callback: OrdersCallback
) => {
  const firestore = getFirestore();

  // Convertir las fechas de inicio y fin a objetos Date
  const startDate = new Date(`${startYear}-${startMonth}-${startDay}`);
  const endDate = new Date(`${endYear}-${endMonth}-${endDay}`);

  // Inicializar un objeto para almacenar los pedidos
  const allOrders: { [key: string]: PedidoProps[] } = {};

  // Función para obtener los pedidos para una fecha específica
  const getOrdersForDate = async (date: Date) => {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    // Obtener la referencia al documento del día actual
    const ordersDocRef = doc(firestore, 'pedidos', year, month, day);

    try {
      // Obtener los pedidos para el día actual
      const docSnapshot = await getDoc(ordersDocRef);
      if (docSnapshot.exists()) {
        // Si el documento existe, obtener el arreglo de pedidos y almacenarlos en el objeto
        const pedidosDelDia = docSnapshot.data()?.pedidos || [];
        allOrders[`${year}-${month}-${day}`] = pedidosDelDia as PedidoProps[];
      } else {
        // Si el documento no existe, asignar un arreglo vacío para la fecha actual
        allOrders[`${year}-${month}-${day}`] = [];
      }
    } catch (error) {
      console.error(
        `Error al obtener los pedidos para la fecha ${year}-${month}-${day}:`,
        error
      );
    }
  };

  // Generar un arreglo de todas las fechas dentro del rango
  const datesInRange = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    datesInRange.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Obtener los pedidos para cada fecha dentro del rango
  const getOrdersPromises = datesInRange.map((date) => getOrdersForDate(date));

  // Esperar a que todas las consultas se completen
  Promise.all(getOrdersPromises).then(() => {
    // Concatenar todos los pedidos en un arreglo único
    const mergedOrders = Object.values(allOrders).reduce(
      (merged, pedidos) => [...merged, ...pedidos],
      []
    );
    // Llamar a la función de devolución de llamada con todos los pedidos recopilados
    callback(mergedOrders);
  });
};
