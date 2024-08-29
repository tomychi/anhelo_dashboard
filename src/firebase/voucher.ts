import {
  arrayRemove,
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
  titulo: string,
  tituloOrigen?: string,
  cantidadTransferir?: number
): Promise<void> => {
  const firestore = getFirestore();
  const voucherDocRef = doc(firestore, 'vouchers', titulo);

  try {
    if (tituloOrigen && cantidadTransferir) {
      // Transferir códigos de un documento origen a un nuevo documento
      const voucherDocOrigenRef = doc(firestore, 'vouchers', tituloOrigen);
      const voucherDocOrigen = await getDoc(voucherDocOrigenRef);

      if (voucherDocOrigen.exists()) {
        const dataOrigen = voucherDocOrigen.data();
        const codigosOrigen = dataOrigen.codigos || [];

        // Tomar los últimos `cantidadTransferir` códigos
        const codigosTransferir = codigosOrigen.slice(-cantidadTransferir);

        // Remover los códigos transferidos del documento origen
        await updateDoc(voucherDocOrigenRef, {
          codigos: arrayRemove(...codigosTransferir),
          usados: (dataOrigen.usados || 0) + cantidadTransferir,
          creados: dataOrigen.creados,
        });

        // Preparar los códigos para el nuevo documento
        const batch = codigosTransferir.map(
          (codigo: string[], index: number) => ({
            ...codigo,
            num: index + 1,
          })
        );
        // Generar códigos adicionales si es necesario
        const cantidadFaltante = cantidad - batch.length;
        for (let i = 0; i < cantidadFaltante; i++) {
          const codigo = Math.random()
            .toString(36)
            .substring(2, 7)
            .toUpperCase(); // Genera un código de 5 dígitos
          batch.push({
            codigo,
            estado: 'disponible',
            num: batch.length + 1,
          });
        }

        // Verificar si el nuevo documento ya existe
        const voucherDoc = await getDoc(voucherDocRef);
        if (!voucherDoc.exists()) {
          // Si no existe, crear el nuevo documento con los códigos
          await setDoc(voucherDocRef, {
            codigos: batch,
            fecha: obtenerFechaActual(),
            canjeados: 0,
            usados: cantidad,
            creados: cantidad,
          });
        } else {
          // Si existe, actualizar el documento con los nuevos códigos
          await updateDoc(voucherDocRef, {
            codigos: arrayUnion(...batch),
          });
        }

        console.log(
          `Vouchers generados y almacenados correctamente bajo el título: ${titulo}`
        );
      } else {
        console.log(
          `El documento con el título origen ${tituloOrigen} no existe.`
        );
      }
    } else {
      // Si no hay título de origen, solo se genera un nuevo documento
      const batch = [];
      for (let i = 0; i < cantidad; i++) {
        const codigo = Math.random().toString(36).substring(2, 7).toUpperCase(); // Genera un código de 5 dígitos
        batch.push({
          codigo,
          estado: 'disponible',
          num: i + 1,
        });
      }

      // Verificar si el nuevo documento ya existe
      const voucherDoc = await getDoc(voucherDocRef);
      if (!voucherDoc.exists()) {
        // Si no existe, crear el nuevo documento con los códigos
        await setDoc(voucherDocRef, {
          codigos: batch,
          fecha: obtenerFechaActual(),
          canjeados: 0,
          usados: cantidad,
          creados: cantidad,
        });
      } else {
        // Si existe, actualizar el documento con los nuevos códigos
        await updateDoc(voucherDocRef, {
          codigos: arrayUnion(...batch),
        });
      }

      console.log(
        `Vouchers generados y almacenados correctamente bajo el título: ${titulo}`
      );
    }
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

export const obtenerCodigosCampana = async (
  titulo: string
): Promise<Array<{ codigo: string; num: number }>> => {
  const firestore = getFirestore();
  const voucherDocRef = doc(firestore, 'vouchers', titulo);

  try {
    const voucherDoc = await getDoc(voucherDocRef);
    if (voucherDoc.exists()) {
      const data = voucherDoc.data();
      return data.codigos || [];
    } else {
      console.log('No se encontró el documento para la campaña:', titulo);
      return [];
    }
  } catch (error) {
    console.error('Error al obtener los códigos de la campaña:', error);
    throw error;
  }
};

export const subirCodigosExistentes = async (
  codigos: string[]
): Promise<void> => {
  const firestore = getFirestore();
  const titulo = 'baco'; // El título del documento
  const voucherDocRef = doc(firestore, 'vouchers', titulo);

  const usados = ['EA2E9', 'HO77E', '69198', '19XUO'];

  try {
    // Preparar los códigos para el documento
    const batch = codigos.map((codigo, index) => ({
      codigo,
      estado: usados.includes(codigo) ? 'usado' : 'disponible',
      num: index + 1,
    }));

    // Verificar si el documento ya existe
    const voucherDoc = await getDoc(voucherDocRef);
    if (!voucherDoc.exists()) {
      // Si no existe, crear el nuevo documento con los códigos
      await setDoc(voucherDocRef, {
        codigos: batch,
        fecha: '24/08/2024',
        canjeados: 0,
        usados: 0,
        creados: codigos.length,
      });
    } else {
      // Si existe, actualizar el documento con los nuevos códigos
      await updateDoc(voucherDocRef, {
        codigos: arrayUnion(...batch),
        creados: (voucherDoc.data().creados || 0) + codigos.length,
      });
    }

    console.log(`Códigos subidos correctamente bajo el título: ${titulo}`);
  } catch (error) {
    console.error('Error al subir los códigos:', error);
    throw error;
  }
};
