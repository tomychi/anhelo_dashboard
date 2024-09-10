import React, { useState, useEffect, useCallback } from 'react';
import { CartShop, MenuGallery, PedidosWeb } from '../components/menuShop';
import { UploadOrder } from '../firebase/UploadOrder';
import Swal from 'sweetalert2';
import { obtenerFechaActual, obtenerHoraActual } from '../helpers/dateToday';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/configureStore';
import { addTelefonoFirebase } from '../firebase/Telefonos';
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
  efectivoCantidad: string;
  mercadopagoCantidad: string;
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
  ingredients: Record<string, number>;
  costo: number;
}

export interface DataStateProps {
  data: DataProps;
  id: string;
  collectionName?: string;
}

export const DynamicForm: React.FC = () => {
  const [editableTotal, setEditableTotal] = useState(0);
  const [detallePedido, setDetallePedido] = useState<DetallePedidoProps[]>([]);
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
    efectivoCantidad: '',
    mercadopagoCantidad: '',
  });

  const { materiales } = useSelector((state: RootState) => state.materials);
  const { burgers, drinks, toppings, fries } = useSelector(
    (state: RootState) => state.product
  );

  const pburgers = burgers.map((b) => b.data);
  const pdrinks = drinks.map((d) => d.data);
  const ptoppings = toppings.map((t) => t.data);
  const pfries = fries.map((f) => f.data);

  const productos = [...pburgers, ...pdrinks, ...ptoppings, ...pfries];

  useEffect(() => {
    const newTotal = detallePedido.reduce(
      (acc, item) => acc + (item.subTotal || 0),
      0
    );
    setEditableTotal(newTotal);
  }, [detallePedido]);

  const handleFormChange = useCallback((newData: Partial<FormDataProps>) => {
    setFormData((prevData) => ({ ...prevData, ...newData }));
  }, []);

  const handleFormClient = (clienteInfo: FormDataProps) => {
    const clienteInfoConEnvio = {
      ...clienteInfo,
      envio: '2000',
    };
    setFormData((prevState) => ({
      ...prevState,
      ...clienteInfoConEnvio,
    }));
  };

  const limpiarDetallePedido = () => {
    setDetallePedido([]);
  };

  const handleTotalChange = (newTotal: number) => {
    setEditableTotal(newTotal);
  };

  const inputClass = `
    block px-4 h-12 border-t border-1 border-black border-opacity-20 w-full bg-gray-300
    appearance-none focus:outline-none focus:ring-0 peer
    placeholder-gray-400 placeholder-opacity-100
    text-black font-light 
    autofill:bg-gray-300 autofill:text-black
    focus:bg-gray-300 focus:text-black
    hover:bg-gray-300 hover:text-black
  `;

  const inputStyle = {
    backgroundColor: 'rgb(209 213 219)',
    color: 'black',
  };

  const FormInput: React.FC<{
    name: keyof FormDataProps;
    type: string;
    placeholder: string;
    required?: boolean;
  }> = ({ name, type, placeholder, required }) => {
    const [localValue, setLocalValue] = useState<string | number>(
      typeof formData[name] === 'object'
        ? JSON.stringify(formData[name]) // Convertimos la tupla a string
        : formData[name]
    );

    useEffect(() => {
      setLocalValue(
        typeof formData[name] === 'object'
          ? JSON.stringify(formData[name]) // Actualizamos el valor si es una tupla
          : formData[name]
      );
    }, [formData[name]]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
    };

    const handleBlur = () => {
      let valueToStore: string | number | [number, number] = localValue;

      if (typeof formData[name] === 'object') {
        try {
          // Si el campo es una tupla, intentamos convertir el valor a la tupla de nuevo
          valueToStore = JSON.parse(localValue as string);
        } catch (error) {
          console.error('Error parsing value to tuple:', error);
        }
      }

      handleFormChange({ [name]: valueToStore });
    };

    return (
      <div className="relative">
        <input
          className={`${inputClass} ${name === 'cupon' ? 'rounded-t-lg' : ''}`}
          style={inputStyle}
          type={type}
          id={name}
          name={name}
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
        />
        {localValue && (
          <button
            type="button"
            className="absolute right-4 font-medium top-1/2 transform -translate-y-1/2 rounded-full bg-black text-gray-100 text-xs h-4 w-4 flex items-center text-center justify-center"
            onClick={() => {
              setLocalValue('');
              handleFormChange({ [name]: '' });
            }}
          >
            X
          </button>
        )}
      </div>
    );
  };

  const extractCoordinates = (url: string) => {
    const regex = /maps\?q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = url.match(regex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      return [lat, lng];
    }
    return [0, 0]; // Valor predeterminado si no se encuentran coordenadas
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (detallePedido.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Por favor, agrega al menos una hamburguesa.',
      });
      return;
    }

    if (!formData.metodoPago || !formData.direccion) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Por favor, completa los campos requeridos.',
      });
      return;
    }

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

    let subTotal = 0;
    if (cuponValido) {
      // Encontrar la hamburguesa más cara (considerando la cantidad)
      const burgerMasCara = detallePedido.reduce((maxBurger, burger) => {
        const totalBurgerPrice =
          (burger.priceBurger ?? 0) * (burger.quantity ?? 1);
        return totalBurgerPrice >
          (maxBurger.priceBurger ?? 0) * (maxBurger.quantity ?? 1)
          ? burger
          : maxBurger;
      }, detallePedido[0]);

      // Calcular el subtotal total de todos los productos
      subTotal = detallePedido.reduce((acc, burger) => {
        return acc + (burger.subTotal ?? 0);
      }, 0);

      // Si hay más de una unidad de la hamburguesa más cara, aplicar el descuento 2x1
      if ((burgerMasCara.quantity ?? 1) > 1) {
        const descuento =
          (burgerMasCara.priceBurger ?? 0) + (burgerMasCara.priceToppings ?? 0);
        subTotal -= descuento; // Resta el precio de una unidad
      } else if (detallePedido.length > 1) {
        // Si hay al menos dos hamburguesas diferentes, aplicar el 2x1 en las dos más caras
        const [burgerMasCara1, burgerMasCara2] = detallePedido
          .sort((a, b) => (b.priceBurger ?? 0) - (a.priceBurger ?? 0)) // Ordenar por precio en orden descendente
          .slice(0, 2); // Tomar las dos más caras

        const descuento =
          ((burgerMasCara1?.priceBurger ?? 0) +
            (burgerMasCara1?.priceToppings ?? 0) +
            (burgerMasCara2?.priceBurger ?? 0) +
            (burgerMasCara2?.priceToppings ?? 0)) /
          2;
        subTotal -= descuento; // Resta la mitad del precio de las dos hamburguesas más caras
      }
      Swal.fire({
        icon: 'success',
        title: 'DESCUENTO',
        text: `El total es ${currencyFormat(
          subTotal + parseInt(formData.envio)
        )}`,
        timer: 8000,
        timerProgressBar: true,
        showCloseButton: true,
        showConfirmButton: false,
      });
    } else {
      subTotal = detallePedido.reduce((acc, burger) => {
        if (burger.subTotal !== undefined) {
          return acc + burger.subTotal;
        }
        return acc;
      }, 0);
    }

    const envio = parseInt(formData.envio);

    // Si el método de pago es "efectivo", asigna todo el editableTotal a efectivoCantidad
    const efectivoCantidad =
      formData.metodoPago === 'efectivo'
        ? editableTotal
        : parseInt(formData.efectivoCantidad) || 0;

    // Si el método de pago es "mercadopago", asigna todo el editableTotal a mercadopagoCantidad
    const mercadopagoCantidad =
      formData.metodoPago === 'mercadopago'
        ? editableTotal
        : parseInt(formData.mercadopagoCantidad) || 0;

    subTotal = editableTotal - envio;
    const total = subTotal + envio; // Calcula el total dinámicamente

    const coordinates = extractCoordinates(formData.ubicacion);

    const info = {
      ...formData,
      map: coordinates as [number, number],
      envio,
      efectivoCantidad,
      mercadopagoCantidad,
      detallePedido,
      subTotal,
      total,
      fecha: obtenerFechaActual(),
      elaborado: false,
    };

    UploadOrder(info)
      .then((result) => {
        console.log(result);
        Swal.fire({
          icon: 'success',
          title: 'Pedido guardado',
          text: 'El pedido ha sido guardado exitosamente.',
        });
      })
      .catch((error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Hubo un error al cargar el pedido: ${error}`,
        });
      });

    addTelefonoFirebase(info.telefono, info.fecha);

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
      efectivoCantidad: '',
      mercadopagoCantidad: '',
    });

    setDetallePedido([]);
  };

  const [seccionActiva, setSeccionActiva] = useState('elaborar');

  const handleFormBurger = (values: DetallePedidoProps) => {
    const quantity = values.quantity !== undefined ? values.quantity : 0;
    const priceToppings =
      values.priceToppings !== undefined ? values.priceToppings : 0;
    const priceBurger =
      values.priceBurger !== undefined ? values.priceBurger : 0;

    const productoSeleccionado = productos.find(
      (producto) => producto.name === values.burger
    );
    const toppingsSeleccionados = values.toppings;

    let costoToppings = 0;

    toppingsSeleccionados.forEach((topping) => {
      const materialTopping = materiales.find(
        (material) => material.nombre.toLowerCase() === topping.toLowerCase()
      );

      if (materialTopping) {
        costoToppings += materialTopping.costo;
      }
    });

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

  const handleRemoveItem = (index: number) => {
    setDetallePedido((prevDetallePedido) => {
      const newDetallePedido = [...prevDetallePedido];
      newDetallePedido.splice(index, 1);
      return newDetallePedido;
    });
  };

  return (
    <div>
      {productos.length > 0 && (
        <div className="flex p-4 gap-4 justify-between bg-gray-100 flex-col md:flex-row">
          <div className="flex flex-col w-full md:w-2/3">
            <div className="pb-6 pr-6">
              <CartShop
                limpiarDetallePedido={limpiarDetallePedido}
                detallePedido={detallePedido}
                onTotalChange={handleTotalChange}
                onRemoveItem={handleRemoveItem}
              />
            </div>
            <MenuGallery handleFormBurger={handleFormBurger} />
          </div>

          <div className="md:w-1/3 flex flex-col font-coolvetica font-black">
            <p className="bg-gray-300 rounded-t-lg  border-b border-1 border-black border-opacity-20 text-center font-medium text-2xl pt-6 pb-4">
              Toma pedidos
            </p>
            <div className="flex flex-row gap-4 w-full justify-center px-4 pt-4 bg-gray-300 ">
              <button
                className={`w-1/2 font-medium py-2 rounded-lg ${
                  seccionActiva === 'elaborar'
                    ? 'bg-black text-gray-200'
                    : 'bg-gray-300 text-black border-black border-1 border border-opacity-20'
                } text-black`}
                onClick={() => setSeccionActiva('elaborar')}
              >
                Manualmente
              </button>
              <button
                className={`w-1/2 font-medium py-2 rounded-lg ${
                  seccionActiva === 'elaborar'
                    ? 'bg-gray-300 text-black border-black border-1 border border-opacity-20'
                    : 'bg-black text-gray-200'
                }`}
                onClick={() => setSeccionActiva('hechos')}
              >
                Analizar
              </button>
            </div>
            <div className="bg-gray-300 rounded-b-lg shadow-lg">
              {seccionActiva === 'elaborar' ? (
                <div className="flex flex-col items-center justify-center p-4">
                  <form
                    onSubmit={handleSubmit}
                    className="w-full flex flex-col "
                  >
                    <div className="w-full flex flex-col border-4 border-black rounded-xl ">
                      <FormInput name="cupon" type="text" placeholder="Cupón" />
                      <FormInput
                        name="aclaraciones"
                        type="text"
                        placeholder="Aclaraciones"
                      />
                      <FormInput
                        name="telefono"
                        type="text"
                        placeholder="Teléfono"
                      />
                      <FormInput
                        name="direccion"
                        type="text"
                        placeholder="Dirección"
                      />
                      <FormInput
                        name="ubicacion"
                        type="text"
                        placeholder="Coordenadas"
                      />
                      <FormInput
                        name="referencias"
                        type="text"
                        placeholder="Referencias"
                      />
                      <FormInput
                        name="envio"
                        type="number"
                        placeholder="Envio"
                        required
                      />
                      <div className="relative">
                        <FormInput name="hora" type="time" placeholder="Hora" />
                      </div>
                      <select
                        id="metodoPago"
                        name="metodoPago"
                        style={inputStyle}
                        className={`${inputClass} rounded-b-lg`}
                        value={formData.metodoPago}
                        onChange={(e) =>
                          handleFormChange({ metodoPago: e.target.value })
                        }
                      >
                        <option>Metodo de pago</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="mercadopago">Mercadopago</option>
                        <option value="ambos">Ambos</option>
                      </select>
                      {formData.metodoPago === 'ambos' && (
                        <div className="mt-4">
                          <FormInput
                            name="efectivoCantidad"
                            type="number"
                            placeholder="Efectivo"
                          />

                          <FormInput
                            name="mercadopagoCantidad"
                            type="number"
                            placeholder="Mercadopago"
                          />

                          {/* Validación de suma de cantidades */}
                          {/* <p className="text-red-500 text-sm">
                            {parseInt(formData.efectivoCantidad || 0) +
                              parseInt(formData.mercadopagoCantidad || 0) !==
                            total
                              ? 'La suma de los montos debe ser igual al total del pedido.'
                              : ''}
                          </p> */}
                        </div>
                      )}
                      {formData.metodoPago === 'mercadopago' && (
                        <div className="flex flex-row">
                          <button
                            className="w-1/5 text-gray-100 border-black h-12 flex text-center justify-center items-center rounded-r-lg font-medium bg-black"
                            type="button"
                            onClick={() => {
                              const mensaje = `El alias es onlyanhelo3, aguardo comprobante para tomar tu pedido!`;
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
                      className="text-gray-100 w-full py-4 rounded-lg bg-black text-4xl font-medium mt-4"
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
      )}
    </div>
  );
};
