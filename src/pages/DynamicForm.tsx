import { Formik, Form } from 'formik';

import formJson from '../data/custom-form.json';
import * as Yup from 'yup';
import { MySelect, MyTextInput } from '../components/forms';
import { CartShop, MenuGallery } from '../components/menuShop';
import { useState } from 'react';
import { PedidosWeb } from '../components/forms/PedidosWeb';

const initialValues: { [key: string]: any } = {};
const requiredFields: { [key: string]: any } = {};

for (const input of formJson) {
  initialValues[input.name] = input.value;

  if (!input.validations) continue;

  let schema = Yup.string();

  for (const rule of input.validations) {
    if (rule.type === 'required') {
      schema = schema.required(rule.message);
    }

    if (rule.type === 'minLength') {
      schema = schema.min((rule as any).value || 1, rule.message);
    }

    if (rule.type === 'email') {
      schema = schema.email(rule.message);
    }

    // otras reglas..
  }

  requiredFields[input.name] = schema;
}

const validationSchema = Yup.object().shape({ ...requiredFields });

interface ClienteProps {
  aclaraciones: string;
  direccion: string;
  hora: string;
  id: string;
  metodoPago: string;
  telefono: string;
  total: number;
}

export interface BurgerProps {
  burger: string;
  quantity: number;
  toppings: string[];
  priceBurger: number;
  priceToppings: number;
  subTotal: number;
}

export const DynamicForm = () => {
  const [dataBurger, setDataBurger] = useState({
    burgerSelection: [] as BurgerProps[],
  });

  const [seccionActiva, setSeccionActiva] = useState('elaborar');

  // si es el formulario de la seccion burgers
  const handleFormBurger = (values: any) => {
    const burger = {
      burger: values.burger,
      toppings: values.toppings,
      quantity: values.quantity,
      priceBurger: values.priceBurger,
      priceToppings: values.priceToppings,
      subTotal: (values.priceBurger + values.priceToppings) * values.quantity,
    };

    setDataBurger((prevData) => ({
      ...prevData,
      burgerSelection: [...prevData.burgerSelection, burger],
    }));
  };

  const handlePedidoWebAnalizado = (detallesPedido: any) => {
    // Aquí puedes agregar lógica adicional según sea necesario

    console.log(detallesPedido);
  };
  console.log(dataBurger);

  return (
    <div className='grid grid-cols-2 md:grid-cols-2 gap-4"'>
      {dataBurger && <CartShop burgerSelection={dataBurger.burgerSelection} />}
      <MenuGallery handleFormBurger={handleFormBurger} />

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={(values, { resetForm }) => {
          const subTotal = dataBurger.burgerSelection.reduce(
            (acc, burger) => acc + burger.subTotal,
            0
          );

          const orderDetail = {
            ...values,
            subTotal,
            total: subTotal + values.envio,
            burgerSelection: dataBurger.burgerSelection,
          };

          console.log(orderDetail);

          setDataBurger({ burgerSelection: [] });

          resetForm();
        }}
      >
        {(formik) => (
          <Form noValidate className="grid z-0 h-max group ml-2 bg-gray-800">
            <div className="flex flex-col">
              <div className="flex justify-center my-2">
                <div
                  className={`mx-2 py-2 px-4 ${
                    seccionActiva === 'elaborar' ? 'bg-blue-500' : 'bg-gray-300'
                  } text-white font-semibold rounded`}
                  onClick={() => setSeccionActiva('elaborar')}
                >
                  TOMAR PEDIDO
                </div>
                <div
                  className={`mx-2 py-2 px-4 ${
                    seccionActiva === 'hechos' ? 'bg-blue-500' : 'bg-gray-300'
                  } text-white font-semibold rounded`}
                  onClick={() => setSeccionActiva('hechos')}
                >
                  HECHOS POR LA WEB
                </div>
              </div>
              {seccionActiva === 'elaborar' ? (
                formJson.map(({ type, name, placeholder, label, options }) => {
                  if (type === 'text' || type === 'tel' || type === 'number') {
                    return (
                      <MyTextInput
                        key={name}
                        type={type as any}
                        name={name}
                        label={label}
                      />
                    );
                  } else if (type === 'select') {
                    return (
                      <MySelect key={name} label={label} name={name}>
                        <option defaultValue={'efectivo'}>
                          Metodo de pago
                        </option>
                        {options?.map(({ id, label }) => (
                          <option
                            className="h-16 hover:bg-red-700"
                            key={id}
                            value={id}
                            defaultValue={'efectivo'}
                          >
                            {label}
                          </option>
                        ))}
                      </MySelect>
                    );
                  }

                  throw new Error(`Invalid type: ${type}`);
                })
              ) : (
                <PedidosWeb onPedidoAnalizado={handlePedidoWebAnalizado} />
              )}
            </div>
            <button
              className="text-4xl hover:bg-emerald-700 w-34 h-24 bg-emerald-400 text-white active:bg-emerald-600 font-bold uppercase text-sm px-4 py-2 rounded shadow-lg hover:shadow-xl outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
              type="submit"
            >
              Guardar
            </button>
            ;
          </Form>
        )}
      </Formik>
    </div>
  );
};
