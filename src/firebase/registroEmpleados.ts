import 'firebase/firestore';
import {
  getFirestore,
  collection,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  getDocs,
} from 'firebase/firestore';
import { obtenerFechaActual } from '../helpers/dateToday';
import { RegistroProps } from '../pages/Empleados';

export const marcarEntrada = async (nombreEmpleado: string): Promise<void> => {
  const firestore = getFirestore();
  const fechaFormateada = obtenerFechaActual();
  const [dia, mes, anio] = fechaFormateada.split('/');
  const horaActual = new Date().toLocaleTimeString('en-US', { hour12: false });

  try {
    const registroDocRef = doc(
      collection(firestore, 'registros', anio, mes),
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

    console.log(
      'Entrada registrada exitosamente para el día:',
      fechaFormateada
    );
  } catch (error) {
    console.error('Error al registrar la entrada:', error);
    throw error;
  }
};
export const marcarSalida = async (nombreEmpleado: string): Promise<void> => {
  const firestore = getFirestore();
  const horaActual = new Date().toLocaleTimeString('en-US', { hour12: false });
  const fechaActual = obtenerFechaActual();
  const [dia, mes, anio] = fechaActual.split('/');

  try {
    const registroDocRef = doc(
      collection(firestore, 'registros', anio, mes),
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
        console.log('Salida registrada exitosamente.');
      } else {
        console.log(
          'No se encontró registro de entrada para el empleado en la fecha actual o ya se registró la salida.'
        );
      }
    } else {
      console.log('No hay registros para el día de hoy');
    }
  } catch (error) {
    console.error('Error al registrar la salida:', error);
    throw error;
  }
};

export const obtenerRegistroActual = async (): Promise<RegistroProps[]> => {
  const firestore = getFirestore();
  const fechaActual = obtenerFechaActual();
  const [dia, mes, anio] = fechaActual.split('/');

  try {
    const registroDocRef = doc(
      collection(firestore, 'registros', anio, mes),
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
    console.error('Error al obtener el registro actual:', error);
    throw error;
  }
};

export interface EmpleadosProps {
  category: string;
  name: string;
}

export const readEmpleados = async (): Promise<EmpleadosProps[]> => {
  const firestore = getFirestore();
  const collectionRef = collection(firestore, 'empleados');
  const snapshot = await getDocs(collectionRef);

  // Mapear los nombres de los cadetes desde los documentos de Firestore
  const empleados = snapshot.docs.map((doc) => {
    const data = doc.data();
    return { name: data.name, category: data.category };
  });

  return empleados;
};
