import { useEffect, useState } from 'react';
import { FormGasto } from '../components/gastos';
import { eliminarDocumento } from '../firebase/ReadData';
import { ExpenseProps } from '../firebase/UploadGasto';
import currencyFormat from '../helpers/currencyFormat';
import Calendar from '../components/Calendar';
import { formatDate } from '../helpers/dateToday';
import { DateValueType } from 'react-tailwindcss-datepicker';

export const Gastos = () => {
  const [expenseData, setExpenseData] = useState<ExpenseProps[]>([]);
  const [loading, setLoading] = useState(false);

  const [valueDate, setValueDate] = useState<DateValueType>({
    startDate: formatDate(new Date()),
    endDate: formatDate(new Date()), // Último día de diciembre del año actual
  });

  const handleValueDate = (value: DateValueType) => {
    setValueDate(value);
  };

  useEffect(() => {
    setLoading(true);

    // ReadDataForDateRange<ExpenseProps>('gastos', valueDate, (gastos) => {
    //   setExpenseData(gastos);
    // });
    setLoading(false);
  }, [valueDate]);

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="">
        <FormGasto />
      </div>
      <Calendar handleValueDate={handleValueDate} valueDate={valueDate} />
      <div className="shadow-md sm:rounded-lg">
        {loading ? (
          <div
            role="status "
            className="fixed overflow-y-auto overflow-x-hidden inset-0 flex items-center justify-center z-50 w-full"
          >
            <svg
              className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-red-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        ) : (
          <div className=" font-antonio">
            <table className="w-full  text-sm text-left rtl:text-right text-black">
              <thead className="text-xs  uppercase text-black border border-red-main bg-custom-red ">
                {/* Encabezados de la tabla */}
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Product name
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Descripcion
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Cantidad
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Unidad
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Mapeo de datos de burgers */}
                {expenseData.map(
                  ({
                    quantity,
                    fecha,
                    category,
                    name,
                    total,
                    unit,
                    description,
                    id,
                  }) => (
                    <tr
                      key={id}
                      className="bg-black text-custom-red uppercase font-black border border-red-main"
                    >
                      <th
                        scope="row"
                        className="px-6 py-4 font-black text-custom-red whitespace-nowrap "
                      >
                        {name}
                      </th>
                      <td className="px-6 py-4">{category}</td>
                      <td className="px-6 py-4">{fecha}</td>
                      <td className="px-6 py-4 ">{description}</td>
                      <td className="px-6 py-4 ">{quantity}</td>
                      <td className="px-6 py-4 ">{unit}</td>
                      <td className="px-6 py-4">{currencyFormat(total)}</td>
                      <td className="px-6 py-4 text-center">
                        <div
                          className="font-black border border-red-main text-custom-red hover:underline"
                          onClick={() => eliminarDocumento('gastos', id)}
                        >
                          Borrar
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
