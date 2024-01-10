import * as Yup from 'yup';

const validations = (total: number) =>
  Yup.object({
    fullName: Yup.string()
      .required('Necesitamos tu nombre')
      .min(3, `Debe de tener 3 caracteres o más`),

    phone: Yup.string()
      .required('Necesitamos un contacto')
      .min(6, 'Debe de tener 6 caracteres o más'),

    deliveryMethod: Yup.string()
      .required('Método de entrega es obligatorio')
      .oneOf(['delivery', 'retiro']),

    address: Yup.string().when('deliveryMethod', {
      is: 'delivery',
      then: () =>
        Yup.string()
          .min(5, 'Debe ser una dirección válida')
          .required('Dirección obligatoria'),
    }),

    floorAndNumber: Yup.string().when('isFlat', {
      is: true,
      then: () =>
        Yup.string()
          .min(2, 'Debe ser una piso y número válido')
          .required('Piso y número obligatorio'),
    }),

    paymentMethod: Yup.string()
      .required('Método de pago es obligatorio')
      .oneOf(['mercadopago', 'efectivo']),

    money: Yup.number().when('paymentMethod', {
      is: 'efectivo',
      then: () =>
        Yup.number()
          .min(total, `El monto debe ser mayor o igual a ${total}`)
          .required('El monto es obligatorio'),
    }),
  });

export default validations;
