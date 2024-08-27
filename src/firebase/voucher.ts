import {
  collection,
  doc,
  getDocs,
  getFirestore,
  runTransaction,
  setDoc,
} from 'firebase/firestore';
import { obtenerFechaActual } from '../helpers/dateToday';

export const generarVouchers = async (
  cantidad: number,
  titulo: string
): Promise<void> => {
  const firestore = getFirestore();

  for (let i = 0; i < cantidad; i++) {
    const codigo = Math.random().toString(36).substring(2, 7).toUpperCase(); // Genera un código de 5 dígitos
    const voucherDocRef = doc(firestore, 'vouchers', codigo);

    try {
      await setDoc(voucherDocRef, {
        codigo,
        titulo,
        estado: 'disponible',
        fecha: obtenerFechaActual(),
      });
      console.log(`Voucher ${codigo} generado y almacenado correctamente`);
    } catch (error) {
      console.error('Error al generar y almacenar el voucher:', error);
      throw error;
    }
  }
};

export interface Voucher {
  codigo: string;
  estado: 'disponible' | 'usado';
  titulo: string; // Asegúrate de que este campo esté presente
}

export const canjearVoucher = async (codigo: string): Promise<boolean> => {
  const firestore = getFirestore();
  const voucherDocRef = doc(firestore, 'vouchers', codigo);

  try {
    const success = await runTransaction(firestore, async (transaction) => {
      const docSnapshot = await transaction.get(voucherDocRef);

      if (!docSnapshot.exists()) {
        console.error('No se encontró el voucher con el código proporcionado');
        return false;
      }

      const data = docSnapshot.data();

      if (data?.estado === 'usado') {
        console.error('El voucher ya ha sido canjeado');
        return false;
      }

      // Actualiza el estado del voucher a "usado"
      transaction.update(voucherDocRef, { estado: 'usado' });
      return true;
    });

    return success;
  } catch (error) {
    console.error('Error al canjear el voucher:', error);
    throw error;
  }
};

export const obtenerTodosLosVouchers = async (): Promise<Voucher[]> => {
  const firestore = getFirestore();
  const vouchersCollectionRef = collection(firestore, 'vouchers');

  try {
    const querySnapshot = await getDocs(vouchersCollectionRef);
    const vouchers: Voucher[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Voucher;
      // Asegúrate de que los datos contengan todos los campos requeridos
      vouchers.push(data);
    });
    return vouchers;
  } catch (error) {
    console.error('Error al obtener los vouchers:', error);
    throw error;
  }
};
export const obtenerTitulosVouchers = async (): Promise<string[]> => {
  const firestore = getFirestore();
  const fechaFormateada = obtenerFechaActual(); // Utiliza tu función para formatear la fecha
  const [, mes, anio] = fechaFormateada.split('/');
  const vouchersCollectionRef = collection(firestore, 'vouchers', anio, mes);

  try {
    const querySnapshot = await getDocs(vouchersCollectionRef);
    const titulos: string[] = [];
    querySnapshot.forEach((doc) => {
      titulos.push(doc.id);
    });
    return titulos;
  } catch (error) {
    console.error('Error al obtener los títulos de vouchers:', error);
    throw error;
  }
};
