import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { MercadoPagoConfig, Payment } from "mercadopago";

admin.initializeApp();
exports.transferToAlias = functions.https.onCall(async (request) => {
  // Extraer los datos de autenticación y los datos de la solicitud
  const { data } = request;
  // Verificar si el usuario está autenticado
  // if (!auth) {
  //   console.log("Usuario no autenticado");
  //   throw new functions.https.HttpsError(
  //     "unauthenticated",
  //     "El usuario debe estar autenticado para realizar una transferencia.",
  //   );
  // }

  const { amount, alias } = data;

  // Validación de los datos de la transferencia
  if (!amount || isNaN(amount)) {
    console.log("Monto de transferencia no válido", { amount });
    throw new functions.https.HttpsError(
      "invalid-argument",
      "El monto de la transferencia no es válido.",
    );
  }

  if (!alias || typeof alias !== "string") {
    console.log("Alias no válido", { alias });
    throw new functions.https.HttpsError(
      "invalid-argument",
      "El alias proporcionado no es válido.",
    );
  }

  try {
    console.log("Configurando MercadoPago");
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
    });

    // Validación del accessToken
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      console.error(
        "AccessToken no está configurado en las variables de entorno",
      );
      throw new functions.https.HttpsError(
        "internal",
        "El token de acceso de MercadoPago no está configurado.",
      );
    }

    const payment = new Payment(client);

    console.log("Creando pago en MercadoPago");
    const paymentData = {
      additional_info: {
        items: [
          {
            id: "MLB2907679857",
            title: "Point Mini",
            quantity: 1,
            unit_price: 58.8,
          },
        ],
      },
      payer: {
        email: "tomychi352@gmail.com",
      },
      transaction_amount: 100,
      installments: 1,
      payment_method_id: "pix",
    };

    const result = await payment.create({ body: paymentData });
    console.log("Pago creado exitosamente", { result });

    console.log("Transferencia completada exitosamente");
    return { success: true, paymentId: result.id };
  } catch (error) {
    console.error(
      "Error en transferencia MercadoPago:",
      JSON.stringify(error, null, 2),
    );

    // Verificar si el error tiene una propiedad `message` y `cause`
    if (error instanceof Error) {
      if (error.message.includes("payment_method_id")) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "El método de pago proporcionado no es válido.",
        );
      }

      // Si existe un array `cause` en el error, podemos proporcionar más detalles
      const errorCause = (error as any).cause;
      if (Array.isArray(errorCause) && errorCause.length > 0) {
        const causeDescription =
          errorCause[0].description || "Error desconocido";
        throw new functions.https.HttpsError(
          "internal",
          `No se pudo procesar la transferencia: ${causeDescription}`,
        );
      }

      throw new functions.https.HttpsError(
        "internal",
        `No se pudo procesar la transferencia: ${error.message}`,
      );
    } else if (typeof error === "object" && error !== null) {
      const errorObj = error as any;

      // Extraer detalles adicionales del error si están disponibles
      const message = errorObj.message || "Error desconocido";
      const cause =
        errorObj.cause && Array.isArray(errorObj.cause)
          ? errorObj.cause[0]?.description
          : null;

      throw new functions.https.HttpsError(
        "internal",
        `No se pudo procesar la transferencia: ${cause || message}`,
      );
    } else {
      throw new functions.https.HttpsError(
        "internal",
        "No se pudo procesar la transferencia: error desconocido",
      );
    }
  }
});
