import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  deleteDoc,
  DocumentData,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export interface SimpleMaterialProps {
  nombre: string;
  costo: number;
  medida: number;
  unidadMedida: string;
}

export interface MaterialProps {
  nombre: string;
  costo: number;
  medida: number;
  unidadMedida: string;
  id?: string;
  img?: string;
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

    // console.log(
    //   "ANHELO detectado, guardando en ruta legacy: materiales/" + materialId
    // );
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

    // console.log(
    //   "Empresa normal detectada, guardando en ruta: absoluteClientes/" +
    //     empresaId +
    //     "/materiales/" +
    //     materialId
    // );
  }

  // Crear el material
  await setDoc(materialRef, materialData);

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
          costo: data.costo,
          medida: data.medida || 0,
          unidadMedida: data.unidadMedida || "",
          img: data.img || "",
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
    // console.log("Buscando material:", materialName);
    // console.log("Nuevo costo:", newCost);
    // console.log("Cantidad:", cant);

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
      // console.log("Material encontrado:", material);

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

      // Actualizar el documento con el nuevo costo
      await updateDoc(materialDocRef, {
        costo: newCost,
        medida: material.medida || 0,
      });

      // console.log("Material actualizado exitosamente");
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
  materiales?: {
    [key: string]: number;
  };
  img?: string;
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

    // console.log(
    //   "ANHELO detectado, guardando en ruta legacy: burgers/" + productoId
    // );
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

    // console.log(
    //   "Empresa normal detectada, guardando en ruta: absoluteClientes/" +
    //     empresaId +
    //     "/productos/" +
    //     productoId
    // );
  }

  // Crear el producto con valores por defecto para campos opcionales que no se incluyen
  const dataToSave = {
    ...productoData,
    img: productoData.img || "",
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
        const productoProps: ProductoProps & { id?: string } = {
          id: doc.id, // Añadir el ID del documento
          name: data.name,
          description: data.description,
          price: data.price,
          costo: data.costo,
          img: data.img || "",
        };

        // Solo incluir materiales si existen en el documento
        if (data.materiales) {
          productoProps.materiales = data.materiales;
        }

        return productoProps;
      });
    })
  );

  // Aplanar los datos y devolverlos como un array
  return fetchedData.flat();
};

/**
 * Actualiza un material existente
 * @param materialData Datos actualizados del material
 * @param isAnhelo Indicador si es la empresa ANHELO o no
 * @param empresaId ID de la empresa (necesario para empresas que no son ANHELO)
 */
export const updateMaterial = async (
  materialData: MaterialProps,
  isAnhelo: boolean,
  empresaId?: string
): Promise<void> => {
  if (!materialData.id) {
    throw new Error("ID de material requerido para actualizar");
  }

  const firestore = getFirestore();
  let materialRef;

  if (isAnhelo) {
    materialRef = doc(firestore, "materiales", materialData.id);
  } else {
    if (!empresaId) {
      throw new Error(
        "ID de empresa requerido para empresas que no son ANHELO"
      );
    }
    materialRef = doc(
      firestore,
      "absoluteClientes",
      empresaId,
      "materiales",
      materialData.id
    );
  }

  // Crear una versión sin el ID para actualizar
  const { id, ...dataToUpdate } = materialData;

  // Asegurar que los campos tengan valores predeterminados si no existen
  const updateData = {
    ...dataToUpdate,
    nombre: dataToUpdate.nombre || "",
    costo: dataToUpdate.costo || 0,
    medida: dataToUpdate.medida || 0,
    unidadMedida: dataToUpdate.unidadMedida || "",
    img: dataToUpdate.img || "",
  };

  await updateDoc(materialRef, updateData);
};

/**
 * Elimina un material existente
 * @param materialId ID del material a eliminar
 * @param isAnhelo Indicador si es la empresa ANHELO o no
 * @param empresaId ID de la empresa (necesario para empresas que no son ANHELO)
 */
export const deleteMaterial = async (
  materialId: string,
  isAnhelo: boolean,
  empresaId?: string
): Promise<void> => {
  const firestore = getFirestore();
  let materialRef;

  if (isAnhelo) {
    materialRef = doc(firestore, "materiales", materialId);
  } else {
    if (!empresaId) {
      throw new Error(
        "ID de empresa requerido para empresas que no son ANHELO"
      );
    }
    materialRef = doc(
      firestore,
      "absoluteClientes",
      empresaId,
      "materiales",
      materialId
    );
  }

  await deleteDoc(materialRef);
};

/**
 * Actualiza un producto existente
 * @param productoData Datos actualizados del producto
 * @param isAnhelo Indicador si es la empresa ANHELO o no
 * @param empresaId ID de la empresa (necesario para empresas que no son ANHELO)
 */
export const updateProducto = async (
  productoData: ProductoProps & { id?: string },
  isAnhelo: boolean,
  empresaId?: string
): Promise<void> => {
  if (!productoData.id) {
    throw new Error("ID de producto requerido para actualizar");
  }

  const firestore = getFirestore();
  let productoRef;

  if (isAnhelo) {
    productoRef = doc(firestore, "burgers", productoData.id);
  } else {
    if (!empresaId) {
      throw new Error(
        "ID de empresa requerido para empresas que no son ANHELO"
      );
    }
    productoRef = doc(
      firestore,
      "absoluteClientes",
      empresaId,
      "productos",
      productoData.id
    );
  }

  // Crear una versión sin el ID para actualizar
  const { id, ...dataToUpdate } = productoData;

  await updateDoc(productoRef, dataToUpdate);
};

/**
 * Elimina un producto existente
 * @param productoId ID del producto a eliminar
 * @param isAnhelo Indicador si es la empresa ANHELO o no
 * @param empresaId ID de la empresa (necesario para empresas que no son ANHELO)
 */
export const deleteProducto = async (
  productoId: string,
  isAnhelo: boolean,
  empresaId?: string
): Promise<void> => {
  const firestore = getFirestore();
  let productoRef;

  if (isAnhelo) {
    productoRef = doc(firestore, "burgers", productoId);
  } else {
    if (!empresaId) {
      throw new Error(
        "ID de empresa requerido para empresas que no son ANHELO"
      );
    }
    productoRef = doc(
      firestore,
      "absoluteClientes",
      empresaId,
      "productos",
      productoId
    );
  }

  await deleteDoc(productoRef);
};
