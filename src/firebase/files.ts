import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid'; // Para generar un ID único para cada archivo

export const uploadFile = (
  file: File,
  onProgress: (progress: number) => void,
  onSuccess: (downloadURL: string) => void,
  onError: (error: Error) => void
) => {
  const storage = getStorage();
  const fileId = uuidv4(); // Generar un ID único para el archivo
  const storageRef = ref(storage, `comprobantes/${fileId}-${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  uploadTask.on(
    'state_changed',
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      onProgress(progress);
    },
    (error) => {
      console.error('Error al subir el archivo:', error);
      onError(error);
    },
    () => {
      getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        // Guardar el enlace en Firestore
        saveFileUrlToFirestore(fileId, downloadURL)
          .then(() => onSuccess(downloadURL))
          .catch((error) => onError(error));
      });
    }
  );
};

const saveFileUrlToFirestore = async (fileId: string, downloadURL: string) => {
  const firestore = getFirestore();

  await setDoc(doc(firestore, 'comprobantes', fileId), {
    fileName: downloadURL.split('/').pop(), // Extrae el nombre del archivo de la URL
    url: downloadURL,
    timestamp: new Date().toISOString(),
  });
};
