import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

export const crearVoucher = async (
  titulo: string,
  fecha: string
): Promise<void> => {
  const firestore = getFirestore();
  const voucherDocRef = doc(firestore, 'vouchers', titulo);

  try {
    await setDoc(voucherDocRef, {
      titulo,
      fecha,
    });

    console.log(`Documento creado exitosamente con el título: ${titulo}`);
  } catch (error) {
    console.error('Error al crear el documento:', error);
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

export const canjearVoucher = async (codigo: string): Promise<boolean> => {
  const firestore = getFirestore();
  const vouchersCollectionRef = collection(firestore, 'vouchers');

  try {
    const success = await runTransaction(firestore, async (transaction) => {
      const querySnapshot = await getDocs(vouchersCollectionRef);
      let voucherEncontrado = false;

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const codigos = data.codigos || [];

        // Encuentra el código en el arreglo de codigos
        const codigoIndex = codigos.findIndex(
          (c: Codigo) => c.codigo === codigo
        );

        if (codigoIndex !== -1) {
          // Si el código ya está marcado como "usado"
          if (codigos[codigoIndex].estado === 'usado') {
            console.error('El voucher ya ha sido canjeado');
            return false;
          }

          // Marca el código como "usado"
          codigos[codigoIndex].estado = 'usado';

          // Actualiza el documento en Firestore
          const voucherDocRef = doc(firestore, 'vouchers', docSnapshot.id);
          transaction.update(voucherDocRef, { codigos });

          voucherEncontrado = true;
          break;
        }
      }

      if (!voucherEncontrado) {
        console.error('No se encontró el voucher con el código proporcionado');
        return false;
      }

      return true;
    });

    return success;
  } catch (error) {
    console.error('Error al canjear el voucher:', error);
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

export interface Codigo {
  codigo: string;
  estado: string;
  num: number;
}

export const generarCodigos = async (cantidad: number): Promise<void> => {
  const firestore = getFirestore();
  const codigosCollectionRef = collection(firestore, 'codigos');

  try {
    for (let i = 0; i < cantidad; i++) {
      const codigo = Math.random().toString(36).substring(2, 7).toUpperCase(); // Genera un código de 5 caracteres
      const nuevoCodigo: Codigo = {
        codigo,
        estado: 'disponible',
        num: i + 1,
      };

      // Almacena el código en Firestore
      await addDoc(codigosCollectionRef, nuevoCodigo);
    }

    console.log(
      `Se han generado y almacenado ${cantidad} códigos correctamente.`
    );
  } catch (error) {
    console.error('Error al generar y almacenar los códigos:', error);
    throw error;
  }
};

export const obtenerCodigosOrdenados = async (): Promise<Codigo[]> => {
  const firestore = getFirestore();
  const codigosCollectionRef = collection(firestore, 'codigos'); // Referencia a la colección 'codigos'

  try {
    const querySnapshot = await getDocs(codigosCollectionRef);
    const codigos: Codigo[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.codigo && data.num) {
        // Asegúrate de que `data.codigo` y `data.num` existan
        codigos.push({
          codigo: data.codigo,
          num: data.num,
          estado: data.estado,
        } as Codigo);
      }
    });

    // Ordenar los códigos por su propiedad 'num'
    codigos.sort((a, b) => a.num - b.num);

    return codigos;
  } catch (error) {
    console.error('Error al obtener los códigos:', error);
    throw error;
  }
};

export const moverCodigosARango = async (
  titulo: string,
  codigosSeleccionados: Codigo[]
) => {
  const db = getFirestore();

  try {
    // Referencia al documento del voucher
    const voucherRef = doc(db, 'vouchers', titulo);

    // Iniciar una transacción para manejar múltiples operaciones
    const batch = writeBatch(db);

    // Obtener el documento del voucher para agregar los códigos
    const voucherDocSnapshot = await getDoc(voucherRef);
    let existingCodigos: Codigo[] = [];

    if (voucherDocSnapshot.exists()) {
      // Si el documento ya existe, obtener los códigos existentes
      const data = voucherDocSnapshot.data();
      existingCodigos = data?.codigos || [];
    }

    // Añadir los códigos seleccionados al documento del voucher
    batch.update(voucherRef, {
      codigos: [...existingCodigos, ...codigosSeleccionados],
    });

    // Eliminar los códigos de la colección de códigos
    for (const codigo of codigosSeleccionados) {
      const codigosSnapshot = await getDocs(collection(db, 'codigos'));
      codigosSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.codigo === codigo.codigo) {
          batch.delete(doc.ref);
        }
      });
    }

    // Ejecutar la transacción
    await batch.commit();

    console.log('Códigos movidos y eliminados correctamente');
  } catch (error) {
    console.error('Error al mover códigos:', error);
  }
};
