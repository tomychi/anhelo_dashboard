import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { setData } from './dataSlice';

export const fetchData = () => {
  return async (dispatch) => {
    const firestore = getFirestore();
    const collections = ['burgers', 'drinks', 'fries', 'toppings'];

    try {
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

      const allData = fetchedData.flat();
      dispatch(setData(allData));
    } catch (error) {
      console.error('Error fetching data:', error);
      // Puedes despachar otra acción de error si lo necesitas
    }
  };
};
