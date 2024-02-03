import { FormEvent, useState } from 'react';
import {
  DataStateProps,
  DetallePedidoProps,
  FormDataProps,
} from '../../pages/DynamicForm';

const procesarToppings = (bloque: string) => {
  // Buscar los toppings usando una expresión regular
  const regex = /Toppings:\s*-\s*(.*?)(?=\n|$)/g;
  let match;
  const toppings = [];

  while ((match = regex.exec(bloque)) !== null) {
    // Dividir el texto del topping por el guion seguido de un espacio
    const toppingCompleto = match[1];

    // Limpiar el topping
    const toppingLimpio = toppingCompleto.replace(/:\s*\$.*/, '');

    // Dividir el topping en varios elementos del arreglo si hay varios toppings en una cadena
    const toppingsIndividuales = toppingLimpio.split(' - ');

    // Agregar cada topping individual al arreglo
    toppings.push(...toppingsIndividuales.map((t) => t.trim()));
  }

  return toppings;
};

const procesarDetallePedido = (
  detail: string,
  toppingsInfo: DataStateProps[],
  handleFormBurger: (value: DetallePedidoProps) => void
) => {
  const bloques = detail.match(/\d+x .*? : \$ \d+/g);
  if (bloques) {
    bloques.map((bloque) => {
      const match = bloque.match(/(\d+)x (.*?) : \$ (\d+)/);
      if (match !== null) {
        const quantity = parseInt(match[1]);
        let burger = match[2];
        const priceBurger = parseInt(match[3]);

        // Aquí puedes usar quantity, burger y priceBurger...
        // Remover la parte de 'Toppings:' si está presente en el nombre de la hamburguesa
        const toppingsIndex = burger.indexOf(' Toppings:');
        if (toppingsIndex !== -1) {
          burger = burger.substring(0, toppingsIndex);
        }

        const toppings = procesarToppings(bloque);
        const toppingsData = toppingsInfo.map((topping) => topping.data);
        let priceToppings = 0;

        // Convertir todos los toppings a minúsculas
        const toppingsLowerCase = toppings.map((topping) =>
          topping.toLowerCase()
        );

        // Iterar sobre cada topping en el pedido
        for (const topping of toppingsLowerCase) {
          // Buscar el topping en el arreglo toppingsData
          const foundTopping = toppingsData.find(
            (item) => item.name.toLowerCase() === topping
          );
          // Verificar si se encontró el topping y si tiene un precio asociado
          if (foundTopping && foundTopping.price) {
            // Si el topping está presente y tiene un precio, sumar su precio al total
            priceToppings += foundTopping.price;
          }
        }

        const subTotal = (priceBurger + priceToppings) * quantity;

        handleFormBurger({
          burger,
          priceBurger,
          priceToppings,
          quantity,
          subTotal,
          toppings,
        });
      } else {
        // Si no se encuentra ninguna coincidencia para la expresión regular
        console.log(
          'No se encontró ninguna coincidencia para la expresión regular.'
        );
      }
    });
  } else {
    console.log('No se encontraron bloques en el detalle del pedido.');
  }
};

const parsearMensajePedido = (
  mensaje: string,
  toppingsInfo: DataStateProps[],
  handleFormBurger: (value: DetallePedidoProps) => void
) => {
  // Expresiones regulares para encontrar las secciones relevantes
  const datosVendedorRegex =
    /Nombre:\s*(.*?)(?:\s*-\s*|\s+)Teléfono:\s*(.*?)(?:\s*-\s*|\s+)Forma de entrega:\s*(.*?)(?:\s*-\s*|\s+)Dirección:\s*(.*?)(?:\s*-\s*|\s+)Piso y número:\s*(.*?)(?:\s*-\s*|\s+)Referencias:\s*(.*?)(?:\s*-\s*|\s+)Forma de pago:\s*(.*?)(?:\s*-\s*|\s+)/;

  // Buscar coincidencias en el mensaje
  const datosVendedorMatch = datosVendedorRegex.exec(mensaje);

  // Extraer datos del vendedor y detalle del pedido
  const datosVendedor = datosVendedorMatch
    ? datosVendedorMatch.slice(1).map((value) => value.trim())
    : [];

  const telefono = datosVendedor[1];
  const direccion = datosVendedor[3];
  const metodoPago = datosVendedor[6];
  const piso = datosVendedor[4];
  const referencias = datosVendedor[5];

  const detallePedidoRegex = /Aquí está el detalle de mi pedido:(.*)/s;
  const detallePedidoMatch = mensaje.match(detallePedidoRegex);

  if (detallePedidoMatch && detallePedidoMatch[1]) {
    const detail = detallePedidoMatch[1].trim();
    procesarDetallePedido(detail, toppingsInfo, handleFormBurger);

    return {
      telefono,
      direccion,
      metodoPago,
      piso,
      referencias,
      aclaraciones: '',
      envio: '',
      hora: '',
    };
  } else {
    console.log('No se pudo encontrar el detalle del pedido en el mensaje.');
  }
};
interface PedidosWebProps {
  toppingsInfo: DataStateProps[];
  handleFormBurger: (value: DetallePedidoProps) => void;
  handleFormClient: (value: FormDataProps) => void;
}

export const PedidosWeb = ({
  toppingsInfo,
  handleFormBurger,
  handleFormClient,
}: PedidosWebProps) => {
  const [mensaje, setMensaje] = useState<string>('');
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Aquí puedes manejar la lógica para enviar los datos del formulario

    const infoClient = parsearMensajePedido(
      mensaje,
      toppingsInfo,
      handleFormBurger
    );
    if (infoClient) {
      handleFormClient(infoClient);
    } else {
      console.error('No se pudo obtener la información del cliente.');
    }
  };

  return (
    <form className="relative z-0 w-11/12 mb-2 mt-4" onSubmit={handleSubmit}>
      <label htmlFor="mensaje">Mensaje:</label>

      <input
        className="block py-2.5 px-2 w-full text-sm texk-black 900 bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
        type="text"
        id="mensaje"
        name="mensaje"
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)} // Agrega el evento onChange para actualizar el estado mensaje
      />
      <button
        type="submit"
        className="  text-custom-red p-4 bg-black font-black uppercase text-4x1 outline-none "
      >
        Analizar
      </button>
    </form>
  );
};
