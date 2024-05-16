import {
  DocumentData,
  DocumentReference,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  runTransaction,
  setDoc,
  where,
} from 'firebase/firestore';
import { obtenerFechaActual, obtenerHoraActual } from '../helpers/dateToday';
import { PedidoProps } from '../types/types';

export interface VueltaInfo {
  horaSalida: string;
  horaLlegada: string | null;
  ordersId: string[];
  fecha: string;
}

export const UploadVueltaCadete = async (
  ordersId: string[],
  cadete: string
): Promise<VueltaInfo[]> => {
  const firestore = getFirestore();
  const fechaFormateada = obtenerFechaActual();
  const [dia, mes, anio] = fechaFormateada.split('/');

  if (!cadete) {
    throw new Error('No se ha seleccionado un cadete');
  }

  if (!ordersId.length) {
    throw new Error('No hay pedidos en la vuelta');
  }

  try {
    // Crear una referencia al documento del cadete
    const cadeteDocRef = doc(
      firestore,
      'cadetes',
      cadete
    ) as DocumentReference<DocumentData>;

    // Crear una subcolección "vueltas" dentro del documento del cadete
    const vueltasCollectionRef = collection(cadeteDocRef, 'vueltas');

    // Crear un ID único para el documento de vuelta usando la fecha
    const vueltaId = `${anio}-${mes}-${dia}`;

    // Verificar si ya existe una vuelta con la hora de salida registrada
    const vueltaDocRef = doc(vueltasCollectionRef, vueltaId);
    const vueltaDocSnapshot = await getDoc(vueltaDocRef);

    // Obtener la hora actual
    const horaActual = obtenerHoraActual();

    // Crear una nueva vuelta con los datos proporcionados
    const nuevaVuelta: VueltaInfo = {
      horaSalida: horaActual,
      horaLlegada: null, // Hora de llegada inicializada como null
      ordersId: ordersId,
      fecha: fechaFormateada,
    };

    // Si ya existe una vuelta con la hora de salida
    if (vueltaDocSnapshot.exists()) {
      const vueltaData = vueltaDocSnapshot.data();
      let vueltas: VueltaInfo[] = [];
      if (vueltaData && Array.isArray(vueltaData.vueltas)) {
        vueltas = vueltaData.vueltas;
      }

      // Iterar sobre las vueltas existentes
      for (let i = 0; i < vueltas.length; i++) {
        const vuelta = vueltas[i];

        // Si ya existe una hora de salida y llegada, agregar una nueva vuelta
        if (
          vuelta.horaSalida &&
          vuelta.horaLlegada &&
          i === vueltas.length - 1
        ) {
          console.log('nueva vuelta agregada');
          break; // Terminar el bucle
        }

        // Actualizar la hora de llegada si está vacía
        if (vuelta.horaLlegada === null) {
          vuelta.horaLlegada = horaActual;
          await setDoc(vueltaDocRef, { vueltas }); // Actualizar las vueltas en el documento
          return vueltas;
        }
      }

      // Si no se agregó una nueva vuelta, agregarla al final
      vueltas.push(nuevaVuelta);
      console.log(vueltas);
      await setDoc(vueltaDocRef, { vueltas }); // Actualizar las vueltas en el documento
      return vueltas;
    } else {
      // Si no existe una vuelta con la hora de salida, crear una nueva vuelta
      await setDoc(vueltaDocRef, { vueltas: [nuevaVuelta] });
    }

    return [nuevaVuelta]; // Devolver la nueva vuelta
  } catch (error) {
    console.error('Error al subir la vuelta:', error);
    throw error;
  }
};

// Esta función recuperará todas las vueltas para un cadete específico en una fecha dada
export const obtenerVueltasCadete = async (
  cadete: string,
  fecha: string
): Promise<VueltaInfo[]> => {
  const firestore = getFirestore();
  const [dia, mes, anio] = fecha.split('/');
  let vueltas: VueltaInfo[] = []; // Array para almacenar las vueltas

  try {
    // Crear una referencia al documento del cadete
    const cadeteDocRef = doc(
      firestore,
      'cadetes',
      cadete
    ) as DocumentReference<DocumentData>;

    // Crear una subcolección "vueltas" dentro del documento del cadete
    const vueltasCollectionRef = collection(cadeteDocRef, 'vueltas');

    // Obtener el ID único para el documento de vuelta usando la fecha
    const vueltaId = `${anio}-${mes}-${dia}`;

    // Obtener las vueltas del cadete en la fecha dada
    const vueltasSnapshot = await getDocs(
      query(vueltasCollectionRef, where('__name__', '==', vueltaId))
    );

    // Iterar sobre los documentos de vueltas y mapearlos a objetos VueltaInfo
    vueltas = vueltasSnapshot.docs.flatMap((doc) => {
      const vueltaData = doc.data();
      const vueltasData = vueltaData.vueltas; // Acceder a la matriz de vueltas
      // Mapear sobre las vueltas y crear objetos VueltaInfo para cada una
      return vueltasData.map((vuelta: VueltaInfo) => ({
        horaSalida: vuelta.horaSalida, // Asegúrate de que esto sea correcto
        horaLlegada: vuelta.horaLlegada, // Asegúrate de que esto sea correcto
        ordersId: vuelta.ordersId, // Asegúrate de que esto sea correcto
      }));
    });
  } catch (error) {
    console.error('Error al obtener las vueltas del cadete:', error);
    throw error;
  }

  return vueltas; // Devolver el array de vueltas transformadas
};

// Función para buscar los pedidos en la base de datos de pedidos
export const buscarPedidos = async (ids: string[], fecha: string) => {
  if (!fecha) {
    fecha = obtenerFechaActual();
  }

  const [dia, mes, anio] = fecha.split('/');

  try {
    const firestore = getFirestore();
    const pedidoDocRef = doc(firestore, 'pedidos', anio, mes, dia);

    // Ejecutar una transacción para leer los pedidos del día
    const pedidos = await runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);

      if (!pedidoDocSnapshot.exists()) {
        console.error('No se encontró el documento del día en Firestore');
        return [];
      }

      const pedidosDelDia = pedidoDocSnapshot.data()?.pedidos || [];
      const pedidosEncontrados = pedidosDelDia.filter((pedido: PedidoProps) =>
        ids.includes(pedido.id)
      );

      return pedidosEncontrados;
    });

    return pedidos;
  } catch (error) {
    console.error('Error al buscar pedidos en Firestore:', error);
    throw error;
  }
};
