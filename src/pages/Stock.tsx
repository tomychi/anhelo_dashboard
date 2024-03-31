import { useSelector } from 'react-redux';
import { RootState } from '../redux/configureStore';
import Swal from 'sweetalert2';

export const Stock = () => {
  const { materiales } = useSelector((state: RootState) => state.materials);

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="">
        <div className=" font-antonio">
          <table className=" w-full text-sm text-left rtl:text-right text-black">
            <thead className="text-xs  uppercase text-black border border-red-main bg-custom-red ">
              {/* Encabezados de la tabla */}
              <tr>
                <th scope="col" className="px-6 py-3">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3  lg:table-cell">
                  Producto
                </th>
                <th scope="col" className="px-6 py-3  lg:table-cell">
                  Cantidad
                </th>

                <th scope="col" className="px-6 py-3  lg:table-cell">
                  Unidad
                </th>

                <th scope="col" className="px-6 py-3  lg:table-cell">
                  Proveedores
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Mapeo de datos de burgers */}
              {materiales.map(({ id, nombre, stock, unit }) => (
                <tr
                  key={id}
                  className="bg-black text-custom-red uppercase font-black border border-red-main"
                >
                  <th
                    scope="row"
                    className="px-6 py-4 font-black text-green-600 whitespace-nowrap "
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </th>
                  <td className="px-6 py-4  lg:table-cell">{nombre}</td>
                  <td className="px-6 py-4  lg:table-cell">{stock}</td>
                  <td className="px-6 py-4  lg:table-cell">{unit}</td>

                  <td className="px-6 py-4 text-center  md:table-cell">
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
                          console.log(result);
                        })
                      }
                    >
                      Comprar a Makro
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
