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

export interface RegistroProps {
  horaEntrada: string;
  nombreEmpleado: string;
  horaSalida: string;
  marcado: boolean;
}

export interface EmpleadosProps {
  id: string;
  category: string;
  name: string;
  available: boolean;
  correo: string;
  area: string;
  puesto: string;
  depto: string;
  scanned: boolean;
}

export const handleScan = async (employeeId: string): Promise<void> => {
  const firestore = getFirestore();
  const employeeRef = doc(firestore, "empleados", employeeId);
  const employeeDoc = await getDoc(employeeRef);

  if (employeeDoc.exists()) {
    const data = employeeDoc.data();
    await updateDoc(employeeRef, {
      scanned: !data.scanned,
    });
  }
};

export const marcarEntrada = async (nombreEmpleado: string): Promise<void> => {
  const firestore = getFirestore();
  const fechaFormateada = obtenerFechaActual();
  const [dia, mes, anio] = fechaFormateada.split("/");
  const horaActual = new Date().toLocaleTimeString("en-US", { hour12: false });
  try {
    const registroDocRef = doc(
      collection(firestore, "registros", anio, mes),
      dia
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
    // console.log(
    //   "Entrada registrada exitosamente para el día:",
    //   fechaFormateada,
    // );
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
      dia
    );
    const docSnapshot = await getDoc(registroDocRef);
    if (docSnapshot.exists()) {
      const registroData = docSnapshot.data();
      const empleados = registroData.empleados || [];
      const empleadoIndex = empleados.findIndex(
        (empleado: RegistroProps) => empleado.nombreEmpleado === nombreEmpleado
      );

      if (empleadoIndex !== -1 && !empleados[empleadoIndex].horaSalida) {
        empleados[empleadoIndex].marcado = false; // Actualizamos la propiedad marcado dentro del empleado
        empleados[empleadoIndex].horaSalida = horaActual;
        await updateDoc(registroDocRef, { empleados }); // Aquí actualizamos marcado a false
        // console.log("Salida registrada exitosamente.");
      } else {
        // console.log(
        //   "No se encontró registro de entrada para el empleado en la fecha actual o ya se registró la salida.",
        // );
      }
    } else {
      // console.log("No hay registros para el día de hoy");
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
      dia
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

export interface VueltasProps {
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
  correo: string;
  area: string;
  puesto: string;
  depto: string;
}

export const readEmpleados = async (): Promise<EmpleadosProps[]> => {
  const firestore = getFirestore();
  const collectionRef = collection(firestore, "empleados");
  const snapshot = await getDocs(collectionRef);

  const empleados = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    scanned: doc.data().scanned || false,
  })) as EmpleadosProps[];

  return empleados;
};

export const listenToEmpleadosChanges = (
  callback: (empleados: EmpleadosProps[]) => void
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
          depto: data.depto || "",
          area: data.area || "",
          puesto: data.puesto || "",
          correo: data.correo || "",
        };
      });
      callback(empleadosData);
    },
    (error) => {
      console.error("Error al escuchar cambios en empleados:", error);
    }
  );
};

export const handleQRScan = async (
  currentUserEmail: string | null | undefined
): Promise<void> => {
  try {
    if (!currentUserEmail) {
      throw new Error("Usuario no autenticado");
    }

    const firestore = getFirestore();
    const empleadosRef = collection(firestore, "empleados");
    const q = query(empleadosRef, where("correo", "==", currentUserEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Empleado no encontrado");
    }

    const employeeDoc = querySnapshot.docs[0];
    const employeeData = employeeDoc.data();
    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour12: false,
    });

    if (employeeData.isWorking) {
      await updateDoc(employeeDoc.ref, {
        isWorking: false,
        endTime: currentTime,
      });
      await marcarSalida(employeeData.name);
    } else {
      await updateDoc(employeeDoc.ref, {
        isWorking: true,
        startTime: currentTime,
        endTime: null,
      });
      await marcarEntrada(employeeData.name);
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
