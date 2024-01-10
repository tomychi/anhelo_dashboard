import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FormCustom from '../../components/form';
import { FormCustomProps } from '../../types/types';

const OrderForm = () => {
  const navigate = useNavigate();
  const { cart, total } = useSelector(
    (state: { cartState: FormCustomProps }) => state.cartState
  );

  useEffect(() => {
    if (cart.length <= 0) {
      return navigate('/menu');
    }
  }, [cart]);

  return <FormCustom cart={cart} total={total} />;
};

export default OrderForm;
