import { CartShop, MenuGallery, PedidosWeb } from '../components/menuShop';
import { ChangeEvent, FormEvent, useState } from 'react';
import { UploadOrder } from '../firebase/UploadOrder';
import Swal from 'sweetalert2';
import { obtenerFechaActual, obtenerHoraActual } from '../helpers/dateToday';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/configureStore';
import { addTelefonoFirebase } from '../firebase/Telefonos';
import { obtenerMontosPorAlias } from '../firebase/afip';
import { canjearVoucher } from '../firebase/voucher';
import currencyFormat from '../helpers/currencyFormat';

export interface FormDataProps {
  cupon: string;
  aclaraciones: string;
  metodoPago: string;
  direccion: string;
  telefono: string;
  envio: string;
  hora: string;
  ubicacion: string;
  referencias: string;
  map: [number, number];
  cadete: string;
}

export interface DetallePedidoProps {
  burger?: string;
  toppings: string[];
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
  id: string;
  ingredients: Record<string, number>; // Un objeto donde las claves son los nombres de los ingredientes y los valores son las cantidades
  costo: number; // Un objeto donde las claves son los nombres de los ingredientes y los valores son las cantidades
}
export interface DataStateProps {
  data: DataProps;
  id: string;
  collectionName?: string;
}

type AliasTopes = Record<string, number>; // Definir un tipo para los topes de alias

const obtenerAliasDisponible = (
  montosPorAlias: Record<string, number>,
  aliasTopes: AliasTopes
): string => {
  for (const [alias, topeTotal] of Object.entries(aliasTopes)) {
    const montoAcumulado = montosPorAlias[alias] || 0;
    if (montoAcumulado < topeTotal) {
      return alias; // Devolver el alias si el monto acumulado es menor que el tope total
    }
  }
  return 'onlyanhelo3'; // Devolver null si no hay ningún alias disponible
};

const aliasTopes = {
  'tobias.azcurra': 150000, //TOBIAS
  onlyanhelo2: 450000, //ALMA
  //onlyanhelo3 TOMY
};

export const DynamicForm = () => {
  const [aliasDisponible, setAliasDisponible] = useState<string>('onlyanhelo3');

  const obtenerMontos = () => {
    try {
      const fechaActual = obtenerFechaActual();
      const [, mesActual, anioActual] = fechaActual.split('/');
      obtenerMontosPorAlias(anioActual, mesActual, (montos) => {
        const aliasDis = obtenerAliasDisponible(montos, aliasTopes);
        setAliasDisponible(aliasDis);
      });
    } catch (error) {
      console.error('Error al obtener los montos por alias:', error);
    }
  };

  const [formData, setFormData] = useState<FormDataProps>({
    cupon: '',
    aclaraciones: '',
    metodoPago: '',
    direccion: '',
    map: [0, 0],
    telefono: '',
    envio: '2000',
    hora: obtenerHoraActual(),
    ubicacion: '',
    referencias: '',
    cadete: 'NO ASIGNADO',
  });

  const handleFormClient = (clienteInfo: FormDataProps) => {
    // Agregar la propiedad 'envio' con el valor '1000' al objeto clienteInfo
    const clienteInfoConEnvio = {
      ...clienteInfo,
      envio: '2000',
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

  const { materiales } = useSelector((state: RootState) => state.materials);

  const { burgers, drinks, toppings, fries } = useSelector(
    (state: RootState) => state.product
  );
  1;
  const pburgers = burgers.map((b) => b.data);
  const pdrinks = drinks.map((d) => d.data);
  const ptoppings = toppings.map((t) => t.data);
  const pfries = fries.map((f) => f.data);

  const productos = [...pburgers, ...pdrinks, ...ptoppings, ...pfries];

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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

    // Validar el cupón si existe en el formulario
    let cuponValido = false;
    if (formData.cupon) {
      cuponValido = await canjearVoucher(formData.cupon);

      if (!cuponValido) {
        Swal.fire({
          icon: 'error',
          title: 'Cupón inválido',
          text: 'El cupón que ingresaste no es válido o ya ha sido canjeado.',
        });
      }
    }

    // Calcular el subtotal
    const subTotal = detallePedido.reduce((acc, burger) => {
      // Asegúrate de que `burger.quantity` y `burger.priceBurger` no sean undefined
      const cantidad = burger.quantity ?? 1;
      const priceBurger = burger.priceBurger ?? 0;

      // Aplica descuento si el cupón es válido y la cantidad es mayor a 2
      const cantidadFinal =
        cuponValido && cantidad >= 2 ? cantidad - 1 : cantidad;

      if (burger.subTotal !== undefined) {
        return acc + priceBurger * cantidadFinal + (burger.priceToppings ?? 0);
      }

      return acc;
    }, 0);

    if (cuponValido) {
      const total = subTotal + parseInt(formData.envio);
      Swal.fire({
        icon: 'success',
        title: 'DESCUENTO',
        text: `El total es ${currencyFormat(total)}`,
        timer: 8000, // Cierra automáticamente después de 3 segundos
        timerProgressBar: true, // Mostrar barra de progreso
        showCloseButton: true, // Mostrar botón de cerrar (cruz)
        showConfirmButton: false, // No mostrar botón de confirmación
      });
    }
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
    UploadOrder(info, aliasDisponible)
      .then((result) => {
        console.log(result);
      })
      .catch((error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Hubo un error al cargar el pedido: ${error}`,
        });
      });

    addTelefonoFirebase(info.telefono, info.fecha);

    // Limpia los datos del formulario después de procesarlos
    setFormData({
      cupon: '',
      aclaraciones: '',
      metodoPago: '',
      direccion: '',
      map: [0, 0],
      envio: '2000',
      hora: obtenerHoraActual(),
      telefono: '',
      referencias: '',
      ubicacion: '',
      cadete: 'NO ASIGNADO',
    });

    setDetallePedido([]);
  };

  const [seccionActiva, setSeccionActiva] = useState('elaborar');

  // si es el formulario de la seccion burgers
  const handleFormBurger = (values: DetallePedidoProps) => {
    console.log(productos);
    const quantity = values.quantity !== undefined ? values.quantity : 0;
    const priceToppings =
      values.priceToppings !== undefined ? values.priceToppings : 0;
    const priceBurger =
      values.priceBurger !== undefined ? values.priceBurger : 0;

    // Buscar el producto que coincide con el nombre de la hamburguesa seleccionada
    const productoSeleccionado = productos.find(
      (producto) => producto.name === values.burger
    );
    const toppingsSeleccionados = values.toppings;

    // Inicializar el costo total de los toppings
    let costoToppings = 0;

    // Recorrer los toppings seleccionados y calcular su costo total
    toppingsSeleccionados.forEach((topping) => {
      // Buscar el material que coincide con el nombre del topping seleccionado
      const materialTopping = materiales.find(
        (material) => material.nombre.toLowerCase() === topping.toLowerCase()
      );

      // Si se encuentra el material, sumar su costo al costo total de los toppings
      if (materialTopping) {
        costoToppings += materialTopping.costo;
      }
    });

    // Verificar si se encontró el producto y obtener su costo
    const costoBurger = productoSeleccionado
      ? (productoSeleccionado.costo + costoToppings) * quantity
      : 0;
    const burger = {
      burger: values.burger,
      toppings: values.toppings,
      quantity: quantity,
      priceBurger: values.priceBurger,
      priceToppings: values.priceToppings,
      subTotal: (priceBurger + priceToppings) * quantity,
      costoBurger,
    };
    setDetallePedido((prevData) => [...prevData, burger]);
  };

  return (
    <div>
      {productos.length > 0 && (
        <div className="flex p-4 gap-4 justify-between flex-col md:flex-row">
          {/* Sección carrito y productos */}
          <div className="flex flex-col w-full md:w-2/3">
            {detallePedido && (
              <div className="pb-4">
                <CartShop
                  limpiarDetallePedido={limpiarDetallePedido}
                  detallePedido={detallePedido}
                />
              </div>
            )}
            {/* Mostrar las tarjetas solo si los productos están cargados */}
            <MenuGallery handleFormBurger={handleFormBurger} />
          </div>

          {/* Sección form */}
          <div className="md:w-1/3 flex flex-col gap-4">
            {/* Establecer el ancho de la sección */}

            <div className="font-coolvetica font-black bg-custom-red">
              <div className="flex flex-col">
                <div className="flex w-full justify-center p-4">
                  <button
                    className={`pt-8 pb-8 text-2xl w-1/2 font-black ${
                      seccionActiva === 'elaborar'
                        ? 'bg-black text-custom-red'
                        : 'bg-custom-red text-black border-black border-2'
                    } text-black  `}
                    onClick={() => setSeccionActiva('elaborar')}
                  >
                    TOMAR PEDIDO
                  </button>
                  <button
                    className={` w-1/2 pt-8 pb-8 text-2xl font-black ${
                      seccionActiva === 'elaborar'
                        ? 'bg-custom-red text-black border-black border-2'
                        : 'bg-black text-custom-red'
                    } font-semibold `}
                    onClick={() => setSeccionActiva('hechos')}
                  >
                    HECHOS POR LA WEB
                  </button>
                </div>
                {seccionActiva === 'elaborar' ? (
                  <div className="flex flex-col items-center justify-center">
                    <form onSubmit={handleSubmit} className="w-full p-4">
                      <div className="relative z-0 mt-4 ">
                        <input
                          className="block py-2.5  w-full  texk-black  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
                          id="cupon"
                          name="cupon"
                          value={formData.cupon}
                          onChange={handleChange}
                        />
                        <label
                          htmlFor="cupon"
                          className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                        >
                          Cupón:
                        </label>
                      </div>
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
                          id="ubicacion"
                          name="ubicacion"
                          value={formData.ubicacion}
                          onChange={handleChange}
                        />
                        <label
                          htmlFor="ubicacion"
                          className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                        >
                          ubicacion:
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
                      <div className="py-4">
                        <select
                          id="metodoPago"
                          name="metodoPago"
                          value={formData.metodoPago}
                          onChange={handleChange}
                          className="p-4 w-full bg-black uppercase text-custom-red select-none"
                        >
                          <option> METODO DE PAGO</option>
                          <option value="efectivo">Efectivo</option>
                          <option
                            value="mercadopago"
                            onClick={() => obtenerMontos()}
                          >
                            Mercadopago
                          </option>
                        </select>
                        {formData.metodoPago === 'mercadopago' && ( // Condición para mostrar el alias solo si se selecciona "mercadopago"
                          <div className="flex flex-row">
                            <h5 className="text-black w-4/5 font-coolvetica border-black border-2 font-black p-4 ">
                              ALIAS: {aliasDisponible}
                            </h5>
                            <button
                              className="w-1/5 text-black border-2 border-black font-black p-4"
                              type="button" // Cambiar el tipo de botón a "button"
                              onClick={() => {
                                const mensaje = `El alias es "${aliasDisponible}", aguardo comprobante para tomar tu pedido!`;
                                navigator.clipboard
                                  .writeText(mensaje)
                                  .then(() => {
                                    console.log(
                                      'Mensaje copiado al portapapeles:',
                                      mensaje
                                    );
                                  })
                                  .catch((error) => {
                                    console.error(
                                      'Error al copiar el mensaje al portapapeles:',
                                      error
                                    );
                                  });
                              }}
                            >
                              COPIAR
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="  text-custom-red w-full pt-8 pb-8 bg-black uppercase text-2xl font-black  outline-none "
                      >
                        Guardar
                      </button>
                    </form>
                  </div>
                ) : (
                  <PedidosWeb
                    handleFormBurger={handleFormBurger}
                    handleFormClient={handleFormClient}
                    setSeccionActiva={setSeccionActiva}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
