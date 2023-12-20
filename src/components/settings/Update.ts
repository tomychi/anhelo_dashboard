import { doc, updateDoc, getFirestore } from 'firebase/firestore';

// Esta función actualiza los datos en Firestore para un documento específico
export const updateDataInFirestore = async (
  documentId,
  collectionName,
  newData
) => {
  const firestore = getFirestore();

  try {
    // Accede al documento en Firestore
    const docRef = doc(firestore, collectionName, documentId);

    // Actualiza los datos del documento con los nuevos datos proporcionados
    await updateDoc(docRef, newData);

    console.log('Datos actualizados correctamente en Firestore');
  } catch (error) {
    console.error('Error al actualizar datos en Firestore:', error);
  }
};
