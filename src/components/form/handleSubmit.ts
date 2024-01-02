const phone = '5493584306832';

const handleSubmit = (values, cart, total, envio) => {
  let message =
    `¡Hola! Quiero hacer un pedido:\n\n` +
    `- *Nombre:* ${values.fullName}\n` +
    `- *Teléfono:* ${values.phone}\n` +
    `- *Forma de entrega:* ${values.deliveryMethod}\n` +
    `${
      values.deliveryMethod === 'delivery'
        ? `- *Dirección:* ${values.address}\n` +
          `- *Piso y número:* ${values.floorAndNumber || 'no especificado'}\n` +
          `- *Referencias:* ${values.references || 'no especificado'}\n`
        : ''
    }` +
    `- *Forma de pago:* ${values.paymentMethod}\n` +
    `${
      values.paymentMethod === 'efectivo' ? `- *Monto:* $${values.money}\n` : ''
    }\n` +
    `Aquí está el detalle de mi pedido:\n\n`;

  let items = '';

  cart.forEach((item) => {
    items += `${item.quantity}x ${item.name}\n`;

    if (item.toppings.length > 0) {
      items += `Toppings:\n`;
      item.toppings.forEach((topping) => {
        items += `- ${topping.name}\n`;
      });
    }

    items += `: $ ${item.price}\n\n`;
  });

  items += `Subtotal: $ ${total}\n`;

  if (values.deliveryMethod === 'delivery') {
    items += `Costo de envío: $${envio}\n`;
    total += envio;
  }

  items += `TOTAL: $ ${total}\n\n`;

  message += items;
  message += 'Espero tu respuesta para confirmar mi pedido.';

  const encodedMessage = encodeURIComponent(message);

  const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;

  window.open(url, '_blank');
};

export default handleSubmit;
