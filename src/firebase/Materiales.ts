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
  materialName: string,
  newCost: number,
  cant: number
): Promise<void> => {
  const firestore = getFirestore();
  const materialesRef = collection(firestore, 'materiales');
  
  try {
    console.log('Buscando material:', materialName);
    console.log('Nuevo costo:', newCost);
    console.log('Cantidad:', cant);

    // Primero, obtener todos los materiales para verificar
    const materialesSnapshot = await getDocs(materialesRef);
    const materiales = materialesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Buscar el material por nombre (case insensitive)
    const material = materiales.find(
      m => m.nombre.toLowerCase() === materialName.toLowerCase()
    );

    if (material) {
      console.log('Material encontrado:', material);
      
      // Calcular nuevo stock
      const currentStock = material.stock || 0;
      const newStock = currentStock + cant;
      
      console.log('Stock actual:', currentStock);
      console.log('Nuevo stock:', newStock);

      // Actualizar el documento
      await updateDoc(doc(firestore, 'materiales', material.id), {
        costo: newCost,
        stock: newStock,
      });

      console.log('Material actualizado exitosamente');
    } else {
      console.error('Material no encontrado. Materiales disponibles:', materiales.map(m => m.nombre));
      throw new Error(`Material no encontrado: ${materialName}`);
    }
  } catch (error) {
    console.error('Error actualizando el costo del material:', error);
    throw error;
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
