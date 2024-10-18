import * as functions from 'firebase-functions/v2';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import {
  calcularCostoHamburguesa,
  ReadData,
  ReadMateriales,
  updateOrderStatus,
  UploadOrder,
} from './database';

import {
  obtenerHoraActual,
  extractCoordinates,
  obtenerFechaActual,
  cleanPhoneNumber,
} from './helpers';
import { ItemProps, ToppingsProps } from './types';

// Inicializa el cliente con el token de acceso
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '', // Accede al token desde variables de entorno
  options: {
    timeout: 5000,
  },
});

exports.createPreference = functions.https.onCall(async (request) => {
  try {
    const { data } = request;

    const { values, cart, mapUrl, couponCodes } = data;

    const envio = Number(data.envio) || 0;
    const discountedTotal = Number(data.discountedTotal) || 0;

    console.log(couponCodes);

    // Calculamos el total que incluye el discountedTotal y el envio
    const totalAmount = Number(discountedTotal) + Number(envio);

    // Configuración de los ítems
    const items = [
      {
        id: 'total-amount', // ID único para el total
        title: 'Total del Pedido', // Título descriptivo del total
        unit_price: totalAmount, // TotalAmount como el precio unitario
        quantity: 1, // Cantidad siempre 1 ya que es el total del pedido
        currency_id: 'ARS', // Moneda
        description: 'Total a pagar por el pedido', // Descripción
        category_id: 'pedido', // Categoría
      },
    ];

    // Agregar el costo de envío como un ítem separado
    // items.push({
    //   id: "shipping-cost", // Agregar un ID único para el costo de envío
    //   title: "Costo de Envío",
    //   unit_price: envio,
    //   quantity: 1,
    //   currency_id: "ARS",
    //   description: "Costo de envío para el pedido",
    //   category_id: "envio",
    // });

    const preferenceData = {
      items: items,
      back_urls: {
        success: 'https://onlyanhelo.com/feedback?status=success',
        failure: 'https://onlyanhelo.com/feedback?status=failure',
        pending: 'https://onlyanhelo.com/feedback?status=pending',
      },
      auto_return: 'approved',
      statement_descriptor: 'ANHELO', // Nombre personalizado en el estado de cuenta
    };

    // Crear la preferencia con MercadoPago
    const preference = new Preference(client);
    const response = await preference.create({ body: preferenceData });

    // Verificar si la respuesta es exitosa y tiene un ID de preferencia
    if (response && response.id) {
      // Construimos el objeto orderDetail
      const coordinates = extractCoordinates(mapUrl);

      const materialesData = await ReadMateriales();
      const productsData = await ReadData();
      const formattedData = productsData.map((item) => ({
        description: item.description || '',
        img: item.img,
        name: item.name,
        price: item.price,
        type: item.type,
        ingredients: item.ingredients,
        costo: calcularCostoHamburguesa(materialesData, item.ingredients),
      }));

      const phone = String(values.phone) || '';

      const orderDetail = {
        envio,
        detallePedido: cart.map((item: ItemProps) => {
          const quantity = item.quantity !== undefined ? item.quantity : 0;

          const productoSeleccionado = formattedData.find(
            (producto) => producto.name === item.name
          );

          const toppingsSeleccionados = item.toppings || [];
          let costoToppings = 0;

          toppingsSeleccionados.forEach((topping: ToppingsProps) => {
            const materialTopping = materialesData.find(
              (material) =>
                material.nombre.toLowerCase() === topping.name.toLowerCase()
            );

            if (materialTopping) {
              costoToppings += materialTopping.costo;
            }
          });

          const costoBurger = productoSeleccionado
            ? (productoSeleccionado.costo + costoToppings) * quantity
            : 0;

          return {
            burger: item.name, // Nombre de la hamburguesa
            toppings: item.toppings.map(
              (topping: ToppingsProps) => topping.name
            ), // Nombres de los toppings
            quantity: item.quantity, // Cantidad del ítem
            priceBurger: item.price, // Precio de la hamburguesa
            priceToppings: item.toppings.reduce(
              (total: number, topping: ToppingsProps) =>
                total + (topping.price || 0), // Precio total de los toppings seleccionados
              0
            ),
            subTotal: item.price * item.quantity, // Precio total de la hamburguesa * cantidad
            costoBurger, // Costo de la hamburguesa incluyendo toppings y cantidad
          };
        }),
        subTotal: values.subTotal,
        total: totalAmount,
        fecha: obtenerFechaActual(), // Asegúrate de que esta función devuelva la fecha en el formato deseado
        aclaraciones: values.references || '',
        metodoPago: values.paymentMethod,
        direccion: values.address,
        telefono: cleanPhoneNumber(phone), // Convierte a string
        hora: values.hora || obtenerHoraActual(),
        cerca: false, // Puedes ajustar esto según tus necesidades
        cadete: 'NO ASIGNADO',
        referencias: values.references,
        map: coordinates || [0, 0],
        ubicacion: mapUrl,
        elaborado: false,
      };

      await UploadOrder(orderDetail, response.id);

      return { id: response.id }; // Respuesta exitosa
    } else {
      console.error('Error: No se recibió un ID de preferencia válido.');
      throw new functions.https.HttpsError(
        'invalid-argument',
        'No se pudo crear la preferencia.'
      );
    }
  } catch (error) {
    console.error('Error al crear la preferencia:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error al crear la preferencia'
    );
  }
});

// Endpoint para verificar el estado de pago
exports.verifyPayment = functions.https.onCall(async (request) => {
  const { data } = request;
  const { paymentId, orderId } = data;

  try {
    // Verifica el estado del pago en MercadoPago
    const payment = new Payment(client);
    const response = await payment.get({ id: paymentId });

    const paymentStatus = response.status;

    // Si el pago ha sido aprobado
    if (paymentStatus === 'approved') {
      // Actualiza el estado del pedido en Firestore
      await updateOrderStatus(orderId, true); // Asegúrate de tener esta función implementada
      return {
        status: 'success',
        message: 'Pago aprobado y pedido actualizado correctamente.',
      };
    } else {
      return {
        status: paymentStatus,
        message: 'El pago no ha sido aprobado.',
      };
    }
  } catch (error) {
    console.error('Error al verificar el pago:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error al verificar el pago.'
    );
  }
});
