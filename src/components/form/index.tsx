import { Form, Formik } from 'formik';
import MyTextInput from './MyTextInput';
import ArrowBack from '../back';
import MyRadioGroup from './MyRadioGroup';
import DeliveryDetails from './DeliveryDetails';
import validations from './validations';
import handleSubmit from './handleSubmit';
import fire from '../../assets/icon-fire.gif';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addLastCart, clearCart } from '../../redux/cart/cartSlice';
import { FormCustomProps } from '../../types/types';

const FormCustom = ({ cart, total }: FormCustomProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const formValidations = validations(total);
  const envio = 1000;
  return (
    <div className="flex mt-2  mr-4 min-h-screen  ml-4 flex-col">
      <ArrowBack />
      <Formik
        initialValues={{
          subTotal: total,
          fullName: '',
          phone: '',
          deliveryMethod: '',
          address: '',
          references: '',
          isFlat: false,
          floorAndNumber: '',
          paymentMethod: '',
          money: '',
        }}
        onSubmit={(values) => {
          handleSubmit(values, cart, total, envio);
          dispatch(addLastCart());
          dispatch(clearCart());

          navigate('/menu');
        }}
        validationSchema={formValidations}
      >
        {({ getFieldProps, isSubmitting }) => (
          <Form>
            <div className="flex flex-col mb-2">
              <a className="font-antonio mb-2 font-bold text-2xl">
                NOMBRE COMPLETO:
              </a>
              <MyTextInput
                name="fullName"
                type="text"
                placeholder="PARA CONOCERNOS..."
                autoComplete="name"
              />

              <a className="font-antonio mb-2 font-bold text-2xl">TELEFONO:</a>
              <MyTextInput
                name="phone"
                type="number"
                placeholder="PARA PODER CONTACTARNOS..."
                autoComplete="phone"
              />
              <a className="font-antonio mb-2 font-bold text-2xl">
                FORMA DE ENTREGA:
              </a>
              <div className="flex flex-row md:w-6/12 justify-between">
                <MyRadioGroup
                  name="deliveryMethod"
                  options={[
                    // { value: 'retiro', label: 'LO RETIRO PERSONALMENTE.' },
                    { value: 'delivery', label: 'NECESITO QUE ME LO ENVIEN.' },
                  ]}
                />
              </div>

              <a className="font-antonio mb-2 font-bold text-2xl">
                FORMA DE PAGO:
              </a>
              <div className="flex flex-row md:w-6/12 justify-between">
                <MyRadioGroup
                  name="paymentMethod"
                  options={[
                    { value: 'efectivo', label: 'EFECTIVO' },
                    { value: 'mercadopago', label: 'MERCADOPAGO' },
                  ]}
                />
              </div>

              {getFieldProps('deliveryMethod').value === 'delivery' && (
                <DeliveryDetails getFieldProps={getFieldProps} />
              )}

              {getFieldProps('paymentMethod').value === 'efectivo' && (
                <>
                  <MyTextInput
                    name="money"
                    type="number"
                    placeholder="¿CON CUÁNTO VAS A PAGAR?"
                    autoComplete=""
                  />
                </>
              )}
            </div>
            <button
              type="submit"
              className="w-full flex flex-row md:w-6/12 justify-center mt-8 md:mb-10 mb-10 py-4 text-white font-bold font-kotch text-xl bg-red-main focus:outline-none hover:bg-black hover:text-red-main  gap-1"
              disabled={isSubmitting}
            >
              pedir
              <img src={fire} className="h-6" />
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default FormCustom;
