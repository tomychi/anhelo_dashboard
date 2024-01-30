import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { obtenerFechaActual } from '../helpers/dateToday';

export interface ExpenseProps {
  descripcion: string;
  total: number;
  categoria: string;
  fecha: string;
  nombre: string;
  cantidad: number;
  unidad: string;
}

export const UploadExpense = async (gasto: ExpenseProps) => {
  const firestore = getFirestore();

  // Obtener la fecha formateada
  const fechaFormateada = obtenerFechaActual();

  // Separar la fecha en día, mes y año
  const [dia, mes, anio] = fechaFormateada.split('/');

  // Crear la referencia a la colección con tres segmentos: gastos/año/mes
  const gastosCollectionRef = collection(firestore, 'gastos', anio, mes);

  // Crear la referencia a un documento con el ID igual al día
  const gastoDocRef = doc(gastosCollectionRef, dia);

  try {
    // Obtener los datos actuales del documento
    const docSnap = await getDoc(gastoDocRef);
    const existingData = docSnap.exists() ? docSnap.data() : {};

    // Obtener o inicializar el arreglo de gastos para el día
    const gastosDelDia = existingData.gastos || [];

    // Agregar el nuevo gasto al arreglo
    gastosDelDia.push(gasto);

    // Actualizar los datos del documento con el nuevo arreglo de gastos
    await setDoc(gastoDocRef, {
      ...existingData,
      gastos: gastosDelDia,
    });

    console.log('Gasto agregado para el día:', dia);
    // Lógica adicional después de agregar el documento
  } catch (error) {
    console.error('Error al agregar gasto para el día:', dia, error);
  }
};
