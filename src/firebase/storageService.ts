import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

/**
 * Sube una imagen a Firebase Storage
 * @param file Archivo a subir
 * @param path Ruta donde guardar la imagen (sin la barra inicial)
 * @param onProgress Función de callback para el progreso de la subida
 * @returns Una promesa que se resuelve con la URL de la imagen
 */
export const uploadImage = async (
  file: File,
  path: string = "productos",
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    const storage = getStorage();

    // Crear un nombre único para el archivo
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;

    // Referencia simplificada
    const filePath = `${path}/${fileName}`;
    const storageRef = ref(storage, filePath);

    // console.log("Subiendo archivo a:", filePath);

    // Subir el archivo
    const snapshot = await uploadBytes(storageRef, file);
    // console.log("Archivo subido con éxito:", snapshot.metadata.fullPath);

    // Si se proporciona una función de callback para el progreso
    if (onProgress) {
      onProgress(100);
    }

    // Obtener la URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);
    // console.log("URL de descarga obtenida:", downloadURL);

    return downloadURL;
  } catch (error) {
    console.error("Error al subir imagen:", error);
    throw error;
  }
};

/**
 * Genera una URL para una imagen de placeholder
 * @param width Ancho de la imagen
 * @param height Alto de la imagen
 * @param text Texto a mostrar en la imagen
 * @returns URL de la imagen de placeholder
 */
export const getPlaceholderImage = (
  width: number = 400,
  height: number = 400,
  text: string = "Sin imagen"
): string => {
  return `https://via.placeholder.com/${width}x${height}.png?text=${encodeURIComponent(text)}`;
};
