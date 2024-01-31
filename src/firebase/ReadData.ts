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

// Función para obtener los pedidos para una fecha específica
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
