import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { ProductoMaterial } from '../types/types';

export const ReadMateriales = async (): Promise<ProductoMaterial[]> => {
  const firestore = getFirestore();

  const collections = ['materiales'];

  const fetchedData = await Promise.all(
    collections.map(async (collectionName) => {
      const collectionRef = collection(firestore, collectionName);
      const snapshot = await getDocs(collectionRef);

      return snapshot.docs.map((doc) => {
        const data = doc.data(); // Datos del documento de Firestore
        // Convertir los datos a un objeto ProductoMaterial
        const productoMaterial: ProductoMaterial = {
          id: doc.id,
          nombre: data.nombre,
          categoria: data.categoria,
          costo: data.costo,
          unit: data.unit,
          unidadPorPrecio: data.unidadPorPrecio,
        };
        return productoMaterial;
      });
    })
  );

  // Hacer un flatten de fetchedData y devolver los datos como un arreglo de ProductoMaterial[]
  return fetchedData.flat();
};

export const updateMaterialCost = async (
  materialId: string,
  newCost: number
): Promise<void> => {
  const firestore = getFirestore();
  const materialRef = doc(firestore, 'materiales', materialId);

  try {
    await updateDoc(materialRef, {
      costo: newCost,
    });
  } catch (error) {
    console.error('Error al actualizar el costo:', error);
    throw error;
  }
};
