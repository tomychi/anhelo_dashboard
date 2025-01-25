import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  DocumentReference,
  updateDoc,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { CategoriaType, UnidadType } from '../constants/expenses';



export interface ExpenseProps {
  description: string;
  total: number;
  category: CategoriaType;
  fecha: string;
  name: string;
  quantity: number;
  unit: UnidadType;
  id: string;
  estado: string;
}

export const UploadExpense = async (
  expenseDetail: ExpenseProps,
  fechaInicio?: string,
  fechaFin?: string
): Promise<DocumentReference[]> => {
  const firestore = getFirestore();

  if (fechaInicio && fechaFin) {
    console.log('Input fechas:', { fechaInicio, fechaFin });

    const startDate = new Date(fechaInicio + 'T00:00:00');
    const endDate = new Date(fechaFin + 'T23:59:59');

    console.log('Dates before loop:', {
      startDate: startDate.toLocaleString(),
      endDate: endDate.toLocaleString()
    });

    const documentRefs: DocumentReference[] = [];

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dia = date.getDate().toString().padStart(2, '0');
      const mes = (date.getMonth() + 1).toString().padStart(2, '0');
      const anio = date.getFullYear().toString();

      const formattedDate = `${dia}/${mes}/${anio}`;
      console.log('Processing date:', {
        currentDate: date.toLocaleString(),
        formattedDate,
        dia,
        mes,
        anio
      });

      const gastoId = uuidv4();
      const gastosCollectionRef = collection(firestore, 'gastos', anio, mes);
      const gastoDocRef = doc(gastosCollectionRef, dia);

      console.log('Firebase save:', {
        path: `gastos/${anio}/${mes}/${dia}`,
        expense: {
          ...expenseDetail,
          id: gastoId,
          fecha: formattedDate
        }
      });

      const docSnap = await getDoc(gastoDocRef);
      const existingData = docSnap.exists() ? docSnap.data() : {};
      const gastosDelDia = existingData.gastos || [];

      gastosDelDia.push({
        ...expenseDetail,
        id: gastoId,
        fecha: formattedDate
      });

      await setDoc(gastoDocRef, {
        ...existingData,
        gastos: gastosDelDia,
      });

      documentRefs.push(gastoDocRef);
    }

    return documentRefs;
  } else {
    const gastoId = uuidv4();
    const [dia, mes, anio] = expenseDetail.fecha.split('/');
    const gastosCollectionRef = collection(firestore, 'gastos', anio, mes);
    const gastoDocRef = doc(gastosCollectionRef, dia);

    const docSnap = await getDoc(gastoDocRef);
    const existingData = docSnap.exists() ? docSnap.data() : {};
    const gastosDelDia = existingData.gastos || [];

    gastosDelDia.push({ ...expenseDetail, id: gastoId });

    await setDoc(gastoDocRef, {
      ...existingData,
      gastos: gastosDelDia,
    });

    return [gastoDocRef];
  }
};

// Función para actualizar el estado del gasto
export const UpdateExpenseStatus = (
  expenseId: string,
  newStatus: 'pendiente' | 'pagado',
  fecha: string
): Promise<void> => {
  const firestore = getFirestore();

  // Separar la fecha en día, mes y año
  const [dia, mes, anio] = fecha.split('/');

  // Crear la referencia a la colección con tres segmentos: gastos/año/mes
  const gastosCollectionRef = doc(firestore, 'gastos', anio, mes, dia);

  // Retorna una promesa
  return new Promise((resolve, reject) => {
    // Obtener los datos actuales del documento
    getDoc(gastosCollectionRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const existingData = docSnap.data();
          const gastosDelDia = existingData.gastos || [];

          // Buscar el gasto a actualizar
          const gastoIndex = gastosDelDia.findIndex(
            (gasto: ExpenseProps) => gasto.id === expenseId
          );

          if (gastoIndex !== -1) {
            // Actualizar el estado del gasto
            gastosDelDia[gastoIndex] = {
              ...gastosDelDia[gastoIndex],
              estado: newStatus,
            };

            // Guardar los cambios en el documento
            updateDoc(gastosCollectionRef, {
              gastos: gastosDelDia,
            })
              .then(() => {
                resolve(); // Resuelve la promesa sin datos, solo éxito
              })
              .catch((error) => {
                reject(error); // Rechaza la promesa con el error
              });
          } else {
            reject(new Error('Gasto no encontrado')); // Rechaza la promesa si el gasto no se encuentra
          }
        } else {
          reject(new Error('Documento no encontrado')); // Rechaza la promesa si el documento no existe
        }
      })
      .catch((error) => {
        reject(error); // Rechaza la promesa con el error
      });
  });
};
