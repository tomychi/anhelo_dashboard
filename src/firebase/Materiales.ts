import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
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
          stock: data.stock,
        };
        return productoMaterial;
      });
    })
  );

  // Hacer un flatten de fetchedData y devolver los datos como un arreglo de ProductoMaterial[]
  return fetchedData.flat();
};

export const updateMaterialStockManual = async (
  materialId: string,
  newValue: number
): Promise<void> => {
  const firestore = getFirestore();
  const materialRef = doc(firestore, 'materiales', materialId);

  try {
    // Update material document
    await updateDoc(materialRef, {
      stock: newValue,
    });
  } catch (error) {
    console.error('Error updating material stock:', error);
    throw error; // Si deseas manejar el error en el componente que llama a esta función
  }
};

export const updateMaterialCost = async (
  materialId: string,
  newCost: number,
  cant: number
): Promise<void> => {
  const firestore = getFirestore();
  const materialRef = doc(firestore, 'materiales', materialId);

  try {
    // Get current material data
    const materialSnap = await getDoc(materialRef);
    if (materialSnap.exists()) {
      const materialData = materialSnap.data();

      // Calculate new stock value
      const currentStock = materialData.stock || 0; // Default to 0 if stock doesn't exist
      const newStock = currentStock + cant;

      // Update material document
      await updateDoc(materialRef, {
        costo: newCost,
        stock: newStock,
      });
    } else {
      console.error('Material document does not exist');
    }
  } catch (error) {
    console.error('Error updating material cost:', error);
  }
};

export const updateMaterialStock = async (
  materialId: string,
  quantityUsed: number,
  unit: string
): Promise<void> => {
  const firestore = getFirestore();
  const materialRef = doc(firestore, 'materiales', materialId);

  try {
    // Obtener los datos actuales del material
    const materialSnap = await getDoc(materialRef);
    if (materialSnap.exists()) {
      const materialData = materialSnap.data();

      // Verificar si la unidad es 'kg' y convertir la cantidad utilizada a gramos si es necesario
      if (unit === 'kg') {
        quantityUsed *= 1000; // Convertir kg a gramos
      }

      // Calcular la nueva cantidad ajustada restando la cantidad utilizada del stock actual
      const currentStock = materialData.stock || 0;
      const newStock = currentStock - quantityUsed;

      // Actualizar el documento del material con la nueva cantidad ajustada
      await updateDoc(materialRef, {
        stock: newStock,
      });
    } else {
      console.error('El documento del material no existe');
    }
  } catch (error) {
    console.error('Error al actualizar la cantidad del material:', error);
  }
};
