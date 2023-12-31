import { CartShop, MenuGallery } from '../components/menuShop';
import { useState } from 'react';
import { PedidosWeb } from '../components/forms/PedidosWeb';
import { UploadOrder } from '../firebase/UploadOrder';
import Swal from 'sweetalert2';

const obtenerFechaActual = () => {
  const fechaActual = new Date(); // Obtiene la fecha y hora actuales

  const dia = fechaActual.getDate();
  const mes = fechaActual.getMonth() + 1; // Los meses comienzan desde 0
  const anio = fechaActual.getFullYear();

  // Formatea la fecha como "DD/MM/AAAA"
  const fechaFormateada = `${dia}/${mes}/${anio}`;

  return fechaFormateada;
};

export const DynamicForm = () => {
  const [formData, setFormData] = useState({
    aclaraciones: '',
    metodoPago: '',
    direccion: '',
    telefono: '',
    envio: 0,
    hora: '',
  });

  const [detallePedido, setDetallePedido] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
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

    const subTotal = detallePedido.reduce(
      (acc, burger) => acc + burger.subTotal,
      0
    );

    const envio = parseFloat(formData.envio); // Convertir envio a número

    const info = {
      ...formData,
      envio,
      detallePedido,
      subTotal,
      total: subTotal + envio,
      fecha: obtenerFechaActual(),
    };

    console.log('Datos del formulario:', info);
    // Puedes enviar los datos a tu backend, realizar validaciones, etc.
    UploadOrder(info);

    // Limpia los datos del formulario después de procesarlos
    setFormData({
      aclaraciones: '',
      metodoPago: '',
      direccion: '',
      envio: 0,
      hora: '',
      telefono: '',
    });

    setDetallePedido([]);
  };

  const [seccionActiva, setSeccionActiva] = useState('elaborar');

  // si es el formulario de la seccion burgers
  const handleFormBurger = (values: any) => {
    const burger = {
      burger: values.burger,
      toppings: values.toppings,
      quantity: values.quantity,
      priceBurger: values.priceBurger,
      priceToppings: values.priceToppings,
      subTotal: (values.priceBurger + values.priceToppings) * values.quantity,
    };

    setDetallePedido((prevData) => [...prevData, burger]);
  };

  const handlePedidoWebAnalizado = (detallesPedido: any) => {
    // Aquí puedes agregar lógica adicional según sea necesario

    console.log(detallesPedido);
  };
  console.log(detallePedido);

  return (
    <div className="p-4 w-3/5">
      <div>
        {/* {detallePedido && <CartShop />} */}

        <MenuGallery handleFormBurger={handleFormBurger} />
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
                <div>
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
                  <div>
                    <label htmlFor="envio">Costo de envío:</label>
                    <input
                      className="block py-2.5 px-2 w-full text-sm texk-black 900 bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
                      type="number"
                      id="envio"
                      name="envio"
                      value={formData.envio}
                      onChange={handleChange}
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
                    className="  text-custom-red p-4 bg-black font-black uppercase text-4x1 outline-none "
                    onClick={(e) => handleSubmit(e)}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <PedidosWeb onPedidoAnalizado={handlePedidoWebAnalizado} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
