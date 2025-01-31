import {
  getFirestore,
  collection,
  doc,
  runTransaction,
  getDocs,
} from 'firebase/firestore';
import { DetallePedidoProps } from '../pages/DynamicForm';
import { obtenerFechaActual } from '../helpers/dateToday';
import { v4 as uuidv4 } from 'uuid';
import { PedidoProps } from '../types/types';
import { cleanPhoneNumber } from '../helpers/orderByweeks';
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
  cerca?: boolean;
}
export const UploadOrder = async (
  orderDetail: OrderDetailProps
): Promise<string> => {
  const firestore = getFirestore();
  const pedidoId = uuidv4();
  const fechaFormateada = obtenerFechaActual();
  const [dia, mes, anio] = fechaFormateada.split('/');
  const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
  const pedidoDocRef = doc(pedidosCollectionRef, dia);

  try {
    await runTransaction(firestore, async (transaction) => {
      const docSnapshot = await transaction.get(pedidoDocRef);
      const existingData = docSnapshot.exists() ? docSnapshot.data() : {};
      const pedidosDelDia = existingData.pedidos || [];
      pedidosDelDia.push({ ...orderDetail, id: pedidoId, cerca: false });
      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosDelDia,
      });
    });
    return pedidoId;
  } catch (error) {
    console.error('Error al subir el pedido:', error);
    throw error;
  }
};

export const updateCadeteForOrder = (
  fechaPedido: string,
  pedidoId: string,
  nuevoCadete: string
): Promise<void> => {
  const firestore = getFirestore();

  return new Promise((resolve, reject) => {
    const [dia, mes, anio] = fechaPedido.split('/');
    const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
    const pedidoDocRef = doc(pedidosCollectionRef, dia);

    runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);
      if (!pedidoDocSnapshot.exists()) {
        reject(new Error('El pedido no existe para la fecha especificada.'));
        return;
      }

      const existingData = pedidoDocSnapshot.data();
      const pedidosDelDia = existingData.pedidos || [];

      const pedidosActualizados = pedidosDelDia.map((pedido: PedidoProps) => {
        if (pedido.fecha === fechaPedido && pedido.id === pedidoId) {
          return { ...pedido, cadete: nuevoCadete };
        } else {
          return pedido;
        }
      });

      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosActualizados,
      });
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const updateDislikeForOrder = (
  fechaPedido: string,
  pedidoId: string,
  dislike: boolean
): Promise<void> => {
  const firestore = getFirestore();

  return new Promise((resolve, reject) => {
    const [dia, mes, anio] = fechaPedido.split('/');
    const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
    const pedidoDocRef = doc(pedidosCollectionRef, dia);

    runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);
      if (!pedidoDocSnapshot.exists()) {
        reject(new Error('El pedido no existe para la fecha especificada.'));
        return;
      }

      const existingData = pedidoDocSnapshot.data();
      const pedidosDelDia = existingData.pedidos || [];

      const pedidosActualizados = pedidosDelDia.map((pedido: PedidoProps) => {
        if (pedido.fecha === fechaPedido && pedido.id === pedidoId) {
          return { ...pedido, dislike };
        } else {
          return pedido;
        }
      });

      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosActualizados,
      });
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const updateTotalForOrder = (
  fechaPedido: string,
  pedidoId: string,
  nuevoTotal: number
): Promise<void> => {
  const firestore = getFirestore();

  return new Promise((resolve, reject) => {
    const [dia, mes, anio] = fechaPedido.split('/');
    const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
    const pedidoDocRef = doc(pedidosCollectionRef, dia);

    runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);
      if (!pedidoDocSnapshot.exists()) {
        reject(new Error('El pedido no existe para la fecha especificada.'));
        return;
      }

      const existingData = pedidoDocSnapshot.data();
      const pedidosDelDia = existingData.pedidos || [];

      const pedidosActualizados = pedidosDelDia.map((pedido: PedidoProps) => {
        if (pedido.fecha === fechaPedido && pedido.id === pedidoId) {
          // Actualizar el total con el nuevo valor proporcionado
          return {
            ...pedido,
            total: nuevoTotal, // Actualizar el total
          };
        } else {
          return pedido;
        }
      });

      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosActualizados,
      });
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const updateCompesasionForOrder = (
  fechaPedido: string,
  pedidoId: string,
  compensasion: number,
  bonificacion: number
): Promise<void> => {
  const firestore = getFirestore();

  return new Promise((resolve, reject) => {
    const [dia, mes, anio] = fechaPedido.split('/');
    const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
    const pedidoDocRef = doc(pedidosCollectionRef, dia);

    runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);
      if (!pedidoDocSnapshot.exists()) {
        reject(new Error('El pedido no existe para la fecha especificada.'));
        return;
      }

      const existingData = pedidoDocSnapshot.data();
      const pedidosDelDia = existingData.pedidos || [];

      const pedidosActualizados = pedidosDelDia.map((pedido: PedidoProps) => {
        if (pedido.fecha === fechaPedido && pedido.id === pedidoId) {
          // Calcular el nuevo total restando la compensación y la bonificación
          const nuevoTotal = pedido.total - compensasion - bonificacion;
          return {
            ...pedido,
            compensacionPorError: compensasion,
            bonificacion: bonificacion,
            total: nuevoTotal, // Actualizar el total
          };
        } else {
          return pedido;
        }
      });

      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosActualizados,
      });
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const updateTiempoEntregaForOrder = (
  fechaPedido: string,
  pedidoId: string,
  nuevoTiempoEntrega: string
): Promise<void> => {
  const firestore = getFirestore();

  return new Promise((resolve, reject) => {
    const [dia, mes, anio] = fechaPedido.split('/');
    const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
    const pedidoDocRef = doc(pedidosCollectionRef, dia);

    runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);
      if (!pedidoDocSnapshot.exists()) {
        reject(new Error('El pedido no existe para la fecha especificada.'));
        return;
      }

      const existingData = pedidoDocSnapshot.data();
      const pedidosDelDia = existingData.pedidos || [];

      const pedidosActualizados = pedidosDelDia.map((pedido: PedidoProps) => {
        if (pedido.fecha === fechaPedido && pedido.id === pedidoId) {
          return {
            ...pedido,
            tiempoEntregado: nuevoTiempoEntrega, // Actualizar el tiempo de entrega
          };
        } else {
          return pedido;
        }
      });

      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosActualizados,
      });
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const updateTiempoElaboradoForOrder = (
  fechaPedido: string,
  pedidoId: string,
  nuevoTiempoElaborado: string
): Promise<void> => {
  const firestore = getFirestore();

  return new Promise((resolve, reject) => {
    const [dia, mes, anio] = fechaPedido.split('/');
    const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
    const pedidoDocRef = doc(pedidosCollectionRef, dia);

    runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);
      if (!pedidoDocSnapshot.exists()) {
        reject(new Error('El pedido no existe para la fecha especificada.'));
        return;
      }

      const existingData = pedidoDocSnapshot.data();
      const pedidosDelDia = existingData.pedidos || [];

      const pedidosActualizados = pedidosDelDia.map((pedido: PedidoProps) => {
        if (pedido.fecha === fechaPedido && pedido.id === pedidoId) {
          return {
            ...pedido,
            tiempoElaborado: nuevoTiempoElaborado, // Actualizar el tiempo de entrega
          };
        } else {
          return pedido;
        }
      });

      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosActualizados,
      });
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const updateOrderFields = (
  fechaPedido: string,
  pedidoId: string,
  fields: Partial<PedidoProps>
): Promise<void> => {
  const firestore = getFirestore();

  return new Promise((resolve, reject) => {
    const [dia, mes, anio] = fechaPedido.split('/');
    const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
    const pedidoDocRef = doc(pedidosCollectionRef, dia);

    runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);
      if (!pedidoDocSnapshot.exists()) {
        reject(new Error('El pedido no existe para la fecha especificada.'));
        return;
      }

      const existingData = pedidoDocSnapshot.data();
      const pedidosDelDia = existingData.pedidos || [];

      const pedidosActualizados = pedidosDelDia.map((pedido: PedidoProps) => {
        if (pedido.fecha === fechaPedido && pedido.id === pedidoId) {
          if (pedido.metodoPago === 'efectivo') {
            pedido.efectivoCantidad = fields.total ?? pedido.efectivoCantidad;
          }
          return { ...pedido, ...fields };
        } else {
          return pedido;
        }
      });

      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosActualizados,
      });
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const updateOrderTime = (
  fechaPedido: string,
  pedidoId: string,
  nuevaHora: string
): Promise<void> => {
  const firestore = getFirestore();

  return new Promise((resolve, reject) => {
    const [dia, mes, anio] = fechaPedido.split('/');
    const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
    const pedidoDocRef = doc(pedidosCollectionRef, dia);

    runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);
      if (!pedidoDocSnapshot.exists()) {
        reject(new Error('El pedido no existe para la fecha especificada.'));
        return;
      }

      const existingData = pedidoDocSnapshot.data();
      const pedidosDelDia = existingData.pedidos || [];

      const pedidosActualizados = pedidosDelDia.map((pedido: PedidoProps) => {
        if (pedido.fecha === fechaPedido && pedido.id === pedidoId) {
          // Actualiza solo el campo 'hora'
          return { ...pedido, hora: nuevaHora };
        } else {
          return pedido;
        }
      });

      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosActualizados,
      });
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
};

interface Pedido {
  telefono: string;
  fecha: string;
}

export const obtenerUltimaFechaPedido = async (): Promise<
  Record<string, string>
> => {
  const firestore = getFirestore();
  const ultimaFechaPorTelefono: Record<string, string> = {};

  const fechaActual = new Date();
  const anioActual = fechaActual.getFullYear();
  const mesActual = fechaActual.getMonth() + 1; // Los meses en JS son 0-indexed

  // Itera desde febrero 2024 hasta el mes actual
  for (let anio = 2024; anio <= anioActual; anio++) {
    const mesInicio = anio === 2024 ? 2 : 1; // Empezamos desde febrero para el año 2024
    const mesFin = anio === anioActual ? mesActual : 12;

    for (let mes = mesInicio; mes <= mesFin; mes++) {
      const mesString = mes.toString().padStart(2, '0'); // Formato "MM"

      // Referencia a la colección del mes actual
      const pedidosMensualesRef = collection(
        firestore,
        'pedidos',
        anio.toString(),
        mesString
      );

      // Obtener cada día de pedidos de este mes
      const diasSnapshot = await getDocs(pedidosMensualesRef);
      for (const diaDoc of diasSnapshot.docs) {
        const pedidosDelDia: Pedido[] = diaDoc.data().pedidos || [];

        // Verifica la última fecha de pedido para cada número de teléfono
        pedidosDelDia.forEach((pedido) => {
          let { telefono } = pedido;
          const { fecha } = pedido;
          telefono = cleanPhoneNumber(telefono);
          if (
            !ultimaFechaPorTelefono[telefono] ||
            new Date(fecha) > new Date(ultimaFechaPorTelefono[telefono])
          ) {
            ultimaFechaPorTelefono[telefono] = fecha;
          }
        });
      }
    }
  }

  return ultimaFechaPorTelefono;
};

export async function ejecutarObtenerUltimaFechaPedido() {
  try {
    const ultimasFechas = await obtenerUltimaFechaPedido();
    console.log('Última fecha de pedido por teléfono:', ultimasFechas);
    // Aquí puedes hacer algo adicional con las fechas obtenidas, como filtrar clientes
    // que no han hecho pedidos en más de un mes
  } catch (error) {
    console.error('Error al obtener la última fecha de pedido:', error);
  }
}

export async function obtenerClientesInactivos() {
  const ultimasFechas = await obtenerUltimaFechaPedido();
  const clientesInactivos: string[] = [];
  const haceUnMes = new Date();
  haceUnMes.setMonth(haceUnMes.getMonth() - 1);

  for (const [telefono, fecha] of Object.entries(ultimasFechas)) {
    if (new Date(fecha) < haceUnMes) {
      clientesInactivos.push(telefono);
    }
  }

  return clientesInactivos;
}

// Uso después de obtener las últimas fechas de pedido

// En el archivo de Firebase (por ejemplo, UploadOrder.ts)

export const updateOrderCookNow = (
  fechaPedido: string,
  pedidoId: string,
  cookNow: boolean
): Promise<void> => {
  const firestore = getFirestore();

  return new Promise((resolve, reject) => {
    const [dia, mes, anio] = fechaPedido.split('/');
    const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
    const pedidoDocRef = doc(pedidosCollectionRef, dia);

    runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);
      if (!pedidoDocSnapshot.exists()) {
        reject(new Error('El pedido no existe para la fecha especificada.'));
        return;
      }

      const existingData = pedidoDocSnapshot.data();
      const pedidosDelDia = existingData.pedidos || [];

      const pedidosActualizados = pedidosDelDia.map((pedido: PedidoProps) => {
        if (pedido.fecha === fechaPedido && pedido.id === pedidoId) {
          return { ...pedido, cookNow };
        } else {
          return pedido;
        }
      });

      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosActualizados,
      });
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const updateMultipleOrders = async (
  fecha: string,
  updates: { orderId: string; newCadete: string; }[]
): Promise<void> => {
  const firestore = getFirestore();
  const [dia, mes, anio] = fecha.split('/');
  const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
  const pedidoDocRef = doc(pedidosCollectionRef, dia);

  return new Promise((resolve, reject) => {
    runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);
      if (!pedidoDocSnapshot.exists()) {
        reject(new Error('El documento no existe para la fecha especificada.'));
        return;
      }

      const existingData = pedidoDocSnapshot.data();
      const pedidosDelDia = existingData.pedidos || [];

      const pedidosActualizados = pedidosDelDia.map((pedido: PedidoProps) => {
        const updateInfo = updates.find(update => update.orderId === pedido.id);
        if (updateInfo && pedido.fecha === fecha) {
          return { ...pedido, cadete: updateInfo.newCadete };
        }
        return pedido;
      });

      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosActualizados,
      });
    })
      .then(() => {
        console.log('Actualización múltiple completada exitosamente');
        resolve();
      })
      .catch((error) => {
        console.error('Error en actualización múltiple:', error);
        reject(error);
      });
  });
};