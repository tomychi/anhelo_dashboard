import {
  getFirestore,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

export const ReadData = async () => {
  const firestore = getFirestore();

  const collections = ['burgers', 'drinks', 'fries', 'toppings'];

  const fetchedData = await Promise.all(
    collections.map(async (collectionName) => {
      const collectionRef = collection(firestore, collectionName);
      const snapshot = await getDocs(collectionRef);

      const dataWithIds = snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
        collectionName: collectionName,
      }));

      return dataWithIds;
    })
  );

  return fetchedData.flat();
};

// Función para convertir la cadena "DD/MM/YYYY" a un objeto Date
const parseDate = (dateString) => {
  const [day, month, year] = dateString.split('/');
  return new Date(`${year}-${month}-${day}`);
};

const obtenerFechaActual = () => {
  const fechaActual = new Date(); // Obtiene la fecha y hora actuales

  const dia = fechaActual.getDate();
  const mes = fechaActual.getMonth() + 1; // Los meses comienzan desde 0
  const anio = fechaActual.getFullYear();

  // Formatea la fecha como "DD/MM/AAAA"
  const fechaFormateada = `${dia}/${mes}/${anio}`;

  return fechaFormateada;
};

// Obtener pedidos para la fecha actual
export const ReadOrdersForToday = (callback) => {
  const firestore = getFirestore();
  const ordersCollectionRef = collection(firestore, 'pedidos');

  const todayDateString = obtenerFechaActual();

  const queryToday = query(
    ordersCollectionRef,
    where('fecha', '==', todayDateString)
  );

  return onSnapshot(queryToday, (snapshot) => {
    const fetchedData = snapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
    }));
    callback(fetchedData);
  });
};
