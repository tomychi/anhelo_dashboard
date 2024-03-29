import { FormGasto } from '../components/gastos';
import { eliminarDocumento } from '../firebase/ReadData';
import currencyFormat from '../helpers/currencyFormat';
import Calendar from '../components/Calendar';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/configureStore';
import Swal from 'sweetalert2';

export const Gastos = () => {
  const { expenseData } = useSelector((state: RootState) => state.data);

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="">
        <FormGasto />
      </div>
      <Calendar />
      <div className="">
        <div className=" font-antonio">
          <table className=" w-full text-sm text-left rtl:text-right text-black">
            <thead className="text-xs  uppercase text-black border border-red-main bg-custom-red ">
              {/* Encabezados de la tabla */}
              <tr>
                <th scope="col" className="px-6 py-3">
                  Product name
                </th>
                <th scope="col" className="px-6 py-3 hidden lg:table-cell">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 hidden lg:table-cell">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 hidden lg:table-cell">
                  Descripcion
                </th>
                <th scope="col" className="px-6 py-3 hidden lg:table-cell">
                  Cantidad
                </th>
                <th scope="col" className="px-6 py-3 hidden lg:table-cell">
                  Unidad
                </th>
                <th scope="col" className="px-6 py-3  md:table-cell">
                  Total
                </th>
                <th scope="col" className="px-6 py-3  hidden md:table-cell">
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
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {category}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">{fecha}</td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {description}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {quantity}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">{unit}</td>
                    <td className="px-6 py-4">{currencyFormat(total)}</td>
                    <td className="px-6 py-4 text-center hidden md:table-cell">
                      <div
                        className="font-black border border-red-main text-custom-red hover:underline px-1"
                        onClick={() =>
                          Swal.fire({
                            title: '¿Estás seguro?',
                            text: '¡No podrás revertir esto!',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#3085d6',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Sí, eliminarlo',
                            cancelButtonText: 'Cancelar',
                          }).then((result) => {
                            if (result.isConfirmed) {
                              eliminarDocumento('gastos', id, fecha)
                                .then(() => {
                                  Swal.fire({
                                    icon: 'success',
                                    title: '¡Eliminado!',
                                    text: `El gasto con ID ${id} ha sido eliminado.`,
                                  });
                                })
                                .catch(() => {
                                  Swal.fire({
                                    icon: 'error',
                                    title: 'Error',
                                    text: 'No se pudo eliminar el gasto.',
                                  });
                                });
                            }
                          })
                        }
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
