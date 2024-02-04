import { useEffect, useState } from 'react';
import { ReadDataForDateRange } from '../firebase/ReadData';
import { ExpenseProps } from '../firebase/UploadGasto';

export const Neto = () => {
  const [expenseData, setExpenseData] = useState<ExpenseProps[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

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

    setLoading(false);
  }, []);

  const materialesYPrecios = {
    'Bolsa kraft + Sticker': 169.1,
    Aluminio: 100.0,
    'Sticker ADVISORY': 40.0,
    'Bolsita papas': 10.0,
    'Papas 130 gr': 507.0,
    // Agrega más materiales y precios según sea necesario
  };

  return (
    <div className="">
      {loading ? (
        <div>Loading....</div>
      ) : (
        <div className="flex p-4 gap-4 justify-between flex-row">
          <table className="w-1/2 font-antonio text-sm text-left rtl:text-right text-black">
            <thead className="text-xs uppercase text-black border border-red-main bg-custom-red">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Material
                </th>
                <th scope="col" className="px-6 py-3">
                  Precio
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(materialesYPrecios).map(([material, precio]) => (
                <tr
                  key={material}
                  className="bg-black text-custom-red uppercase font-black border border-red-main"
                >
                  <td className="px-6 py-4">{material}</td>
                  <td className="px-6 py-4">${precio.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
