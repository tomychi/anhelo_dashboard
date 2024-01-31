import {
  getFirestore,
  collection,
  DocumentReference,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { DetallePedidoProps } from '../pages/DynamicForm';
import { obtenerFechaActual } from '../helpers/dateToday';
import { v4 as uuidv4 } from 'uuid';

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
export const UploadOrder = (
  orderDetail: OrderDetailProps
): Promise<DocumentReference> => {
  const firestore = getFirestore();

  // Generar un ID único para el pedido
  const pedidoId = uuidv4();

  // Obtener la fecha formateada
  const fechaFormateada = obtenerFechaActual();

  // Separar la fecha en día, mes y año
  const [dia, mes, anio] = fechaFormateada.split('/');

  // Crear la referencia a la colección con tres segmentos: pedidos/año/mes
  const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);

  // Crear la referencia a un documento con el ID igual al día
  const pedidoDocRef = doc(pedidosCollectionRef, dia);

  // Retorna una promesa
  return new Promise((resolve, reject) => {
    // Obtener los datos actuales del documento
    getDoc(pedidoDocRef)
      .then((docSnap) => {
        const existingData = docSnap.exists() ? docSnap.data() : {};

        // Obtener o inicializar el arreglo de pedidos para el día
        const pedidosDelDia = existingData.pedidos || [];

        // Agregar el nuevo pedido al arreglo
        pedidosDelDia.push({ ...orderDetail, id: pedidoId });

        // Actualizar los datos del documento con el nuevo arreglo de pedidos
        setDoc(pedidoDocRef, {
          ...existingData,
          pedidos: pedidosDelDia,
        }).then(() => {
          resolve(pedidoDocRef); // Resuelve la promesa con la referencia al documento
        });
      })
      .catch((error) => {
        reject(error); // Rechaza la promesa con el error
      });
  });
};
