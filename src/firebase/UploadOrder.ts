import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { DetallePedidoProps } from '../pages/DynamicForm';
// Agregar orderDetail a la colección 'pedidos'

interface OrderDetailProps {
  envio: number;
  detallePedido: DetallePedidoProps[];
  subTotal: number;
  total: number;
  fecha: string;
  aclaraciones: string;
  metodoPago: string;
  direccion: string;
  telefono: string;
  hora: string;
}

export const UploadOrder = (orderDetail: OrderDetailProps) => {
  const firestore = getFirestore();
  const pedidosCollection = collection(firestore, 'pedidos');
  let check = false;
  addDoc(pedidosCollection, orderDetail)
    .then((docRef) => {
      console.log('Documento agregado con ID:', docRef.id);
      check = true;
    })
    .catch((error) => {
      console.error('Error al agregar documento:', error);
      check = false;
    });
  return check;
};
