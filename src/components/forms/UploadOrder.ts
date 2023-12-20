import { getFirestore, collection, addDoc } from 'firebase/firestore';
// Agregar orderDetail a la colección 'pedidos'

export const UploadOrder = (orderDetail) => {
  const firestore = getFirestore();
  const pedidosCollection = collection(firestore, 'pedidos');

  addDoc(pedidosCollection, orderDetail)
    .then((docRef) => {
      console.log('Documento agregado con ID:', docRef.id);
      // Lógica adicional después de agregar el documento
    })
    .catch((error) => {
      console.error('Error al agregar documento:', error);
    });
};
