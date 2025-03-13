import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  DocumentData,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export interface SimpleMaterialProps {
  nombre: string;
  costo: number;
  unit: string;
}

export interface MaterialProps extends SimpleMaterialProps {
  categoria?: string;
  stock?: number;
  unidadPorPrecio?: number;
  id?: string;
}

/**
 * Crea un nuevo material en la base de datos
 * @param materialData Datos del material a crear
 * @param isAnhelo Indicador si es la empresa ANHELO o no
 * @param empresaId ID de la empresa (necesario para empresas que no son ANHELO)
 * @returns Una promesa que se resuelve cuando el material ha sido creado
 */
export const CreateMaterial = async (
  materialData: SimpleMaterialProps,
  isAnhelo: boolean,
  empresaId?: string
) => {
  const firestore = getFirestore();
  const materialId = uuidv4();

  // Determinar la ruta según la empresa
  let materialRef;

  if (isAnhelo) {
    // Ruta original para ANHELO (colección raíz 'materiales')
    materialRef = doc(firestore, "materiales", materialId);

    console.log(
      "ANHELO detectado, guardando en ruta legacy: materiales/" + materialId
    );
  } else {
    // Verificar que tengamos un empresaId
    if (!empresaId) {
      throw new Error(
        "ID de empresa requerido para empresas que no son ANHELO"
      );
    }

    // Ruta para otras empresas en absoluteClientes
    materialRef = doc(
      firestore,
      "absoluteClientes",
      empresaId,
      "materiales",
      materialId
    );

    console.log(
      "Empresa normal detectada, guardando en ruta: absoluteClientes/" +
        empresaId +
        "/materiales/" +
        materialId
    );
  }

  // Crear el material
  await setDoc(materialRef, {
    ...materialData,
    // No incluimos el id aquí ya que sería redundante con el ID del documento
  });

  return materialRef;
};

/**
 * Lee todos los materiales
 * @param isAnhelo Indicador si es la empresa ANHELO o no
 * @param empresaId ID de la empresa (necesario para empresas que no son ANHELO)
 * @returns Una promesa que se resuelve con la lista de materiales
 */
export const ReadMateriales = async (): Promise<MaterialProps[]> => {
  // Versión original para mantener compatibilidad con código existente
  return readMateriales(true); // Por defecto asume que es ANHELO
};

export const readMateriales = async (
  isAnhelo: boolean,
  empresaId?: string
): Promise<MaterialProps[]> => {
  const firestore = getFirestore();

  let collections = [];

  if (isAnhelo) {
    // Ruta original para ANHELO
    collections = ["materiales"];
  } else {
    // Verificar que tengamos un empresaId
    if (!empresaId) {
      throw new Error(
        "ID de empresa requerido para empresas que no son ANHELO"
      );
    }

    // Ruta para otras empresas en absoluteClientes
    collections = [`absoluteClientes/${empresaId}/materiales`];
  }

  const fetchedData = await Promise.all(
    collections.map(async (collectionPath) => {
      const collectionRef = collection(firestore, collectionPath);
      const snapshot = await getDocs(collectionRef);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        const materialProps: MaterialProps = {
          id: doc.id,
          nombre: data.nombre,
          categoria: data.categoria,
          costo: data.costo,
          unit: data.unit,
          unidadPorPrecio: data.unidadPorPrecio,
          stock: data.stock,
        };
        return materialProps;
      });
    })
  );

  // Aplanar los datos y devolverlos como un array
  return fetchedData.flat();
};

/**
 * Actualiza el costo de un material
 * @param materialName Nombre del material a actualizar
 * @param newCost Nuevo costo del material
 * @param cant Cantidad a añadir al stock
 * @param isAnhelo Indicador si es la empresa ANHELO o no
 * @param empresaId ID de la empresa (necesario para empresas que no son ANHELO)
 */
export const updateMaterialCost = async (
  materialName: string,
  newCost: number,
  cant: number,
  isAnhelo: boolean,
  empresaId?: string
): Promise<void> => {
  const firestore = getFirestore();

  let materialesRef;

  if (isAnhelo) {
    // Ruta original para ANHELO
    materialesRef = collection(firestore, "materiales");
  } else {
    // Verificar que tengamos un empresaId
    if (!empresaId) {
      throw new Error(
        "ID de empresa requerido para empresas que no son ANHELO"
      );
    }

    // Ruta para otras empresas en absoluteClientes
    materialesRef = collection(
      firestore,
      "absoluteClientes",
      empresaId,
      "materiales"
    );
  }

  try {
    console.log("Buscando material:", materialName);
    console.log("Nuevo costo:", newCost);
    console.log("Cantidad:", cant);

    // Primero, obtener todos los materiales para verificar
    const materialesSnapshot = await getDocs(materialesRef);
    const materiales = materialesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Buscar el material por nombre (case insensitive)
    const material = materiales.find(
      (m) => m.nombre.toLowerCase() === materialName.toLowerCase()
    );

    if (material) {
      console.log("Material encontrado:", material);

      // Calcular nuevo stock
      const currentStock = material.stock || 0;
      const newStock = currentStock + cant;

      console.log("Stock actual:", currentStock);
      console.log("Nuevo stock:", newStock);

      // Determinar la referencia correcta según la empresa
      let materialDocRef;

      if (isAnhelo) {
        materialDocRef = doc(firestore, "materiales", material.id);
      } else {
        materialDocRef = doc(
          firestore,
          "absoluteClientes",
          empresaId,
          "materiales",
          material.id
        );
      }

      // Actualizar el documento
      await updateDoc(materialDocRef, {
        costo: newCost,
        stock: newStock,
      });

      console.log("Material actualizado exitosamente");
    } else {
      console.error(
        "Material no encontrado. Materiales disponibles:",
        materiales.map((m) => m.nombre)
      );
      throw new Error(`Material no encontrado: ${materialName}`);
    }
  } catch (error) {
    console.error("Error actualizando el costo del material:", error);
    throw error;
  }
};

export interface ProductoProps {
  name: string;
  description: string;
  price: number;
  costo: number;
  isCompuesto: boolean;
  materiales: {
    [key: string]: number;
  };
  img?: string;
  rating?: number;
  ratingCount?: number;
  type?: string;
}

/**
 * Crea un nuevo producto en la base de datos
 * @param productoData Datos del producto a crear
 * @param isAnhelo Indicador si es la empresa ANHELO o no
 * @param empresaId ID de la empresa (necesario para empresas que no son ANHELO)
 * @returns Una promesa que se resuelve cuando el producto ha sido creado
 */
export const CreateProducto = async (
  productoData: ProductoProps,
  isAnhelo: boolean,
  empresaId?: string
) => {
  const firestore = getFirestore();
  const productoId = uuidv4();

  // Determinar la ruta según la empresa
  let productoRef;

  if (isAnhelo) {
    // Ruta original para ANHELO (colección 'burgers')
    productoRef = doc(firestore, "burgers", productoId);

    console.log(
      "ANHELO detectado, guardando en ruta legacy: burgers/" + productoId
    );
  } else {
    // Verificar que tengamos un empresaId
    if (!empresaId) {
      throw new Error(
        "ID de empresa requerido para empresas que no son ANHELO"
      );
    }

    // Ruta para otras empresas en absoluteClientes (colección 'productos')
    productoRef = doc(
      firestore,
      "absoluteClientes",
      empresaId,
      "productos",
      productoId
    );

    console.log(
      "Empresa normal detectada, guardando en ruta: absoluteClientes/" +
        empresaId +
        "/productos/" +
        productoId
    );
  }

  // Crear el producto con valores por defecto para campos opcionales que no se incluyen
  const dataToSave = {
    ...productoData,
    img: productoData.img || "",
    rating: productoData.rating || 0,
    ratingCount: productoData.ratingCount || 0,
    type: productoData.type || "default",
  };

  // Crear el producto
  await setDoc(productoRef, dataToSave);

  return productoRef;
};

/**
 * Lee todos los productos
 * @param isAnhelo Indicador si es la empresa ANHELO o no
 * @param empresaId ID de la empresa (necesario para empresas que no son ANHELO)
 * @returns Una promesa que se resuelve con la lista de productos
 */
export const readProductos = async (
  isAnhelo: boolean,
  empresaId?: string
): Promise<ProductoProps[]> => {
  const firestore = getFirestore();

  let collections = [];

  if (isAnhelo) {
    // Ruta original para ANHELO
    collections = ["burgers"];
  } else {
    // Verificar que tengamos un empresaId
    if (!empresaId) {
      throw new Error(
        "ID de empresa requerido para empresas que no son ANHELO"
      );
    }

    // Ruta para otras empresas en absoluteClientes
    collections = [`absoluteClientes/${empresaId}/productos`];
  }

  const fetchedData = await Promise.all(
    collections.map(async (collectionPath) => {
      const collectionRef = collection(firestore, collectionPath);
      const snapshot = await getDocs(collectionRef);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        const productoProps: ProductoProps = {
          name: data.name,
          description: data.description,
          price: data.price,
          materiales: data.materiales || {},
          img: data.img,
          rating: data.rating,
          ratingCount: data.ratingCount,
          type: data.type,
        };
        return productoProps;
      });
    })
  );

  // Aplanar los datos y devolverlos como un array
  return fetchedData.flat();
};
