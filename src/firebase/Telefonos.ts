import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from 'firebase/firestore';
import { cleanPhoneNumber } from '../helpers/orderByweeks';

export const addTelefonoFirebase = async (
  phoneNumber: string,
  fecha: string
) => {
  const cleanPhone = cleanPhoneNumber(phoneNumber);
  // Verifica si el número de teléfono ya existe en la base de datos
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
      });
      console.log(
        `Se agregó el número de teléfono ${cleanPhone} a Firebase con el ID: ${docRef.id}. Fecha: ${fecha}`
      );
    } catch (e) {
      console.error('Error al agregar el número de teléfono a Firebase:', e);
    }
  } else {
    // El número de teléfono ya existe en la base de datos
    console.log(
      `El número de teléfono ${cleanPhone} ya existe en la base de datos.`
    );
  }
};
