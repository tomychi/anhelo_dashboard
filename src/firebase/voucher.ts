import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { obtenerFechaActual } from '../helpers/dateToday';

export const generarVouchers = async (
  cantidad: number,
  titulo: string
): Promise<void> => {
  const firestore = getFirestore();
  const voucherDocRef = doc(firestore, 'vouchers', titulo);

  try {
    // Verifica si el documento ya existe
    const voucherDoc = await getDoc(voucherDocRef);

    if (!voucherDoc.exists()) {
      // Si el documento no existe, crearlo con un array vacío
      await setDoc(voucherDocRef, {
        codigos: [],
        fecha: obtenerFechaActual(),
        canjeados: 0,
        usados: cantidad,
        creados: cantidad,
      });
    }

    const batch = [];
    for (let i = 0; i < cantidad; i++) {
      const codigo = Math.random().toString(36).substring(2, 7).toUpperCase(); // Genera un código de 5 dígitos
      batch.push({
        codigo,
        estado: 'disponible',
        num: i + 1,
      });
    }

    // Ahora se puede hacer la actualización del documento
    await updateDoc(voucherDocRef, {
      codigos: arrayUnion(...batch),
    });

    console.log(
      `Vouchers generados y almacenados correctamente bajo el título: ${titulo}`
    );
  } catch (error) {
    console.error('Error al generar y almacenar los vouchers:', error);
    throw error;
  }
};

export interface VoucherTituloConFecha {
  titulo: string;
  fecha: string;
  canjeados: number;
  usados: number;
  creados: number;
}

export const obtenerTitulosVouchers = async (): Promise<
  VoucherTituloConFecha[]
> => {
  const firestore = getFirestore();
  const vouchersCollectionRef = collection(firestore, 'vouchers');

  try {
    const querySnapshot = await getDocs(vouchersCollectionRef);
    const titulosConFecha: VoucherTituloConFecha[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      titulosConFecha.push({
        titulo: doc.id, // Agrega el ID de cada documento como un título
        fecha: data.fecha || 'Fecha no disponible', // Agrega la fecha, si existe
        canjeados: data.canjeados,
        usados: data.usados,
        creados: data.creados,
      });
    });

    return titulosConFecha;
  } catch (error) {
    console.error('Error al obtener los títulos de vouchers:', error);
    throw error;
  }
};

export const actualizarVouchersUsados = async (
  titulo: string,
  cantidadUsados: number
): Promise<void> => {
  const firestore = getFirestore();
  const voucherDocRef = doc(firestore, 'vouchers', titulo);

  try {
    // Actualiza solo el campo 'usados' en el documento correspondiente
    await updateDoc(voucherDocRef, {
      usados: cantidadUsados,
    });

    console.log(
      `Cantidad de vouchers usados actualizada a ${cantidadUsados} para el título: ${titulo}`
    );
  } catch (error) {
    console.error('Error al actualizar la cantidad de vouchers usados:', error);
    throw error;
  }
};
