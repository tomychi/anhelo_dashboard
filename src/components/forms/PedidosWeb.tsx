import { useState } from 'react';
import toppingsData from '../../assets/toppings.json'; // Ajusta la ruta según tu estructura de carpetas

interface PedidoWebProps {
  onPedidoAnalizado: (detallesPedido: any) => void;
}

export const PedidosWeb: React.FC<PedidoWebProps> = ({ onPedidoAnalizado }) => {
  const [pedidoWebTexto, setPedidoWebTexto] = useState('');
  const [detallesPedido, setDetallesPedido] = useState({
    direccion: '',
    telefono: '',
    subTotal: 0,
    envio: 0,
    total: 0,
    metodoPago: 'efectivo',
    id: '',
    aclaraciones: '',
    hora: '',
  });
  const [id, setId] = useState('');
  const [aclaraciones, setAclaraciones] = useState('');
  const [hora, setHora] = useState('');

  const analizarPedidoWeb = () => {
    const regexTelefono = /Teléfono: (.+)/;
    const regexDireccion = /Dirección: (.+)/i;
    const regexPisoNumero = /Piso y número: (.+)/i;
    const regexReferencias = /Referencias: (.+)/i;
    const regexMetodoPago = /Forma de pago: (.+)/;

    // Expresiones regulares para extraer información específica
    const regexSubtotal = /Subtotal: \$ (\d+)/i;
    const regexCostoEnvio = /Costo de envío: \$\s*(\d+)/i;

    // Buscar coincidencias en el texto del pedido
    const matchSubtotal = pedidoWebTexto.match(regexSubtotal);
    const matchCostoEnvio = pedidoWebTexto.match(regexCostoEnvio);

    // Extraer valores de las coincidencias
    const subTotal = matchSubtotal ? parseInt(matchSubtotal[1], 10) : 0;
    const envio = matchCostoEnvio ? parseInt(matchCostoEnvio[1], 10) : 0;
    const matchTelefono = pedidoWebTexto.match(regexTelefono);
    const matchDireccion = pedidoWebTexto.match(regexDireccion);
    const matchPisoNumero = pedidoWebTexto.match(regexPisoNumero);
    const matchReferencias = pedidoWebTexto.match(regexReferencias);
    const matchMetodoPago = pedidoWebTexto.match(regexMetodoPago);
    const regexBurger = /(\d+)x (.+)\nToppings:\n((?:- .+\n)+): \$ (\d+)/g;
    let matchBurger;
    const burgers = [];

    while ((matchBurger = regexBurger.exec(pedidoWebTexto)) !== null) {
      const quantity = parseInt(matchBurger[1]);
      const burgerName = matchBurger[2];
      const toppingsList = matchBurger[3]
        .trim()
        .split('\n')
        .map((topping) => topping.substring(2));

      const priceBurger = parseFloat(matchBurger[4]);
      // Calcula el precio total de los toppings sumando los precios individuales de cada topping
      const priceToppings = toppingsList.reduce((total, toppingName) => {
        const topping = toppingsData.find(
          (t) => t.name.toLocaleLowerCase() === toppingName.toLocaleLowerCase()
        );
        return total + (topping ? topping.price : 0);
      }, 0);
      const subTotal = quantity * priceBurger;

      burgers.push({
        burger: burgerName,
        priceBurger,
        priceToppings, // Actualiza esto cuando necesites calcular el precio de los toppings
        quantity,
        subTotal,
        toppings: toppingsList,
      });
    }
    let direccionCompleta = '';

    if (matchDireccion) {
      direccionCompleta += matchDireccion[1];
    }

    if (matchPisoNumero) {
      direccionCompleta += `, ${matchPisoNumero[1]}`;
    }

    if (matchReferencias) {
      direccionCompleta += `, Referencias: ${matchReferencias[1]}`;
    }

    const detallesPedido = {
      telefono: matchTelefono ? matchTelefono[1] : '',
      direccion: direccionCompleta,
      subTotal,
      envio,
      total: subTotal + envio,
      metodoPago: matchMetodoPago ? matchMetodoPago[1] : '',
      burgerSelection: burgers,
      id: id || '', // Agregamos estas líneas para asegurarnos de que existan estos campos
      aclaraciones: aclaraciones || '',
      hora: hora || '',
    };

    setDetallesPedido(detallesPedido);
  };
  const guardarDetalles = () => {
    setDetallesPedido((prevDetalles) => ({
      ...prevDetalles,
      id: id,
      aclaraciones: aclaraciones,
      hora: hora,
    }));
    // Llama a la función proporcionada por el padre para pasar los detalles del pedido analizado
    onPedidoAnalizado(detallesPedido);
  };
  return (
    <div className="relative z-0 w-full mb-2 group mt-10 ml-2">
      <textarea
        value={pedidoWebTexto}
        onChange={(e) => setPedidoWebTexto(e.target.value)}
        placeholder="Pega aquí el mensaje del pedido web..."
        rows={8}
        className="resize-none border rounded w-54 p-2 mb-4"
      ></textarea>
      <button
        onClick={analizarPedidoWeb}
        className="bg-blue-500 text-white font-semibold px-4 py-2 rounded"
        type="button"
      >
        Analizar Pedido Web
      </button>

      <div className="relative z-0 w-full mb-2 group mt-10 ml-2">
        {/* Mostramos los campos analizados */}
        {/* Campos adicionales para completar */}
        <input
          id="floating_first_name"
          className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder=" "
        />
        <label className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
          ID:
        </label>
      </div>
      <div className="relative z-0 w-full mb-2 group mt-10 ml-2">
        <input
          id="floating_first_name"
          className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
          value={aclaraciones}
          placeholder=" "
          onChange={(e) => setAclaraciones(e.target.value)}
        />
        <label className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
          Aclaraciones:
        </label>
      </div>
      <div className="relative z-0 w-full mb-2 group mt-10 ml-2">
        <input
          id="floating_first_name"
          placeholder=" "
          className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
          type="text"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
        />
        <label className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
          Hora:
        </label>

        {/* Campos adicionales ya extraídos */}
        <div className="relative z-0 w-full mb-2 group mt-10 ml-2">
          <input
            id="floating_first_name"
            placeholder=" "
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            type="text"
            defaultValue={detallesPedido.direccion}
          />
          <label className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
            Dirección:
          </label>
        </div>
        <div className="relative z-0 w-full mb-2 group mt-10 ml-2">
          <input
            id="floating_first_name"
            placeholder=" "
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            type="number"
            value={detallesPedido.envio}
            readOnly
          />
          <label className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
            Envío:
          </label>
        </div>

        <div className="relative z-0 w-full mb-2 group mt-10 ml-2">
          <input
            id="floating_first_name"
            placeholder=" "
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            type="text"
            value={detallesPedido.telefono}
            readOnly
          />
          <label className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
            Teléfono:
          </label>
        </div>

        {/* Botón para guardar detalles */}
        <button
          onClick={guardarDetalles}
          className="bg-green-500 text-white font-semibold px-4 py-2 rounded"
          type="button"
        >
          Guardar Detalles
        </button>
      </div>
    </div>
  );
};
