import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { cleanPhoneNumber } from '../helpers/orderByweeks';

export const addTelefonoFirebase = async (
  phoneNumber: string,
  fecha: string
) => {
  const cleanPhone = cleanPhoneNumber(phoneNumber);
  const firestore = getFirestore();
  const collectionRef = collection(firestore, 'telefonos');
  const q = query(collectionRef, where('telefono', '==', cleanPhone));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    // El número de teléfono no existe en la base de datos, entonces lo agregamos
    try {
      const docRef = await addDoc(collectionRef, {
        telefono: cleanPhone,
        fecha: fecha,
        lastOrder: fecha, // Nueva fecha como último pedido al agregar
      });
      console.log(
        `Se agregó el número de teléfono ${cleanPhone} a Firebase con el ID: ${docRef.id}. Fecha: ${fecha}`
      );
    } catch (e) {
      console.error('Error al agregar el número de teléfono a Firebase:', e);
    }
  } else {
    // El número de teléfono ya existe en la base de datos, actualizamos el campo lastOrder
    querySnapshot.forEach(async (documento) => {
      try {
        const docRef = doc(firestore, 'telefonos', documento.id);
        await updateDoc(docRef, {
          lastOrder: fecha, // Actualiza con la nueva fecha del último pedido
        });
        console.log(
          `El número de teléfono ${cleanPhone} ya existe en la base de datos. Actualizado lastOrder a: ${fecha}`
        );
      } catch (e) {
        console.error('Error al actualizar el campo lastOrder en Firebase:', e);
      }
    });
  }
};
