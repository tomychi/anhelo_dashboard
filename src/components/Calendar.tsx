import Datepicker, { DateValueType } from 'react-tailwindcss-datepicker';
import { RootState } from '../redux/configureStore';
import { useDispatch, useSelector } from 'react-redux';
import {
  readExpensesData,
  readOrdersData,
  setValueDate,
} from '../redux/data/dataAction';
import { useEffect } from 'react';
import { formatDate } from '../helpers/dateToday';
import { ReadDataForDateRange } from '../firebase/ReadData';
import { PedidoProps } from '../types/types';
import { ExpenseProps } from '../firebase/UploadGasto';

const Calendar = () => {
  const dispatch = useDispatch();
  const { valueDate } = useSelector((state: RootState) => state.data);
  const handleValueDate = async (value: DateValueType) => {
    dispatch(setValueDate(value));

    // Eliminar los datos del mapa del localStorage si existen
    localStorage.removeItem('mapData');

    try {
      // Leer datos de pedidos y gastos
      const [ordersData, expensesData] = await Promise.all([
        ReadDataForDateRange<PedidoProps>('pedidos', value),
        ReadDataForDateRange<ExpenseProps>('gastos', value),
      ]);

      // Despachar acciones para actualizar los datos de pedidos y gastos
      dispatch(readOrdersData(ordersData));
      dispatch(readExpensesData(expensesData));
    } catch (error) {
      // Manejar el error si ocurre algún problema al leer los datos
      console.error('Se produjo un error al leer los datos:', error);
    }
  };

  useEffect(() => {
    if (valueDate === undefined) {
      dispatch(
        setValueDate({
          startDate: formatDate(new Date()),
          endDate: formatDate(new Date()), // Último día de diciembre del año actual
        })
      );
    }
  }, [dispatch, valueDate]);

  return (
    <Datepicker
      //     Use the startFrom props to change the default startFrom value.
      // By default the value is new Date()
      //       Use the separator props to change the default separator value.
      // By default the value is ~.
      separator={'hasta'}
      primaryColor={'red'}
      //       Use showShortcuts and showFooter to display or not the shortcuts and footer respectively.
      // By default both have the value false.
      showShortcuts={true}
      inputClassName="w-full uppercase rounded-none border border-2 border-red-main focus:ring-0 font-antonio text-custom-red p-4 font-black bg-black"
      toggleClassName="absolute rounded-none bg-custom-red font-antonio
text-black
font-black right-0 h-full px-3 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
      containerClassName="relative rounded-none font-antonio
text-custom-red
font-black"
      showFooter={true}
      value={valueDate}
      onChange={handleValueDate}
    />
  );
};
export default Calendar;
