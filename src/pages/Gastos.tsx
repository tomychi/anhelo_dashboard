import { useEffect, useState } from 'react';
import { FormGasto } from '../components/gastos';
import { ReadDataForDateRange } from '../firebase/ReadData';
import { ExpenseProps } from '../firebase/UploadGasto';

export const Gastos = () => {
  const [expenseData, setExpenseData] = useState<ExpenseProps[]>([]);

  useEffect(() => {
    ReadDataForDateRange<ExpenseProps>(
      'gastos',
      '2024',
      '2',
      '1',
      '2024',
      '2',
      '3',
      (gastos) => {
        console.log('Gastos por rango:', gastos);
        setExpenseData(gastos);
      }
    );
  }, []);

  return (
    <div>
      <FormGasto expenseData={expenseData} />
    </div>
  );
};
