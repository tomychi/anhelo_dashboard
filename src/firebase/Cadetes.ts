import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';

export const readCadetes = async (): Promise<string[]> => {
  const firestore = getFirestore();
  const collectionRef = collection(firestore, 'cadetes');
  const snapshot = await getDocs(collectionRef);

  // Mapear los nombres de los cadetes desde los documentos de Firestore
  const nombresCadetes = snapshot.docs.map((doc) => {
    const data = doc.data();
    return data.nombre;
  });

  return nombresCadetes;
};

export const addCadete = async (nombre: string): Promise<void> => {
  const firestore = getFirestore();
  const cadetesCollectionRef = collection(firestore, 'cadetes');

  try {
    // Agregar un nuevo documento con el nombre del cadete proporcionado
    await addDoc(cadetesCollectionRef, { nombre });
  } catch (error) {
    throw new Error('Error al agregar el cadete');
  }
};
