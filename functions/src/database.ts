import { firestore } from "./firebaseAdmin";
import { obtenerFechaActual } from "./helpers";
import { OrderDetailProps, PedidoProps, ProductoMaterial } from "./types";

export const UploadOrder = async (
  orderDetail: OrderDetailProps,
  id: string,
) => {
  const fechaFormateada = obtenerFechaActual();
  const [dia, mes, anio] = fechaFormateada.split("/");

  // Usa firestore.collection() y firestore.doc()
  const pedidosCollectionRef = firestore
    .collection("pedidos")
    .doc(anio)
    .collection(mes);
  const pedidoDocRef = pedidosCollectionRef.doc(dia);

  try {
    await firestore.runTransaction(async (transaction) => {
      const docSnapshot = await transaction.get(pedidoDocRef);
      const existingData = docSnapshot.exists ? docSnapshot.data() : {};
      const pedidosDelDia = existingData?.pedidos || [];
      pedidosDelDia.push({
        ...orderDetail,
        id,
        cerca: false,
        paid: false,
      });
      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosDelDia,
      });
    });
    return id;
  } catch (error) {
    console.error("Error al subir el pedido:", error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId: string, paid: boolean) => {
  const fechaFormateada = obtenerFechaActual(); // Usa tu función de fecha actual
  const [dia, mes, anio] = fechaFormateada.split("/");
  const pedidosCollectionRef = firestore
    .collection("pedidos")
    .doc(anio)
    .collection(mes); // Cambiado para usar firestore.collection()
  const pedidoDocRef = pedidosCollectionRef.doc(dia); // Obtener referencia al documento del día

  try {
    await firestore.runTransaction(async (transaction) => {
      // Cambiado para usar firestore.runTransaction()
      const docSnapshot = await transaction.get(pedidoDocRef);
      if (!docSnapshot.exists) {
        throw new Error("El documento del pedido no existe.");
      }

      const existingData = docSnapshot.data();
      const pedidosDelDia = existingData?.pedidos || [];

      // Busca el pedido por orderId y actualiza su estado
      const updatedPedidos = pedidosDelDia.map((pedido: PedidoProps) => {
        if (pedido.id === orderId) {
          return { ...pedido, paid: paid }; // Actualiza el campo 'paid'
        }
        return pedido;
      });

      // Actualiza el documento en Firestore
      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: updatedPedidos,
      });
    });

    console.log(`Pedido con ID ${orderId} actualizado correctamente.`);
  } catch (error) {
    console.error("Error al actualizar el estado del pedido:", error);
    throw error;
  }
};

export const ReadMateriales = async () => {
  const collections = ["materiales"];

  const fetchedData = await Promise.all(
    collections.map(async (collectionName) => {
      const collectionRef = firestore.collection(collectionName); // Usar firestore.collection()
      const snapshot = await collectionRef.get(); // Obtener todos los documentos de la colección

      return snapshot.docs.map((doc) => {
        const data = doc.data(); // Datos del documento de Firestore
        // Convertir los datos a un objeto ProductoMaterial
        const productoMaterial = {
          id: doc.id,
          nombre: data.nombre,
          categoria: data.categoria,
          costo: data.costo,
          unit: data.unit,
          unidadPorPrecio: data.unidadPorPrecio,
          stock: data.stock,
        };
        return productoMaterial;
      });
    }),
  );

  // Hacer un flatten de fetchedData y devolver los datos como un arreglo de ProductoMaterial[]
  return fetchedData.flat();
};

export const ReadData = async () => {
  const collections = ["burgers", "drinks", "fries", "toppings"];

  const fetchedData = await Promise.all(
    collections.map(async (collectionName) => {
      const collectionRef = firestore.collection(collectionName); // Usar firestore.collection()
      const snapshot = await collectionRef.get(); // Obtener todos los documentos de la colección

      return snapshot.docs.map((doc) => doc.data()); // Solo devolvemos el campo 'data'
    }),
  );

  // Aplanamos el array para obtener un solo array con los datos
  return fetchedData.flat();
};

export const calcularCostoHamburguesa = (
  materiales: ProductoMaterial[],
  ingredientes: Record<string, number>,
) => {
  if (!ingredientes) {
    console.error("El objeto 'ingredientes' es null o undefined.");
    return 0;
  }

  let costoTotal = 0;

  // Iterar sobre las entradas del objeto ingredientes
  for (const [nombre, cantidad] of Object.entries(ingredientes)) {
    // Buscar el ingrediente en la lista de materiales
    const ingrediente = materiales.find((item) => item.nombre === nombre);
    if (ingrediente) {
      // Calcular el costo del ingrediente y sumarlo al costo total
      const costoIngrediente = ingrediente.costo * cantidad;
      costoTotal += costoIngrediente;
    } else {
      console.error(
        `No se encontró el ingrediente ${nombre} en la lista de materiales.`,
      );
    }
  }

  return costoTotal;
};
