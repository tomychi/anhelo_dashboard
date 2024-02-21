import { FormGasto } from '../components/gastos';
import { eliminarDocumento } from '../firebase/ReadData';
import currencyFormat from '../helpers/currencyFormat';
import Calendar from '../components/Calendar';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/configureStore';

export const Gastos = () => {
  const { expenseData } = useSelector((state: RootState) => state.data);

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="">
        <FormGasto />
      </div>
      <Calendar />
      <div className="shadow-md sm:rounded-lg">
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
      </div>
    </div>
  );
};
