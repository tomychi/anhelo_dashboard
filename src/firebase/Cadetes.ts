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
} from "firebase/firestore";
import { obtenerFechaActual, obtenerHoraActual } from "../helpers/dateToday";
import { PedidoProps } from "../types/types";
import { DateValueType } from "react-tailwindcss-datepicker";
import { parseISO, set } from "date-fns";

export interface VueltaInfo {
  horaSalida: string;
  horaLlegada: string | null;
  ordersId: string[];
  fecha: string;
}

export const fetchCadetesNames = async () => {
  const firestore = getFirestore();
  const usersCollectionRef = collection(firestore, "users");

  // Hacer una consulta para obtener solo los usuarios con rol 'cadete'
  const cadetesQuery = query(usersCollectionRef, where("rol", "==", "cadete"));

  try {
    const querySnapshot = await getDocs(cadetesQuery);
    const cadetesNames = querySnapshot.docs.map((doc) => doc.data().name);

    return cadetesNames;
  } catch (error) {
    console.error("Error obteniendo los nombres de los cadetes:", error);
    return [];
  }
};

export const fetchConstants = async () => {
  const firestore = getFirestore();
  const constDocRef = doc(firestore, "constantes", "sueldos");
  const constDoc = await getDoc(constDocRef);

  if (constDoc.exists()) {
    const data = constDoc.data().cadetes;
    return data;
  } else {
    console.error('No se encontró el documento "sueldos"');
  }
};

export const UploadVueltaCadete = async (
  ordersId: string[],
  cadete: string
): Promise<VueltaInfo[]> => {
  const firestore = getFirestore();
  const fechaFormateada = obtenerFechaActual();
  const [dia, mes, anio] = fechaFormateada.split("/");

  if (!cadete) {
    throw new Error("No se ha seleccionado un cadete");
  }

  try {
    // Crear una referencia al documento del cadete
    const cadeteDocRef = doc(
      firestore,
      "cadetes",
      cadete
    ) as DocumentReference<DocumentData>;

    // Crear una subcolección "vueltas" dentro del documento del cadete
    const vueltasCollectionRef = collection(cadeteDocRef, "vueltas");

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
          // console.log('nueva vuelta agregada');
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
      // console.log(vueltas);
      await setDoc(vueltaDocRef, { vueltas }); // Actualizar las vueltas en el documento
      return vueltas;
    } else {
      // Si no existe una vuelta con la hora de salida, crear una nueva vuelta
      await setDoc(vueltaDocRef, { vueltas: [nuevaVuelta] });
    }

    return [nuevaVuelta]; // Devolver la nueva vuelta
  } catch (error) {
    console.error("Error al subir la vuelta:", error);
    throw error;
  }
};

export const fetchCadetesVueltasByPeriod = async (valueDate: DateValueType) => {
  if (!valueDate || !valueDate.startDate) {
    console.error("Fecha inválida proporcionada");
    return [];
  }

  const parseDate = (date: string | Date): Date => {
    if (typeof date === "string") {
      return parseISO(date);
    }
    return date;
  };

  const normalizeDate = (date: Date, isEndDate: boolean = false): Date => {
    const normalizedDate = set(date, {
      hours: isEndDate ? 23 : 0,
      minutes: isEndDate ? 59 : 0,
      seconds: isEndDate ? 59 : 0,
      milliseconds: isEndDate ? 999 : 0,
    });
    return normalizedDate;
  };

  const startDate = normalizeDate(parseDate(valueDate.startDate));
  const endDate = valueDate.endDate
    ? normalizeDate(parseDate(valueDate.endDate), true)
    : normalizeDate(parseDate(valueDate.startDate), true);

  const filterVueltasByPeriod = (
    vueltas: any[],
    startDate: Date,
    endDate: Date
  ) => {
    return vueltas.filter((vuelta) => {
      const startTime = normalizeDate(new Date(vuelta.startTime.toDate()));
      return startTime >= startDate && startTime <= endDate;
    });
  };

  // ... resto del código ...
  const firestore = getFirestore();
  const empleadosRef = collection(firestore, "empleados");
  const cadetesQuery = query(empleadosRef, where("category", "==", "cadete"));

  try {
    const snapshot = await getDocs(cadetesQuery);
    const cadetesData = snapshot.docs.map((doc) => {
      const data = doc.data();
      const vueltasFiltradas = filterVueltasByPeriod(
        data.vueltas || [],
        startDate,
        endDate
      );
      return { ...data, id: doc.id, vueltas: vueltasFiltradas };
    });

    // Filtrar cadetes que tienen vueltas en el período seleccionado
    const cadetesConVueltas = cadetesData.filter(
      (cadete) => cadete.vueltas.length > 0
    );

    return cadetesConVueltas;
  } catch (error) {
    console.error("Error al obtener los cadetes:", error);
    return [];
  }
};

// Función para buscar los pedidos en la base de datos de pedidos
export const buscarPedidos = async (ids: string[], fecha: string) => {
  if (!fecha) {
    fecha = obtenerFechaActual();
  }

  const [dia, mes, anio] = fecha.split("/");

  try {
    const firestore = getFirestore();
    const pedidoDocRef = doc(firestore, "pedidos", anio, mes, dia);

    // Ejecutar una transacción para leer los pedidos del día
    const pedidos = await runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);

      if (!pedidoDocSnapshot.exists()) {
        console.error("No se encontró el documento del día en Firestore");
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
    console.error("Error al buscar pedidos en Firestore:", error);
    throw error;
  }
};
