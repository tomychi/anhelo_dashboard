import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { setOrders } from './ordersSlices';
import { Dispatch } from 'redux';

export const fetchOrders = () => {
  return async (dispatch: Dispatch) => {
    const firestore = getFirestore();
    const collections = ['pedidos'];

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

      const orders = fetchedData.flat();
      dispatch(setOrders(orders)); // Dispatch a la acción setOrders con los datos obtenidos
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Puedes despachar otra acción de error si lo necesitas
    }
  };
};
