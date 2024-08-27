import {
  collection,
  doc,
  getDoc,
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
  const fechaFormateada = obtenerFechaActual(); // Asumiendo que tienes esta función para formatear la fecha
  const [, mes, anio] = fechaFormateada.split('/');
  const vouchersCollectionRef = collection(firestore, 'vouchers', anio, mes);
  const voucherDocRef = doc(vouchersCollectionRef, titulo);

  const vouchers = [];

  for (let i = 0; i < cantidad; i++) {
    const codigo = Math.random().toString(36).substring(2, 7).toUpperCase(); // Genera un código de 5 dígitos
    vouchers.push({
      codigo,
      estado: 'disponible',
    });
  }

  try {
    await setDoc(voucherDocRef, {
      titulo,
      fecha: fechaFormateada,
      vouchers,
    });
    console.log('Vouchers generados y almacenados correctamente');
  } catch (error) {
    console.error('Error al generar y almacenar vouchers:', error);
    throw error;
  }
};

interface Voucher {
  codigo: string;
  estado: 'disponible' | 'usado';
}

export const canjearVoucher = async (
  titulo: string,
  codigo: string
): Promise<boolean> => {
  const firestore = getFirestore();
  const fechaFormateada = obtenerFechaActual(); // Asumiendo que tienes esta función para formatear la fecha
  const [, mes, anio] = fechaFormateada.split('/');
  const voucherDocRef = doc(firestore, 'vouchers', anio, mes, titulo);

  try {
    const success = await runTransaction(firestore, async (transaction) => {
      const docSnapshot = await transaction.get(voucherDocRef);

      if (!docSnapshot.exists()) {
        console.error('No se encontró el documento de vouchers');
        return false;
      }

      const data = docSnapshot.data();
      const vouchers = data?.vouchers || [];

      const voucher = vouchers.find((v: Voucher) => v.codigo === codigo);

      if (!voucher || voucher.estado === 'usado') {
        console.error(
          'El código del voucher no es válido o ya ha sido canjeado'
        );
        return false;
      }

      // Actualiza el estado del voucher a "usado"
      voucher.estado = 'usado';

      transaction.update(voucherDocRef, { vouchers });
      return true;
    });

    return success;
  } catch (error) {
    console.error('Error al canjear el voucher:', error);
    throw error;
  }
};

export const obtenerVouchers = async (titulo: string): Promise<Voucher[]> => {
  const firestore = getFirestore();
  const fechaFormateada = obtenerFechaActual(); // Utiliza tu función para formatear la fecha
  const [, mes, anio] = fechaFormateada.split('/');
  const voucherDocRef = doc(firestore, 'vouchers', anio, mes, titulo);

  try {
    const voucherDoc = await getDoc(voucherDocRef);
    if (voucherDoc.exists()) {
      const data = voucherDoc.data();
      return data.vouchers || [];
    } else {
      console.error('No se encontraron vouchers con ese título.');
      return [];
    }
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
