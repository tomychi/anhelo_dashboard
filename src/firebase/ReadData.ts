import {
  getFirestore,
  collection,
  getDocs,
  onSnapshot,
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

export const ReadOrder = (callback) => {
  const firestore = getFirestore();
  const collectionRef = collection(firestore, 'pedidos');

  return onSnapshot(collectionRef, (snapshot) => {
    const fetchedData = snapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
    }));
    callback(fetchedData);
  });
};
