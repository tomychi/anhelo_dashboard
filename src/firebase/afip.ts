import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  runTransaction,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { obtenerFechaActual, obtenerHoraActual } from "../helpers/dateToday";
import { Unsubscribe } from "redux";
import { DateValueType } from "react-tailwindcss-datepicker";
import store from "../redux/configureStore";
import { marcarPedidoComoFacturado } from "./ReadData";

interface AfipDetailProps {
  monto: number;
  aliasCuenta: string;
}

export const UploadAfip = async (
  afipDetail: AfipDetailProps
): Promise<string> => {
  const afipId = uuidv4();

  const firestore = getFirestore();
  const fechaFormateada = obtenerFechaActual();
  const [, mes, anio] = fechaFormateada.split("/");
  const pedidosCollectionRef = collection(firestore, "afip", anio, mes);
  const pedidoDocRef = doc(pedidosCollectionRef, "datos");

  try {
    await runTransaction(firestore, async (transaction) => {
      const docSnapshot = await transaction.get(pedidoDocRef);
      const existingData = docSnapshot.exists() ? docSnapshot.data() : {};

      // Obtener los montos acumulados para el alias de la cuenta bancaria
      const montosPorAlias = existingData.montosPorAlias || {};

      // Sumar el monto del pedido al valor existente para el alias de la cuenta bancaria en el mismo mes
      montosPorAlias[afipDetail.aliasCuenta] =
        (montosPorAlias[afipDetail.aliasCuenta] || 0) + afipDetail.monto;

      // Actualizar los datos en Firestore
      transaction.set(
        pedidoDocRef,
        {
          montosPorAlias,
        },
        { merge: true }
      );
    });

    // console.log("Pedido subido correctamente");
    return afipId;
  } catch (error) {
    console.error("Error al subir el pedido:", error);
    throw error;
  }
};

export const obtenerMontosPorAlias = (
  anio: string,
  mes: string,
  callback: (montos: Record<string, number>) => void
): Unsubscribe => {
  const firestore = getFirestore();
  const pedidosCollectionRef = collection(firestore, "afip", anio, mes);
  const pedidoDocRef = doc(pedidosCollectionRef, "datos");

  // Escuchar cambios en el documento
  return onSnapshot(
    pedidoDocRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data && data.montosPorAlias) {
          // Si el documento existe y contiene montos por alias, llamar al callback con esos montos
          callback(data.montosPorAlias as Record<string, number>);
        } else {
          // Si el documento existe pero no contiene montos por alias, llamar al callback con un objeto vacío
          callback({});
        }
      } else {
        // Si el documento no existe, llamar al callback con un objeto vacío
        callback({});
      }
    },
    (error) => {
      console.error("Error al obtener los montos por alias:", error);
    }
  );
};

// Interfaz para los datos de factura
export interface FacturaData {
  id: string;
  fecha: string;
  hora: string;
  cae: string;
  caeFchVto: string;
  tipoComprobante: string;
  puntoVenta: string;
  numeroComprobante: string;
  cuit: string;
  importeTotal: string;
  importeNeto: string;
  importeTrib: string;
  documentoReceptor: number;
  numeroReceptor: number;
  pedidoId: string | null;
  pedidoFecha: string | null;
  origenGeneracion: string; // "pedido" o "monto"
}

/**
 * Guarda una factura en la colección "facturas"
 * @param facturaData Datos de la factura a guardar
 * @returns Promise<boolean> True si la operación fue exitosa
 */
export const guardarFactura = async (
  facturaData: FacturaData
): Promise<boolean> => {
  try {
    const firestore = getFirestore();
    const { fecha } = facturaData;
    const [dia, mes, anio] = fecha.split("/");

    // Obtener el estado de autenticación del store de Redux para manejar rutas específicas por empresa
    const auth = store.getState().auth;
    const tipoUsuario = auth?.tipoUsuario;
    const empresaId =
      tipoUsuario === "empresa"
        ? auth.usuario?.id
        : tipoUsuario === "empleado"
          ? auth.usuario?.empresaId
          : undefined;

    // Obtener el nombre de la empresa para identificar si es ANHELO
    let empresaNombre = "";
    if (tipoUsuario === "empresa" && auth.usuario?.datosGenerales) {
      empresaNombre = auth.usuario.datosGenerales.nombre || "";
    }

    // Determinar si es ANHELO basado en el nombre de la empresa
    const isAnhelo = empresaNombre === "ANHELO";

    // Construir la ruta correcta basada en la empresa
    let facturaDocRef;
    if (isAnhelo) {
      // Ruta original para ANHELO
      facturaDocRef = doc(firestore, "facturas", anio, mes, dia);
    } else {
      // Ruta para otras empresas en absoluteClientes
      facturaDocRef = doc(
        firestore,
        "absoluteClientes",
        empresaId,
        "facturas",
        anio,
        mes,
        dia
      );
    }

    return await runTransaction(firestore, async (transaction) => {
      // Obtener el documento actual o crear uno vacío si no existe
      const facturaDoc = await transaction.get(facturaDocRef);
      const facturasDelDia = facturaDoc.exists()
        ? facturaDoc.data()?.facturas || []
        : [];

      // Agregar la nueva factura al arreglo
      facturasDelDia.push(facturaData);

      // Actualizar el documento
      transaction.set(facturaDocRef, { facturas: facturasDelDia });

      // Si la factura está relacionada con un pedido, actualizar el pedido también
      if (facturaData.pedidoId && facturaData.pedidoFecha) {
        await marcarPedidoComoFacturado(
          facturaData.pedidoId,
          facturaData.pedidoFecha,
          {
            cuit: facturaData.cuit,
            cae: facturaData.cae,
            fechaEmision: new Date().toISOString(),
            tipoComprobante: facturaData.tipoComprobante,
            puntoVenta: facturaData.puntoVenta,
            numeroComprobante: facturaData.numeroComprobante,
            documentoReceptor: facturaData.documentoReceptor,
            numeroReceptor: facturaData.numeroReceptor,
          }
        );
      }

      // console.log("Factura guardada correctamente en la colección 'facturas'");
      return true;
    });
  } catch (error) {
    console.error("Error al guardar la factura:", error);
    return false;
  }
};

/**
 * Obtiene las facturas dentro de un rango de fechas
 * @param valueDate Objeto con startDate y endDate
 * @returns Promise<FacturaData[]> Arreglo de facturas
 */
export const obtenerFacturasPorRango = async (
  valueDate: DateValueType
): Promise<FacturaData[]> => {
  return new Promise((resolve, reject) => {
    try {
      if (!valueDate || !valueDate.startDate || !valueDate.endDate) {
        throw new Error("Fecha de inicio o fin no especificada.");
      }

      const { startDate, endDate } = valueDate;
      const firestore = getFirestore();

      // Obtener el estado de autenticación del store de Redux
      const auth = store.getState().auth;
      const tipoUsuario = auth?.tipoUsuario;
      const empresaId =
        tipoUsuario === "empresa"
          ? auth.usuario?.id
          : tipoUsuario === "empleado"
            ? auth.usuario?.empresaId
            : undefined;

      // Determinar si es ANHELO
      let empresaNombre = "";
      if (tipoUsuario === "empresa" && auth.usuario?.datosGenerales) {
        empresaNombre = auth.usuario.datosGenerales.nombre || "";
      }
      const isAnhelo = empresaNombre === "ANHELO";

      const allData: { [key: string]: FacturaData[] } = {};

      const getDataForDate = async (date: Date) => {
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");

        // Construir la ruta correcta basada en la empresa
        let docRef;
        if (isAnhelo) {
          // Ruta original para ANHELO
          docRef = doc(firestore, "facturas", year, month, day);
        } else {
          // Ruta para otras empresas en absoluteClientes
          docRef = doc(
            firestore,
            "absoluteClientes",
            empresaId,
            "facturas",
            year,
            month,
            day
          );
        }

        try {
          const docSnapshot = await getDoc(docRef);
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            allData[`${year}-${month}-${day}`] = data.facturas || [];
          } else {
            allData[`${year}-${month}-${day}`] = [];
          }
        } catch (error) {
          console.error(
            `Error al obtener las facturas para la fecha ${year}-${month}-${day}:`,
            error
          );
          allData[`${year}-${month}-${day}`] = [];
        }
      };

      const datesInRange = [];
      const currentDate = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T00:00:00`);

      while (currentDate <= end) {
        datesInRange.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const getDataPromises = datesInRange.map((date) => getDataForDate(date));

      Promise.all(getDataPromises)
        .then(() => {
          const mergedData = Object.values(allData).reduce(
            (merged, data) => [...merged, ...data],
            []
          );
          // Ordenar por fecha y hora descendente (más recientes primero)
          const sortedData = mergedData.sort((a, b) => {
            const dateA = new Date(
              a.fecha.split("/").reverse().join("-") + "T" + a.hora
            );
            const dateB = new Date(
              b.fecha.split("/").reverse().join("-") + "T" + b.hora
            );
            return dateB.getTime() - dateA.getTime();
          });

          resolve(sortedData);
        })
        .catch((error) => {
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Función para facturar un pedido existente
 * Guarda los datos de facturación en el pedido y crea un registro en la colección facturas
 */
export const facturarPedido = async (
  pedidoId: string,
  fecha: string,
  datosFacturacion: any
): Promise<boolean> => {
  try {
    // Primero marcamos el pedido como facturado (usando la función existente)
    const resultado = await marcarPedidoComoFacturado(
      pedidoId,
      fecha,
      datosFacturacion
    );

    if (!resultado) {
      throw new Error("Error al marcar el pedido como facturado");
    }

    // Ahora obtenemos los datos completos del pedido
    const [dia, mes, anio] = fecha.split("/");
    const firestore = getFirestore();
    const pedidoDocRef = doc(firestore, "pedidos", anio, mes, dia);
    const pedidoDoc = await getDoc(pedidoDocRef);

    if (!pedidoDoc.exists()) {
      throw new Error("No se encontró el documento del pedido");
    }

    const pedidos = pedidoDoc.data()?.pedidos || [];
    const pedido = pedidos.find((p: any) => p.id === pedidoId);

    if (!pedido) {
      throw new Error("No se encontró el pedido especificado");
    }

    // Crear la estructura de datos para la factura
    const facturaData: FacturaData = {
      id: `factura-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ID único
      fecha: obtenerFechaActual(),
      hora: obtenerHoraActual(),
      cae: datosFacturacion.cae,
      caeFchVto: datosFacturacion.caeFchVto || "",
      tipoComprobante: datosFacturacion.tipoComprobante,
      puntoVenta: datosFacturacion.puntoVenta,
      numeroComprobante: datosFacturacion.numeroComprobante,
      cuit: datosFacturacion.cuit,
      importeTotal: pedido.total ? pedido.total.toString() : "0",
      importeNeto: (pedido.total / 1.21).toFixed(2),
      importeTrib: "0.00",
      documentoReceptor: datosFacturacion.documentoReceptor || 99,
      numeroReceptor: datosFacturacion.numeroReceptor || 0,
      pedidoId: pedidoId,
      pedidoFecha: fecha,
      origenGeneracion: "pedido",
    };

    // Guardar la factura en la nueva colección
    await guardarFactura(facturaData);

    return true;
  } catch (error) {
    console.error("Error en facturarPedido:", error);
    return false;
  }
};

/**
 * Función para guardar facturas generadas por monto (sin pedido asociado)
 */
export const guardarFacturaPorMonto = async (
  facturaData: Omit<
    FacturaData,
    "id" | "fecha" | "hora" | "pedidoId" | "pedidoFecha" | "origenGeneracion"
  >
): Promise<boolean> => {
  try {
    // Completar los datos faltantes
    const facturaCompleta: FacturaData = {
      ...facturaData,
      id: `factura-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ID único
      fecha: obtenerFechaActual(),
      hora: obtenerHoraActual(),
      pedidoId: null,
      pedidoFecha: null,
      origenGeneracion: "monto",
    };

    // Guardar la factura en la colección
    return await guardarFactura(facturaCompleta);
  } catch (error) {
    console.error("Error al guardar factura por monto:", error);
    return false;
  }
};
