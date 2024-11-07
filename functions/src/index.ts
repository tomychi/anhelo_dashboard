import * as functions from 'firebase-functions/v2';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { v4 as uuidv4 } from 'uuid';

import {
  addTelefonoFirebase,
  calcularCostoHamburguesa,
  canjearVoucher,
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

    const { updatedValues: values, cart, mapUrl, couponCodes } = data;

    const phone = String(values.phone) || '';

    const envio = Number(data.envio) || 0;
    const discountedTotal = Number(data.discountedTotal) || 0;
    const orderId = uuidv4();

    const validacionCupones = await Promise.all(
      couponCodes.map(async (cupon: string) => {
        return await canjearVoucher(cupon); // canjearVoucher devuelve true o false
      })
    );

    console.log(validacionCupones);

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

    const preferenceData = {
      items: items,
      back_urls: {
        success: `https://onlyanhelo.com/success/${orderId}?status=success`,
        failure: 'https://onlyanhelo.com/feedback?status=failure',
        pending: 'https://onlyanhelo.com/feedback?status=pending',
      },
      auto_return: 'approved',
      notification_url:
        'https://us-central1-anhelo-4789d.cloudfunctions.net/receiveWebhook', // URL de tu función webhook
      statement_descriptor: 'ANHELO', // Nombre personalizado en el estado de cuenta
      external_reference: orderId, // Vincula el pedido con el payment
      payer: {
        phone: {
          number: cleanPhoneNumber(phone), // Número de teléfono del cliente
        },
      },
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

      await UploadOrder(orderDetail, orderId);

      await addTelefonoFirebase(phone, obtenerFechaActual());

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

exports.receiveWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const paymentData = req.body;

    console.log('paymentDataaaa', paymentData);
    if (paymentData.type === 'payment') {
      const paymentId = paymentData.data.id;

      const payment = new Payment(client);

      const paymentInfo = await payment.get({ id: paymentId });

      console.log('informacionnn', paymentInfo);

      const { external_reference, status, payer } = paymentInfo; // Obtén el orderId del external_reference
      console.log('cliente info', payer);
      if (status === 'approved') {
        // Usa el external_reference para encontrar el pedido y actualizar su estado
        if (external_reference) {
          await updateOrderStatus(external_reference, true);
        } else {
          console.error('Error: external_reference es undefined o inválido.');
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ message: 'Error processing webhook' });
  }
});
