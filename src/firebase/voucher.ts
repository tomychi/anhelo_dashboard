import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

export interface Codigo {
  codigo: string;
  estado: string;
  num: number;
  gratis?: boolean; // Propiedad añadida a nivel de código individual
}

interface CostItem {
  title: string;
  value: number;
}

interface Pedido {
  fecha: string;
  total: number;
  subTotal: number;
  couponCodes?: string[];
  telefono?: string;
}

export const obtenerPedidosDesdeCampana = async (
  fechaCampana: string,
  titulo: string
): Promise<{
  todosPedidos: Pedido[];
  pedidosConCupon: Pedido[];
  codigosCampana: string[];
}> => {
  const firestore = getFirestore();
  const todosPedidos: Pedido[] = [];
  const pedidosConCupon: Pedido[] = [];
  const cuponesEncontrados = new Set<string>();

  try {
    // 1. Primero obtenemos los códigos de la campaña
    const voucherRef = doc(firestore, "vouchers", titulo);
    const voucherDoc = await getDoc(voucherRef);

    if (!voucherDoc.exists()) {
      return {
        todosPedidos: [],
        pedidosConCupon: [],
        codigosCampana: [],
      };
    }

    const voucherData = voucherDoc.data();
    const codigosCampana = voucherData.codigos
      .filter((c) => c.estado === "usado")
      .map((c) => c.codigo);

    // 2. Convertimos la fecha de inicio
    let fechaInicio: Date;
    if (fechaCampana.includes("-")) {
      const [ano, mes, dia] = fechaCampana.split("-");
      fechaInicio = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    } else {
      const [dia, mes, ano] = fechaCampana.split("/");
      fechaInicio = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    }

    // 3. Configuramos el rango de fechas a buscar
    const fechaActual = new Date();
    const anoActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth() + 1;

    // 4. Iteramos por cada mes desde la fecha de inicio
    for (let ano = fechaInicio.getFullYear(); ano <= anoActual; ano++) {
      const mesInicial =
        ano === fechaInicio.getFullYear() ? fechaInicio.getMonth() + 1 : 1;
      const mesFinal = ano === anoActual ? mesActual : 12;

      for (let mes = mesInicial; mes <= mesFinal; mes++) {
        const mesStr = mes.toString().padStart(2, "0");
        const collectionPath = `pedidos/${ano}/${mesStr}`;

        try {
          const pedidosRef = collection(firestore, collectionPath);
          const querySnapshot = await getDocs(pedidosRef);

          for (const doc of querySnapshot.docs) {
            const docData = doc.data();

            if (!docData.pedidos || !Array.isArray(docData.pedidos)) {
              continue;
            }

            // 5. Revisamos cada pedido del mes
            for (const pedido of docData.pedidos) {
              if (!pedido.fecha) continue;

              // Convertir la fecha del pedido a Date para comparar
              const [diaPedido, mesPedido, anoPedido] = pedido.fecha.split("/");
              const fechaPedido = new Date(
                parseInt(anoPedido),
                parseInt(mesPedido) - 1,
                parseInt(diaPedido)
              );

              // Solo incluir pedidos desde la fecha de inicio de la campaña
              if (fechaPedido >= fechaInicio) {
                todosPedidos.push(pedido);

                // Verificar si este pedido usó algún cupón de la campaña
                if (pedido.couponCodes) {
                  const codigosUsados = pedido.couponCodes.filter((cupon) =>
                    codigosCampana.includes(cupon)
                  );

                  if (codigosUsados.length > 0) {
                    codigosUsados.forEach((codigo) =>
                      cuponesEncontrados.add(codigo)
                    );
                    pedidosConCupon.push(pedido);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error("Error procesando mes:", mesStr, error);
        }
      }
    }

    return {
      todosPedidos,
      pedidosConCupon,
      codigosCampana,
    };
  } catch (error) {
    console.error("Error al obtener los pedidos:", error);
    throw error;
  }
};

export const calcularEstadisticasPedidos = (
  todosPedidos: Pedido[],
  pedidosConCupon: Pedido[]
) => {
  // console.log("=== DEBUG ESTADÍSTICAS ===");
  // console.log("Total pedidos encontrados:", todosPedidos.length);
  // console.log("Pedidos con cupón:", pedidosConCupon.length);

  // Total de cupones usados
  const totalCupones = pedidosConCupon.reduce(
    (sum, pedido) => sum + (pedido.couponCodes?.length || 0),
    0
  );

  // Ordenar todos los pedidos por fecha
  const pedidosOrdenados = [...todosPedidos].sort((a, b) => {
    const fechaA = new Date(a.fecha.split("/").reverse().join("-"));
    const fechaB = new Date(b.fecha.split("/").reverse().join("-"));
    return fechaA.getTime() - fechaB.getTime();
  });

  // Mapa para trackear clientes y sus compras
  const clientesUnicos = new Map<
    string,
    {
      primeraCompraConCupon: string; // Fecha de primera compra con cupón
      comprasAnteriores: string[]; // Compras antes de usar cupón
      comprasPosteriores: string[]; // Compras después de usar cupón
      fechasPedidos: string[]; // Todas las fechas de pedidos
    }
  >();

  // Primero procesamos los pedidos con cupón para identificar la fecha de activación
  pedidosConCupon.forEach((pedido) => {
    if (!pedido.telefono) return;

    if (!clientesUnicos.has(pedido.telefono)) {
      clientesUnicos.set(pedido.telefono, {
        primeraCompraConCupon: pedido.fecha,
        comprasAnteriores: [],
        comprasPosteriores: [],
        fechasPedidos: [pedido.fecha],
      });
      // console.log("Nuevo cliente con cupón:", {
      //   telefono: pedido.telefono,
      //   fecha: pedido.fecha,
      // });
    } else {
      // Si ya existe el cliente, actualizamos la primera compra con cupón si esta es anterior
      const cliente = clientesUnicos.get(pedido.telefono)!;
      const fechaActual = new Date(pedido.fecha.split("/").reverse().join("-"));
      const fechaPrimeraCupon = new Date(
        cliente.primeraCompraConCupon.split("/").reverse().join("-")
      );

      if (fechaActual < fechaPrimeraCupon) {
        cliente.primeraCompraConCupon = pedido.fecha;
      }
      cliente.fechasPedidos.push(pedido.fecha);
    }
  });

  // Ahora procesamos todos los pedidos para identificar compras anteriores y posteriores
  pedidosOrdenados.forEach((pedido) => {
    if (!pedido.telefono) return;

    const clienteInfo = clientesUnicos.get(pedido.telefono);
    if (clienteInfo) {
      const fechaPedido = new Date(pedido.fecha.split("/").reverse().join("-"));
      const fechaPrimeraCupon = new Date(
        clienteInfo.primeraCompraConCupon.split("/").reverse().join("-")
      );

      // Si el pedido es anterior a la primera compra con cupón
      if (fechaPedido < fechaPrimeraCupon) {
        clienteInfo.comprasAnteriores.push(pedido.fecha);
        // console.log("Compra anterior encontrada:", {
        //   telefono: pedido.telefono,
        //   fechaPedido: pedido.fecha,
        //   fechaPrimeraCupon: clienteInfo.primeraCompraConCupon,
        // });
      }
      // Si el pedido es posterior a la primera compra con cupón y no es un pedido con cupón
      else if (
        fechaPedido > fechaPrimeraCupon &&
        !pedidosConCupon.some(
          (p) => p.fecha === pedido.fecha && p.telefono === pedido.telefono
        )
      ) {
        clienteInfo.comprasPosteriores.push(pedido.fecha);
        // console.log("Compra posterior encontrada:", {
        //   telefono: pedido.telefono,
        //   fechaPedido: pedido.fecha,
        //   fechaPrimeraCupon: clienteInfo.primeraCompraConCupon,
        // });
      }
    }
  });

  // Categorías mutuamente excluyentes
  let soloUsaronCupon = 0;
  let recurrentesNoVolvieron = 0;
  let recurrentesVolvieron = 0;
  let nuevosVolvieron = 0;
  let montoTotalRecomprasDeNuevos = 0;

  clientesUnicos.forEach((cliente, telefono) => {
    const eraRecurrente = cliente.comprasAnteriores.length > 0;
    const volvioAComprar = cliente.comprasPosteriores.length > 0;

    if (eraRecurrente && volvioAComprar) {
      recurrentesVolvieron++;
    } else if (eraRecurrente && !volvioAComprar) {
      recurrentesNoVolvieron++;
    } else if (!eraRecurrente && volvioAComprar) {
      nuevosVolvieron++;
      // console.log("=== DETALLE CLIENTE NUEVO QUE VOLVIÓ ===");
      // console.log(`Cliente ${telefono}:`);
      // console.log("Primera compra (con cupón):", cliente.primeraCompraConCupon);
      // console.log("Compras posteriores:", cliente.comprasPosteriores);

      // Buscamos los pedidos posteriores y sumamos sus totales
      const todosLosPedidosCliente = todosPedidos
        .filter((p) => p.telefono === telefono)
        .sort(
          (a, b) =>
            new Date(a.fecha.split("/").reverse().join("-")).getTime() -
            new Date(b.fecha.split("/").reverse().join("-")).getTime()
        );

      todosLosPedidosCliente.forEach((pedido) => {
        // Si es un pedido posterior al uso del cupón
        if (cliente.comprasPosteriores.includes(pedido.fecha)) {
          montoTotalRecomprasDeNuevos += pedido.total;
          // console.log(
          //   `Sumando recompra: $${pedido.total} (Fecha: ${pedido.fecha})`
          // );
        }

        // console.log("=== PEDIDO ===");
        // console.log({
        //   ...pedido,
        //   esPedidoConCuponCampaña: pedidosConCupon.some(
        //     (p) => p.fecha === pedido.fecha && p.telefono === pedido.telefono
        //   ),
        // });
        // console.log("Detalle Items:");
        if (pedido.detallePedido) {
          pedido.detallePedido.forEach((item, index) => {
            // console.log(`Item ${index + 1}:`, item);
          });
        }
        // console.log("------------------------");
      });
      // console.log("===============================");
    } else {
      soloUsaronCupon++;
    }
  });

  // console.log("=== ESTADÍSTICAS FINALES ===", {
  //   totalClientes: clientesUnicos.size,
  //   soloUsaronCupon,
  //   recurrentesNoVolvieron,
  //   recurrentesVolvieron,
  //   nuevosVolvieron,
  //   montoTotalRecomprasDeNuevos,
  // });

  return {
    totalPedidos: pedidosConCupon.length,
    totalCupones,
    promedioCuponesPorPedido:
      pedidosConCupon.length > 0 ? totalCupones / pedidosConCupon.length : 0,
    montoTotal: pedidosConCupon.reduce((sum, pedido) => sum + pedido.total, 0),
    montoSinDescuento: pedidosConCupon.reduce(
      (sum, pedido) => sum + pedido.subTotal,
      0
    ),
    descuentoTotal: pedidosConCupon.reduce(
      (sum, pedido) => sum + (pedido.subTotal - pedido.total),
      0
    ),
    promedioDescuento:
      pedidosConCupon.length > 0
        ? pedidosConCupon.reduce(
            (sum, pedido) => sum + (pedido.subTotal - pedido.total),
            0
          ) / pedidosConCupon.length
        : 0,
    estadisticasClientes: {
      totalClientesUnicos: clientesUnicos.size,
      soloUsaronCupon,
      recurrentesNoVolvieron,
      recurrentesVolvieron,
      nuevosVolvieron,
      montoTotalRecomprasDeNuevos,
    },
  };
};

export const actualizarCostosCampana = async (
  titulo: string,
  costo: CostItem,
  isAdd: boolean = false
) => {
  try {
    const firestore = getFirestore();
    const voucherRef = doc(firestore, "vouchers", titulo);

    if (isAdd) {
      await updateDoc(voucherRef, {
        costos: arrayUnion(costo),
      });
    } else {
      await updateDoc(voucherRef, {
        costos: costo,
      });
    }
  } catch (error) {
    console.error("Error actualizando costos:", error);
    throw error;
  }
};

export const obtenerCostosCampana = async (
  titulo: string
): Promise<CostItem[]> => {
  try {
    const firestore = getFirestore();
    const voucherRef = doc(firestore, "vouchers", titulo);
    const voucherDoc = await getDoc(voucherRef);

    if (voucherDoc.exists()) {
      const data = voucherDoc.data();
      return data.costos || [];
    }
    return [];
  } catch (error) {
    console.error("Error al cargar los costos:", error);
    throw error;
  }
};

export const generarCodigos = async (
  cantidad: number,
  esGratis: boolean = false
): Promise<Codigo[]> => {
  const codigosGenerados: Codigo[] = [];

  try {
    for (let i = 0; i < cantidad; i++) {
      const codigo = Math.random().toString(36).substring(2, 7).toUpperCase();
      const nuevoCodigo: Codigo = {
        codigo,
        estado: "disponible",
        num: i + 1,
        gratis: esGratis, // Añadir la propiedad gratis a cada código
      };
      codigosGenerados.push(nuevoCodigo);
    }
    return codigosGenerados;
  } catch (error) {
    console.error("Error al generar y almacenar los códigos:", error);
    throw error;
  }
};

export const crearVoucher = async (
  titulo: string,
  fecha: string,
  cant: number,
  esGratis: boolean = false // El parámetro se pasa a generarCodigos
): Promise<void> => {
  const firestore = getFirestore();
  const voucherDocRef = doc(firestore, "vouchers", titulo);

  try {
    // console.log(
    //   `Iniciando generación de ${cant} códigos ${esGratis ? "gratuitos" : "normales"}...`
    // );
    // Pasar el parámetro esGratis a generarCodigos
    const codigos = await generarCodigos(cant, esGratis);
    // console.log(`Códigos generados exitosamente`);

    const docData = {
      titulo,
      fecha,
      codigos,
      creados: cant,
      usados: 0,
      // No se incluye gratis a nivel de documento
    };

    // console.log(`Intentando guardar en Firestore...`);
    // console.log(
    //   `Tamaño aproximado del documento: ${JSON.stringify(docData).length} bytes`
    // );

    await setDoc(voucherDocRef, docData);
    // console.log(`Documento guardado exitosamente`);
  } catch (error) {
    console.error("Error detallado al crear voucher:", error);
    // Re-lanzar el error con más información
    throw new Error(`Error al crear voucher: ${error.message || error}`);
  }
};

export interface VoucherTituloConFecha {
  titulo: string;
  fecha: string;
  canjeados: number;
  usados: number;
  creados: number;
  group?: string;
  codigos: Codigo[];
}

export const obtenerTitulosVouchers = async (): Promise<
  VoucherTituloConFecha[]
> => {
  const firestore = getFirestore();
  const vouchersCollectionRef = collection(firestore, "vouchers");

  try {
    const querySnapshot = await getDocs(vouchersCollectionRef);
    const titulosConFecha: VoucherTituloConFecha[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      titulosConFecha.push({
        titulo: doc.id,
        fecha: data.fecha || "Fecha no disponible",
        canjeados: data.canjeados,
        usados: data.usados,
        creados: data.creados,
        codigos: data.codigos,
        group: data.group,
        gratis: data.gratis || false, // Obtener la propiedad gratis si existe, o false por defecto
      });
    });

    return titulosConFecha;
  } catch (error) {
    console.error("Error al obtener los títulos de vouchers:", error);
    throw error;
  }
};

export const canjearVoucher = async (codigo: string): Promise<boolean> => {
  const firestore = getFirestore();
  const vouchersCollectionRef = collection(firestore, "vouchers");

  try {
    const success = await runTransaction(firestore, async (transaction) => {
      const querySnapshot = await getDocs(vouchersCollectionRef);
      let voucherEncontrado = false;

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const codigos = data.codigos || [];

        const codigoIndex = codigos.findIndex(
          (c: Codigo) => c.codigo === codigo
        );

        if (codigoIndex !== -1) {
          if (codigos[codigoIndex].estado === "usado") {
            console.error("El voucher ya ha sido canjeado");
            return false;
          }

          codigos[codigoIndex].estado = "usado";

          const voucherDocRef = doc(firestore, "vouchers", docSnapshot.id);
          transaction.update(voucherDocRef, { codigos });

          voucherEncontrado = true;
          break;
        }
      }

      if (!voucherEncontrado) {
        console.error("No se encontró el voucher con el código proporcionado");
        return false;
      }

      return true;
    });

    return success;
  } catch (error) {
    console.error("Error al canjear el voucher:", error);
    throw error;
  }
};

export const actualizarVouchersUsados = async (
  titulo: string,
  cantidadUsados: number
): Promise<void> => {
  const firestore = getFirestore();
  const voucherDocRef = doc(firestore, "vouchers", titulo);

  try {
    await updateDoc(voucherDocRef, {
      usados: cantidadUsados,
    });
  } catch (error) {
    throw error;
  }
};

export const obtenerCodigosCampana = async (
  titulo: string
): Promise<Array<{ codigo: string; num: number }>> => {
  const firestore = getFirestore();
  const voucherDocRef = doc(firestore, "vouchers", titulo);

  try {
    const voucherDoc = await getDoc(voucherDocRef);
    if (voucherDoc.exists()) {
      const data = voucherDoc.data();
      return data.codigos || [];
    } else {
      return [];
    }
  } catch (error) {
    throw error;
  }
};

export const subirCodigosExistentes = async (
  codigos: string[]
): Promise<void> => {
  const firestore = getFirestore();
  const titulo = "baco";
  const voucherDocRef = doc(firestore, "vouchers", titulo);

  const usados = ["EA2E9", "HO77E", "69198", "19XUO"];

  try {
    const batch = codigos.map((codigo, index) => ({
      codigo,
      estado: usados.includes(codigo) ? "usado" : "disponible",
      num: index + 1,
    }));

    const voucherDoc = await getDoc(voucherDocRef);
    if (!voucherDoc.exists()) {
      await setDoc(voucherDocRef, {
        codigos: batch,
        fecha: "24/08/2024",
        canjeados: 0,
        usados: 0,
        creados: codigos.length,
      });
    } else {
      await updateDoc(voucherDocRef, {
        codigos: arrayUnion(...batch),
        creados: (voucherDoc.data().creados || 0) + codigos.length,
      });
    }
  } catch (error) {
    throw error;
  }
};

export const obtenerCodigosOrdenados = async (): Promise<Codigo[]> => {
  const firestore = getFirestore();
  const codigosCollectionRef = collection(firestore, "codigos");

  try {
    const querySnapshot = await getDocs(codigosCollectionRef);
    const codigos: Codigo[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.codigo && data.num) {
        codigos.push({
          codigo: data.codigo,
          num: data.num,
          estado: data.estado,
        } as Codigo);
      }
    });

    codigos.sort((a, b) => a.num - b.num);

    return codigos;
  } catch (error) {
    throw error;
  }
};

export const moverCodigosARango = async (
  titulo: string,
  codigosSeleccionados: Codigo[]
) => {
  const db = getFirestore();

  try {
    const voucherRef = doc(db, "vouchers", titulo);
    const batch = writeBatch(db);
    const voucherDocSnapshot = await getDoc(voucherRef);
    let existingCodigos: Codigo[] = [];

    if (voucherDocSnapshot.exists()) {
      const data = voucherDocSnapshot.data();
      existingCodigos = data?.codigos || [];
    }

    batch.update(voucherRef, {
      codigos: [...existingCodigos, ...codigosSeleccionados],
    });

    for (const codigo of codigosSeleccionados) {
      const codigosSnapshot = await getDocs(collection(db, "codigos"));
      codigosSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.codigo === codigo.codigo) {
          batch.delete(doc.ref);
        }
      });
    }

    await batch.commit();
  } catch (error) {
    console.error("Error al mover códigos:", error);
  }
};

export const generarCodigosMixtos = async (
  cantidadGratis: number,
  cantidadNormales: number
): Promise<Codigo[]> => {
  const codigosGenerados: Codigo[] = [];

  try {
    // Primero generamos los códigos gratuitos
    for (let i = 0; i < cantidadGratis; i++) {
      const codigo = Math.random().toString(36).substring(2, 7).toUpperCase();
      const nuevoCodigo: Codigo = {
        codigo,
        estado: "disponible",
        num: i + 1,
        gratis: true, // Marcamos estos códigos como gratuitos
      };
      codigosGenerados.push(nuevoCodigo);
    }

    // Luego generamos los códigos normales
    for (let i = 0; i < cantidadNormales; i++) {
      const codigo = Math.random().toString(36).substring(2, 7).toUpperCase();
      const nuevoCodigo: Codigo = {
        codigo,
        estado: "disponible",
        num: cantidadGratis + i + 1, // Continuamos la numeración
        // No incluimos la propiedad gratis para los códigos normales
      };
      codigosGenerados.push(nuevoCodigo);
    }

    return codigosGenerados;
  } catch (error) {
    console.error("Error al generar y almacenar los códigos mixtos:", error);
    throw error;
  }
};

// Ahora creemos una función para crear un voucher con códigos mixtos
export const crearVoucherMixto = async (
  titulo: string,
  fecha: string,
  cantidadGratis: number,
  cantidadNormales: number
): Promise<void> => {
  const firestore = getFirestore();
  const voucherDocRef = doc(firestore, "vouchers", titulo);

  try {
    // console.log(
    //   `Iniciando generación de ${cantidadGratis} códigos gratuitos y ${cantidadNormales} códigos normales...`
    // );

    const codigos = await generarCodigosMixtos(
      cantidadGratis,
      cantidadNormales
    );
    // console.log(`Códigos generados exitosamente: ${codigos.length} en total`);

    const docData = {
      titulo,
      fecha,
      codigos,
      creados: cantidadGratis + cantidadNormales,
      usados: 0,
      tiposCodigos: {
        gratis: cantidadGratis,
        normales: cantidadNormales,
      },
    };

    // console.log(`Intentando guardar en Firestore...`);
    // console.log(
    //   `Tamaño aproximado del documento: ${JSON.stringify(docData).length} bytes`
    // );

    await setDoc(voucherDocRef, docData);
    // console.log(`Documento guardado exitosamente`);
  } catch (error) {
    console.error("Error detallado al crear voucher mixto:", error);
    throw new Error(`Error al crear voucher mixto: ${error.message || error}`);
  }
};
