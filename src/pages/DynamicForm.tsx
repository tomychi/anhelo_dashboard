import { CartShop, MenuGallery, PedidosWeb } from '../components/menuShop';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { UploadOrder } from '../firebase/UploadOrder';
import Swal from 'sweetalert2';
import {
  obtenerFechaActual,
  obtenerHoraActualMas5Minutos,
} from '../helpers/dateToday';
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
export interface DataProps {
  description: string;
  img: string;
  name: string;
  price: number;
  type: string;
  ingredients: Record<string, number>; // Un objeto donde las claves son los nombres de los ingredientes y los valores son las cantidades
  costo: number; // Un objeto donde las claves son los nombres de los ingredientes y los valores son las cantidades
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
    envio: '1000',
    hora: obtenerHoraActualMas5Minutos(),
    piso: '',
    referencias: '',
  });

  const handleFormClient = (clienteInfo: FormDataProps) => {
    // Agregar la propiedad 'envio' con el valor '1000' al objeto clienteInfo
    const clienteInfoConEnvio = {
      ...clienteInfo,
      envio: '1000',
    };

    // Actualizar el estado formData
    setFormData((prevState) => ({
      ...prevState,
      ...clienteInfoConEnvio,
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
            ingredients: item.data.ingredients,
            costo: item.data.costo,
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
    <div className="flex p-4 gap-4 justify-between flex-row">
      {/* Sección carrito y productos */}
      <div className="flex flex-col w-2/3">
        {detallePedido && (
          <div className="pb-4">
            <CartShop
              limpiarDetallePedido={limpiarDetallePedido}
              detallePedido={detallePedido}
            />
          </div>
        )}
        <MenuGallery
          handleFormBurger={handleFormBurger}
          loading={loading}
          toppings={toppings}
          data={data}
        />
      </div>

      {/* Sección form */}
      <div className="w-1/3">
        {/* Establecer el ancho de la sección */}
        <div className="font-antonio font-black bg-custom-red">
          <div className="flex flex-col">
            <div className="flex justify-center p-4">
              <div
                className={`p-4 text-2xl font-black ${
                  seccionActiva === 'elaborar'
                    ? 'bg-black text-custom-red'
                    : 'bg-custom-red text-black border-black border-2'
                } text-black  `}
                onClick={() => setSeccionActiva('elaborar')}
              >
                TOMAR PEDIDO
              </div>
              <div
                className={`p-4 text-2xl font-black ${
                  seccionActiva === 'elaborar'
                    ? 'bg-custom-red text-black border-black border-2'
                    : 'bg-black text-custom-red'
                } font-semibold `}
                onClick={() => setSeccionActiva('hechos')}
              >
                HECHOS POR LA WEB
              </div>
            </div>
            {seccionActiva === 'elaborar' ? (
              <div className="flex flex-col items-center justify-center">
                <form onSubmit={handleSubmit} className="w-full p-4">
                  <div className="relative z-0 mt-4 ">
                    <input
                      className="block py-2.5  w-full  texk-black  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
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

                  <div className="relative z-0 mt-4 ">
                    <input
                      className="block py-2.5  w-full  texk-black  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                    />
                    <label
                      htmlFor="telefono"
                      className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Telefono:
                    </label>
                  </div>

                  <div className="relative z-0 mt-4 ">
                    <input
                      className="block py-2.5  w-full  texk-black  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
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
                  <div className="relative z-0 mt-4 ">
                    <input
                      className="block py-2.5  w-full  texk-black  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
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
                  <div className="relative z-0 mt-4 ">
                    <input
                      className="block py-2.5  w-full  texk-black  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
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
                  <div className="relative z-0 mt-4 ">
                    <input
                      className="block py-2.5  w-full  texk-black  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
                      type="number"
                      id="envio"
                      name="envio"
                      value={formData.envio}
                      onChange={handleChange}
                      required // Agregar el atributo required
                    />
                    <label
                      htmlFor="envio"
                      className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Precio del envio:
                    </label>
                  </div>
                  <div className="relative z-0 mt-4 ">
                    <input
                      className="block py-2.5  w-full  texk-black  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
                      type="time"
                      id="hora"
                      name="hora"
                      value={formData.hora}
                      onChange={handleChange}
                    />
                    <label
                      htmlFor="hora"
                      className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Hora:
                    </label>
                  </div>
                  <div className="py-4 ">
                    <select
                      id="metodoPago"
                      name="metodoPago"
                      value={formData.metodoPago}
                      onChange={handleChange}
                      className="p-4 w-full bg-black text-custom-red"
                    >
                      <option> SELECCIONAR METODO DE PAGO</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="mercadopago">Mercadopago</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="  text-custom-red w-full p-4 bg-black font-black uppercase  outline-none "
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
