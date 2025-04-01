import { firestore } from "./firebaseAdmin";
import { cleanPhoneNumber, obtenerFechaActual } from "./helpers";
import { OrderDetailProps, PedidoProps, ProductoMaterial } from "./types";

export const UploadOrder = async (
  orderDetail: OrderDetailProps,
  id: string
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

    // console.log(`Pedido con ID ${orderId} actualizado correctamente.`);
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
    })
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
    })
  );

  // Aplanamos el array para obtener un solo array con los datos
  return fetchedData.flat();
};

export const calcularCostoHamburguesa = (
  materiales: ProductoMaterial[],
  ingredientes: Record<string, number>
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
        `No se encontró el ingrediente ${nombre} en la lista de materiales.`
      );
    }
  }

  return costoTotal;
};

export const canjearVoucher = async (codigo: string): Promise<boolean> => {
  const vouchersCollectionRef = firestore.collection("vouchers"); // Referencia a la colección de vouchers

  try {
    // Inicia la transacción
    await firestore.runTransaction(async (transaction) => {
      const querySnapshot = await vouchersCollectionRef.get(); // Obtener todos los documentos de la colección de vouchers
      let voucherEncontrado = false; // Bandera para verificar si el voucher fue encontrado

      // Recorre todos los documentos de la colección de vouchers
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data(); // Obtén los datos del documento
        const codigos = data.codigos || []; // Lista de códigos en el documento

        // Encuentra el código en el arreglo de códigos
        const codigoIndex = codigos.findIndex(
          (c: { codigo: string }) => c.codigo === codigo
        );

        if (codigoIndex !== -1) {
          // Si el código ya fue canjeado, retorna false
          if (codigos[codigoIndex].estado === "usado") {
            console.error("El voucher ya ha sido canjeado");
            return false;
          }

          // Si el código es válido, se marca como "usado"
          codigos[codigoIndex].estado = "usado";

          // Actualiza el documento en Firestore con el código marcado como usado
          const voucherDocRef = vouchersCollectionRef.doc(docSnapshot.id); // Referencia al documento actual
          transaction.update(voucherDocRef, { codigos }); // Actualiza el documento en la transacción

          voucherEncontrado = true; // Se encontró y actualizó el voucher
          break; // Salir del bucle una vez encontrado el voucher
        }
      }

      if (!voucherEncontrado) {
        console.error("No se encontró el voucher con el código proporcionado");
        return false;
      }

      return true; // Si todo fue exitoso, retorna true
    });

    return true; // Si la transacción completa fue exitosa, retorna true
  } catch (error) {
    console.error("Error al canjear el voucher:", error);
    throw error; // Lanza un error si algo falla
  }
};

export const addTelefonoFirebase = async (
  phoneNumber: string,
  fecha: string
) => {
  const cleanPhone = cleanPhoneNumber(phoneNumber);
  const telefonosCollectionRef = firestore.collection("telefonos");
  const querySnapshot = await telefonosCollectionRef
    .where("telefono", "==", cleanPhone)
    .get();

  if (querySnapshot.empty) {
    // El número de teléfono no existe en la base de datos, entonces lo agregamos
    try {
      const docRef = await telefonosCollectionRef.add({
        telefono: cleanPhone,
        fecha: fecha,
        lastOrder: fecha, // Nueva fecha como último pedido al agregar
      });
      // console.log(
      //   `Se agregó el número de teléfono ${cleanPhone} a Firebase con el ID: ${docRef.id}. Fecha: ${fecha}`
      // );
    } catch (e) {
      console.error("Error al agregar el número de teléfono a Firebase:", e);
    }
  } else {
    // El número de teléfono ya existe en la base de datos, actualizamos el campo lastOrder
    querySnapshot.forEach(async (documento) => {
      try {
        const docRef = telefonosCollectionRef.doc(documento.id);
        await docRef.update({
          lastOrder: fecha, // Actualiza con la nueva fecha del último pedido
        });
        // console.log(
        //   `El número de teléfono ${cleanPhone} ya existe en la base de datos. Actualizado lastOrder a: ${fecha}`
        // );
      } catch (e) {
        console.error("Error al actualizar el campo lastOrder en Firebase:", e);
      }
    });
  }
};
