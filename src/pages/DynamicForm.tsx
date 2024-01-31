import { CartShop, MenuGallery, PedidosWeb } from '../components/menuShop';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { UploadOrder } from '../firebase/UploadOrder';
import Swal from 'sweetalert2';
import { obtenerFechaActual } from '../helpers/dateToday';
import { ReadData } from '../firebase/ReadData';

export interface FormDataProps {
  aclaraciones: string;
  metodoPago: string;
  direccion: string;
  telefono: string;
  envio: string;
  hora: string;
  piso: string;
  referencias: string;
}

export interface DetallePedidoProps {
  burger?: string;
  toppings?: string[];
  quantity?: number;
  priceBurger?: number;
  priceToppings?: number;
  subTotal: number;
}
interface DataProps {
  description: string;
  img: string;
  name: string;
  price: number;
  type: string;
}
export interface DataStateProps {
  data: DataProps;
  id: string;
  collectionName?: string;
}

export const DynamicForm = () => {
  const [formData, setFormData] = useState<FormDataProps>({
    aclaraciones: '',
    metodoPago: '',
    direccion: '',
    telefono: '',
    envio: '',
    hora: '',
    piso: '',
    referencias: '',
  });

  const handleFormClient = (clienteInfo: FormDataProps) => {
    setFormData((prevState) => ({
      ...prevState,
      ...clienteInfo,
    }));
  };

  const limpiarDetallePedido = () => {
    setDetallePedido([]);
  };

  const [detallePedido, setDetallePedido] = useState<DetallePedidoProps[]>([]);
  const [data, setData] = useState<DataStateProps[]>([]);
  const [toppings, setToppings] = useState<DataStateProps[]>([]);
  const [loading, setLoading] = useState(false);

  const getData = async () => {
    setLoading(true);
    if (data.length === 0) {
      const rawData = await ReadData();
      const formattedData: DataStateProps[] = rawData.map((item) => {
        return {
          id: item.id,
          data: {
            description: item.data.description,
            img: item.data.img,
            name: item.data.name,
            price: item.data.price,
            type: item.data.type,
          },
        };
      });
      setData(formattedData);
      // Filtrar elementos con type igual a "topping"
      const toppingsData: DataStateProps[] = formattedData.filter(
        (item) => item.data.type === 'topping'
      );
      setToppings(toppingsData);
    }
    setLoading(false);
  };

  useEffect(() => {
    getData();
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Aquí puedes manejar la lógica para enviar los datos del formulario

    if (detallePedido.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Por favor, agrega al menos una hamburguesa.',
      });
      return;
    }

    // Validar que los campos requeridos estén llenos
    if (!formData.metodoPago || !formData.direccion) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Por favor, completa los campos requeridos.',
      });
      return;
    }

    const subTotal = detallePedido.reduce((acc, burger) => {
      if (burger.subTotal !== undefined) {
        return acc + burger.subTotal;
      }
      return acc;
    }, 0);

    const envio = parseInt(formData.envio);

    const info = {
      ...formData,
      envio,
      detallePedido,
      subTotal,
      total: subTotal + envio,
      fecha: obtenerFechaActual(),
      elaborado: false,
    };

    UploadOrder(info)
      .then((result) => {
        Swal.fire({
          icon: 'success',
          title: `Pedido cargado`,
          text: `El pedido ${result.id} se cargo correctamente`,
        });
      })
      .catch((error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Hubo un error al cargar el pedido: ${error}`,
        });
      });

    // Limpia los datos del formulario después de procesarlos
    setFormData({
      aclaraciones: '',
      metodoPago: '',
      direccion: '',
      envio: '',
      hora: '',
      telefono: '',
      referencias: '',
      piso: '',
    });

    setDetallePedido([]);
  };

  const [seccionActiva, setSeccionActiva] = useState('elaborar');

  // si es el formulario de la seccion burgers
  const handleFormBurger = (values: DetallePedidoProps) => {
    const quantity = values.quantity !== undefined ? values.quantity : 0;
    const priceToppings =
      values.priceToppings !== undefined ? values.priceToppings : 0;
    const priceBurger =
      values.priceBurger !== undefined ? values.priceBurger : 0;

    const burger = {
      burger: values.burger,
      toppings: values.toppings,
      quantity: quantity,
      priceBurger: values.priceBurger,
      priceToppings: values.priceToppings,
      subTotal: (priceBurger + priceToppings) * quantity,
    };
    setDetallePedido((prevData) => [...prevData, burger]);
  };

  return (
    <div className="p-4 w-3/5">
      <div>
        {detallePedido && (
          <CartShop
            limpiarDetallePedido={limpiarDetallePedido}
            detallePedido={detallePedido}
          />
        )}

        <MenuGallery
          handleFormBurger={handleFormBurger}
          loading={loading}
          toppings={toppings}
          data={data}
        />
      </div>

      <div>
        <div className="grid fixed right-6 top-4 z-0 w-1/3 font-antonio font-black ml-2 bg-custom-red">
          <div className="flex flex-col">
            <div className="flex justify-center my-2">
              <div
                className={`mx-2 py-2 px-4 ${
                  seccionActiva === 'elaborar'
                    ? 'bg-black text-custom-red'
                    : 'bg-custom-red text-black'
                } text-black  `}
                onClick={() => setSeccionActiva('elaborar')}
              >
                TOMAR PEDIDO
              </div>
              <div
                className={`mx-2 py-2 px-4 ${
                  seccionActiva === 'elaborar'
                    ? 'bg-custom-red text-black'
                    : 'bg-black text-custom-red'
                } font-semibold `}
                onClick={() => setSeccionActiva('hechos')}
              >
                HECHOS POR LA WEB
              </div>
            </div>
            {seccionActiva === 'elaborar' ? (
              <div className="flex flex-col items-center justify-center">
                <form onSubmit={handleSubmit}>
                  <div className="relative z-0 w-11/12 mb-2 mt-4 ">
                    <input
                      className="block py-2.5 px-2 w-full text-sm texk-black 900 bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
                      id="aclaraciones"
                      name="aclaraciones"
                      value={formData.aclaraciones}
                      onChange={handleChange}
                    />
                    <label
                      htmlFor="aclaraciones"
                      className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Aclaraciones:
                    </label>
                  </div>

                  <div className="relative z-0 w-11/12 mb-2 mt-4 ">
                    <input
                      className="block py-2.5 px-2 w-full text-sm texk-black 900 bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                    />
                    <label
                      htmlFor="aclaraciones"
                      className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Telefono:
                    </label>
                  </div>

                  <div className="relative z-0 w-11/12 mb-2 mt-4 ">
                    <input
                      className="block py-2.5 px-2 w-full text-sm texk-black 900 bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
                      type="text"
                      id="direccion"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleChange}
                    />
                    <label
                      htmlFor="direccion"
                      className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Dirección:
                    </label>
                  </div>
                  <div className="relative z-0 w-11/12 mb-2 mt-4 ">
                    <input
                      className="block py-2.5 px-2 w-full text-sm texk-black 900 bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
                      type="text"
                      id="piso"
                      name="piso"
                      value={formData.piso}
                      onChange={handleChange}
                    />
                    <label
                      htmlFor="piso"
                      className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Piso:
                    </label>
                  </div>
                  <div className="relative z-0 w-11/12 mb-2 mt-4 ">
                    <input
                      className="block py-2.5 px-2 w-full text-sm texk-black 900 bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
                      type="text"
                      id="referencias"
                      name="referencias"
                      value={formData.referencias}
                      onChange={handleChange}
                    />
                    <label
                      htmlFor="referencias"
                      className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Referencias:
                    </label>
                  </div>
                  <div>
                    <label htmlFor="envio">Costo de envío:</label>
                    <input
                      className="block py-2.5 px-2 w-full text-sm text-black bg-transparent border-0 border-b-2 border-black appearance-none focus:outline-none focus:ring-0 peer"
                      type="number"
                      id="envio"
                      name="envio"
                      value={formData.envio}
                      onChange={handleChange}
                      required // Agregar el atributo required
                    />
                  </div>
                  <div>
                    <label htmlFor="hora">Hora:</label>
                    <input
                      className="block py-2.5 px-2 w-full text-sm texk-black 900 bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
                      type="time"
                      id="hora"
                      name="hora"
                      value={formData.hora}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="mb-4">
                    <select
                      id="metodoPago"
                      name="metodoPago"
                      value={formData.metodoPago}
                      onChange={handleChange}
                      className="h-12 bg-red-300 hover:bg-red-700"
                    >
                      <option value="">Selecciona un método de pago</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="  text-custom-red p-4 bg-black font-black uppercase text-4x1 outline-none "
                  >
                    Guardar
                  </button>
                </form>
              </div>
            ) : (
              <PedidosWeb
                toppingsInfo={toppings}
                handleFormBurger={handleFormBurger}
                handleFormClient={handleFormClient}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
