import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  DocumentSnapshot,
  getDoc,
  DocumentData,
  QuerySnapshot,
  getDocs,
} from 'firebase/firestore';

interface InstagramData {
  username: string;
  followers: number;
  date: string;
  likes: number;
  comentarios: number;
}

export const storeInstagramData = async (
  data: InstagramData
): Promise<void> => {
  const { username, date, ...restData } = data;
  const firestore = getFirestore();
  const docRef = doc(collection(firestore, 'instagramData'), username);

  try {
    const userDoc: DocumentSnapshot<DocumentData> = await getDoc(docRef);

    if (!userDoc.exists()) {
      // Si el documento para este usuario no existe, lo creamos y agregamos el primer dato
      await setDoc(docRef, { [date]: restData });
      console.log('Datos guardados con éxito');
    } else {
      // Si el documento ya existe, actualizamos los datos existentes o añadimos uno nuevo si es un día diferente
      const userData = userDoc.data();

      if (userData && userData[date]) {
        // Si ya existe un registro para esta fecha, actualizamos los datos existentes
        await updateDoc(docRef, { [`${date}.followers`]: restData.followers });
        console.log('Datos actualizados con éxito para el mismo día');
      } else {
        // Si no existe un registro para esta fecha, lo añadimos como un nuevo registro
        await setDoc(
          docRef,
          { ...userData, [date]: restData },
          { merge: true }
        );
        console.log('Datos añadidos con éxito para un nuevo día');
      }
    }
  } catch (error) {
    console.error('Error al guardar los datos:', error);
    throw new Error('Error al guardar los datos');
  }
};

export const fetchAllInstagramData = async (): Promise<InstagramData[]> => {
  const firestore = getFirestore();
  const collectionRef = collection(firestore, 'instagramData');

  try {
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(
      collectionRef
    );
    const allData: InstagramData[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      Object.keys(data).forEach((date) => {
        allData.push({
          username: doc.id,
          followers: data[date].followers,
          date,
          likes: data[date].likes || 0,
          comentarios: data[date].comentarios || 0,
        });
      });
    });

    return allData;
  } catch (error) {
    console.error('Error al obtener los datos:', error);
    throw new Error('Error al obtener los datos');
  }
};

interface DataEntry {
  followers: number;
  likes: number;
  comentarios: number;
}

interface FakeDatabase {
  [date: string]: {
    [username: string]: DataEntry;
  };
}

export const transformData = (data: InstagramData[]): FakeDatabase => {
  const allData: FakeDatabase = {};

  data.forEach((entry) => {
    if (!allData[entry.date]) {
      allData[entry.date] = {};
    }
    allData[entry.date][entry.username] = {
      followers: entry.followers,
      likes: entry.likes,
      comentarios: entry.comentarios,
    };
  });

  // Ordenar las fechas
  const sortedData: FakeDatabase = {};
  Object.keys(allData)
    .sort()
    .forEach((date) => {
      sortedData[date] = allData[date];
    });
  return sortedData;
};
