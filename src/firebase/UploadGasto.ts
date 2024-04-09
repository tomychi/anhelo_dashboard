import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  DocumentReference,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export interface ExpenseProps {
  description: string;
  total: number;
  category: string;
  fecha: string;
  name: string;
  quantity: number;
  unit: string;
  id: string;
}

export const UploadExpense = (
  expenseDetail: ExpenseProps
): Promise<DocumentReference> => {
  const firestore = getFirestore();

  // Generar un ID único para el gasto
  const gastoId = uuidv4();

  // Separar la fecha en día, mes y año
  const [dia, mes, anio] = expenseDetail.fecha.split('/');

  // Crear la referencia a la colección con tres segmentos: gastos/año/mes
  const gastosCollectionRef = collection(firestore, 'gastos', anio, mes);

  // Crear la referencia a un documento con el ID igual al día
  const gastoDocRef = doc(gastosCollectionRef, dia);

  // Retorna una promesa
  return new Promise((resolve, reject) => {
    // Obtener los datos actuales del documento
    getDoc(gastoDocRef)
      .then((docSnap) => {
        const existingData = docSnap.exists() ? docSnap.data() : {};

        // Obtener o inicializar el arreglo de gastos para el día
        const gastosDelDia = existingData.gastos || [];

        // Agregar el nuevo gasto al arreglo
        gastosDelDia.push({ ...expenseDetail, id: gastoId });

        // Actualizar los datos del documento con el nuevo arreglo de gastos
        setDoc(gastoDocRef, {
          ...existingData,
          gastos: gastosDelDia,
        }).then(() => {
          resolve(gastoDocRef); // Resuelve la promesa con la referencia al documento
        });
      })
      .catch((error) => {
        reject(error); // Rechaza la promesa con el error
      });
  });
};
