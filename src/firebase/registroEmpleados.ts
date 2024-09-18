import "firebase/firestore";
import {
  getFirestore,
  collection,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  getDocs,
} from "firebase/firestore";
import { Unsubscribe } from "firebase/auth";
import { obtenerFechaActual } from "../helpers/dateToday";

// Define y exporta la interfaz RegistroProps
export interface RegistroProps {
  horaEntrada: string;
  nombreEmpleado: string;
  horaSalida: string;
  marcado: boolean;
}

export const marcarEntrada = async (nombreEmpleado: string): Promise<void> => {
  const firestore = getFirestore();
  const fechaFormateada = obtenerFechaActual();
  const [dia, mes, anio] = fechaFormateada.split("/");
  const horaActual = new Date().toLocaleTimeString("en-US", { hour12: false });
  try {
    const registroDocRef = doc(
      collection(firestore, "registros", anio, mes),
      dia,
    );
    const docSnapshot = await getDoc(registroDocRef);
    const registroData = docSnapshot.exists() ? docSnapshot.data() : {};
    if (!docSnapshot.exists()) {
      await setDoc(registroDocRef, {
        fecha: serverTimestamp(),
        empleados: [{ nombreEmpleado, horaEntrada: horaActual, marcado: true }],
      });
    } else {
      const updatedEmpleados = [
        ...(registroData.empleados || []),
        { nombreEmpleado, horaEntrada: horaActual, marcado: true },
      ];
      await updateDoc(registroDocRef, { empleados: updatedEmpleados });
    }
    console.log(
      "Entrada registrada exitosamente para el día:",
      fechaFormateada,
    );
  } catch (error) {
    console.error("Error al registrar la entrada:", error);
    throw error;
  }
};
export const marcarSalida = async (nombreEmpleado: string): Promise<void> => {
  const firestore = getFirestore();
  const horaActual = new Date().toLocaleTimeString("en-US", { hour12: false });
  const fechaActual = obtenerFechaActual();
  const [dia, mes, anio] = fechaActual.split("/");
  try {
    const registroDocRef = doc(
      collection(firestore, "registros", anio, mes),
      dia,
    );
    const docSnapshot = await getDoc(registroDocRef);
    if (docSnapshot.exists()) {
      const registroData = docSnapshot.data();
      const empleados = registroData.empleados || [];
      const empleadoIndex = empleados.findIndex(
        (empleado: RegistroProps) => empleado.nombreEmpleado === nombreEmpleado,
      );

      if (empleadoIndex !== -1 && !empleados[empleadoIndex].horaSalida) {
        empleados[empleadoIndex].marcado = false; // Actualizamos la propiedad marcado dentro del empleado
        empleados[empleadoIndex].horaSalida = horaActual;
        await updateDoc(registroDocRef, { empleados }); // Aquí actualizamos marcado a false
        console.log("Salida registrada exitosamente.");
      } else {
        console.log(
          "No se encontró registro de entrada para el empleado en la fecha actual o ya se registró la salida.",
        );
      }
    } else {
      console.log("No hay registros para el día de hoy");
    }
  } catch (error) {
    console.error("Error al registrar la salida:", error);
    throw error;
  }
};
export const obtenerRegistroActual = async (): Promise<RegistroProps[]> => {
  const firestore = getFirestore();
  const fechaActual = obtenerFechaActual();
  const [dia, mes, anio] = fechaActual.split("/");
  try {
    const registroDocRef = doc(
      collection(firestore, "registros", anio, mes),
      dia,
    );
    const docSnapshot = await getDoc(registroDocRef);
    if (docSnapshot.exists()) {
      const registroData = docSnapshot.data();
      return registroData.empleados || [];
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error al obtener el registro actual:", error);
    throw error;
  }
};

interface VueltasProps {
  orders: [];
  rideId: string;
  startTime: string;
  endTime: string;
  status: string;
  totalDistance: number;
  totalDuration: number;
  kmPorHora: string;
}
export interface EmpleadosProps {
  id: string;
  category: string;
  name: string;
  vueltas: VueltasProps[];
  available: boolean;
}

export const readEmpleados = async (): Promise<EmpleadosProps[]> => {
  const firestore = getFirestore();
  const collectionRef = collection(firestore, "empleados");
  const snapshot = await getDocs(collectionRef);

  // Mapear los nombres de los empleados desde los documentos de Firestore
  const empleados = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      name: data.name,
      id: data.id,
      category: data.category,
      vueltas: data.vueltas || [],
      available: data.available || false,
    };
  });
  return empleados;
};
export const listenToEmpleadosChanges = (
  callback: (empleados: EmpleadosProps[]) => void,
): Unsubscribe => {
  const firestore = getFirestore();
  const empleadosCollectionRef = collection(firestore, "empleados");
  return onSnapshot(
    empleadosCollectionRef,
    (snapshot) => {
      const empleadosData: EmpleadosProps[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          name: data.name,
          id: data.id,
          category: data.category,
          vueltas: data.vueltas || [],
          available: data.available || false,
        };
      });
      callback(empleadosData);
    },
    (error) => {
      console.error("Error al escuchar cambios en empleados:", error);
    },
  );
};
