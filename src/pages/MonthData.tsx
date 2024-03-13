import { useSelector } from 'react-redux';
import { RootState } from '../redux/configureStore';
import { CardInfo } from '../components/dashboard/CardInfo';
import { NetoSVG, GastosSVG, ExcedenteSVG } from '../components/icons';

export const MonthData = () => {
  const { expenseData } = useSelector((state: RootState) => state.data);
  const { neto } = useSelector((state: RootState) => state.data);

  // Calcular la suma de todos los gastos que no sean de la categoría "ingredientes"
  const totalGastos = expenseData.reduce((total, expense) => {
    // Excluir los gastos que tengan la categoría "ingredientes"
    if (
      expense.category !== 'ingredientes' &&
      expense.category !== 'igredientes' &&
      expense.category !== 'bebidas' &&
      expense.category !== 'packaging' &&
      expense.name !== 'carne'
    ) {
      return total + expense.total;
    } else {
      return total;
    }
  }, 0);

  // Calcular el balance mensual (neto - gastos)
  const balanceMensual = neto - totalGastos;
  return (
    <div className="p-4 flex flex-col gap-4">
      <CardInfo info={neto} title={'Neto'} svgComponent={<NetoSVG />} />
      <CardInfo
        info={totalGastos}
        title={'Total gastos'}
        svgComponent={<GastosSVG />}
      />
      <CardInfo
        info={balanceMensual}
        title={'Excedente mensual'}
        svgComponent={<ExcedenteSVG />}
      />
    </div>
  );
};
