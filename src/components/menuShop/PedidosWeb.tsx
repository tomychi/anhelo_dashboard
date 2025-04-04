import { FormEvent, useState } from "react";
import { DetallePedidoProps, FormDataProps } from "../../pages/DynamicForm";
import { RootState } from "../../redux/configureStore";
import { useSelector } from "react-redux";
import { ProductStateProps } from "../../redux/products/productReducer";
import { obtenerHoraActual } from "../../helpers/dateToday";

const procesarToppings = (bloque: string) => {
  // Buscar los toppings usando una expresión regular
  const regex = /Toppings:\s*-\s*(.*?)(?=\n|$)/g;
  let match;
  const toppings = [];

  while ((match = regex.exec(bloque)) !== null) {
    // Dividir el texto del topping por el guion seguido de un espacio
    const toppingCompleto = match[1];

    // Limpiar el topping
    const toppingLimpio = toppingCompleto.replace(/:\s*\$.*/, "");

    // Dividir el topping en varios elementos del arreglo si hay varios toppings en una cadena
    const toppingsIndividuales = toppingLimpio.split(" - ");

    // Agregar cada topping individual al arreglo
    toppings.push(...toppingsIndividuales.map((t) => t.trim()));
  }

  return toppings;
};

const procesarDetallePedido = (
  detail: string,
  toppingsInfo: ProductStateProps[],
  data: ProductStateProps[],
  handleFormBurger: (value: DetallePedidoProps) => void
) => {
  const bloques = detail.match(/\d+x .*? : \$ \d+/g);
  if (bloques) {
    bloques.map((bloque) => {
      const match = bloque.match(/(\d+)x (.*?) : \$ (\d+)/);
      if (match !== null) {
        const quantity = parseInt(match[1]);
        let burger = match[2];

        // Aquí puedes usar quantity, burger y priceBurger...
        // Remover la parte de 'Toppings:' si está presente en el nombre de la hamburguesa
        const toppingsIndex = burger.indexOf(" Toppings:");
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
        const priceBurger = data.find((d) => d.data.name === burger)?.data
          .price;
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
        // console.log(
        //   "No se encontró ninguna coincidencia para la expresión regular."
        // );
      }
    });
  } else {
    // console.log("No se encontraron bloques en el detalle del pedido.");
  }
};

const ajustarHoraReserva = (horaReserva: string): string => {
  // Crear un objeto Date con la hora de reserva
  const [horas, minutos] = horaReserva.split(":").map(Number);
  const fechaReserva = new Date();
  fechaReserva.setHours(horas, minutos, 0, 0); // Asignar hora de reserva

  // Restar 30 minutos
  fechaReserva.setMinutes(fechaReserva.getMinutes() - 30);

  // Formatear la nueva hora en formato "HH:mm" (24 horas)
  const nuevaHora = fechaReserva
    .toLocaleTimeString([], {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    })
    .padStart(5, "0");

  return nuevaHora;
};

const parsearMensajePedido = (
  mensaje: string,
  toppingsInfo: ProductStateProps[],
  data: ProductStateProps[],
  handleFormBurger: (value: DetallePedidoProps) => void
) => {
  // Extraer cupón
  const cuponRegex = /Cupón:\s*(.*?)(?:\s*-|$)/;
  const cuponMatch = cuponRegex.exec(mensaje);
  const cupon = cuponMatch ? cuponMatch[1].trim() : "";

  // Expresión regular para los datos principales (sin los montos)
  const datosVendedorRegex =
    /Reserva:\s*(.*?)(?:\s*-\s*|\s+)Teléfono:\s*(.*?)(?:\s*-\s*|\s+)Forma de entrega:\s*(.*?)(?:\s*-\s*|\s+)Dirección:\s*(.*?)(?:\s*-\s*|\s+)Ubicación:\s*(.*?)(?:\s*-\s*|\s+)Referencias:\s*(.*?)(?:\s*-\s*|\s+)Forma de pago:\s*(.*?)(?:\s*-\s*|\s+)/;

  // Buscar coincidencias en el mensaje para los datos principales
  const datosVendedorMatch = datosVendedorRegex.exec(mensaje);

  // Si no se encuentran los datos principales, retornar null
  if (!datosVendedorMatch) {
    console.error("No se encontraron los datos principales del vendedor.");
    return null;
  }

  // Extraer datos del vendedor y detalle del pedido
  const datosVendedor = datosVendedorMatch
    .slice(1)
    .map((value) => value?.trim() || "");

  // Buscar montos en efectivo y transferencia de forma separada
  const efectivoRegex = /Monto en efectivo:\s*\$([\d.,]+)/;
  const transferenciaRegex = /Monto con transferencia:\s*\$([\d.,]+)/;

  const efectivoMatch = efectivoRegex.exec(mensaje);
  const transferenciaMatch = transferenciaRegex.exec(mensaje);

  // Asignar las variables de montos con valores por defecto si no se encuentran
  const efectivoCantidad = efectivoMatch
    ? efectivoMatch[1].replace(",", ".")
    : "";
  const mercadopagoCantidad = transferenciaMatch
    ? transferenciaMatch[1].replace(",", ".")
    : "";

  // Si el dato del vendedor es [0], ajustamos la hora
  const horaAjustada = datosVendedor[0]
    ? ajustarHoraReserva(datosVendedor[0])
    : obtenerHoraActual(); // Si no hay hora de reserva, usa la actual

  // Asignar el resto de las variables
  const hora = horaAjustada;
  const telefono = datosVendedor[1];
  const direccion = datosVendedor[3];
  const metodoPago = datosVendedor[6];
  const ubicacion = datosVendedor[4];
  const referencias = datosVendedor[5];

  // Extraer el detalle del pedido
  const detallePedidoRegex = /Aquí está el detalle de mi pedido:(.*)/s;
  const detallePedidoMatch = mensaje.match(detallePedidoRegex);

  if (detallePedidoMatch && detallePedidoMatch[1]) {
    const detail = detallePedidoMatch[1].trim();
    procesarDetallePedido(detail, toppingsInfo, data, handleFormBurger);

    return {
      cupon, // Aquí se devuelve el cupón extraído
      map: [0, 0] as [number, number],
      telefono,
      direccion,
      metodoPago,
      ubicacion,
      referencias,
      aclaraciones: "",
      efectivoCantidad,
      mercadopagoCantidad,
      envio: "",
      hora,
      cadete: "NO ASIGNADO",
    };
  } else {
    console.error("No se pudo encontrar el detalle del pedido.");
    return null;
  }
};
interface PedidosWebProps {
  handleFormBurger: (value: DetallePedidoProps) => void;
  handleFormClient: (value: FormDataProps) => void;
  setSeccionActiva: (value: string) => void;
}

export const PedidosWeb = ({
  handleFormBurger,
  handleFormClient,
  setSeccionActiva,
}: PedidosWebProps) => {
  const [mensaje, setMensaje] = useState<string>("");
  const { toppings } = useSelector((state: RootState) => state.product);
  const { burgers, drinks, fries } = useSelector(
    (state: RootState) => state.product
  );

  const data = [...burgers, ...drinks, ...fries];

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Aquí puedes manejar la lógica para enviar los datos del formulario

    const infoClient = parsearMensajePedido(
      mensaje,
      toppings,
      data,
      handleFormBurger
    );
    if (infoClient) {
      handleFormClient(infoClient);

      setSeccionActiva("elaborar");
    } else {
      console.error("No se pudo obtener la información del cliente.");
    }
  };

  const inputClass = `
		block px-4 h-12 w-full border-4 border-black rounded-lg  bg-gray-200
		appearance-none focus:outline-none focus:ring-0 peer
		placeholder-gray-400 placeholder-opacity-100
		 text-black font-light 
		autofill:bg-gray-200 autofill:text-black
		focus:bg-gray-200 focus:text-black
		hover:bg-gray-200 hover:text-black
	`;

  const inputStyle = {
    backgroundColor: "rgb(209 213 219)", // Equivalente a bg-gray-200
    color: "black",
  };

  return (
    <form className="relative z-0  p-4 " onSubmit={handleSubmit}>
      <input
        className={inputClass}
        style={inputStyle}
        type="text"
        id="mensaje"
        name="mensaje"
        placeholder="Mensaje"
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)} // Agrega el evento onChange para actualizar el estado mensaje
      />

      <button className="text-gray-100 w-full py-4 rounded-lg  bg-black text-4xl font-medium  mt-4">
        Obtener datos
      </button>
    </form>
  );
};
