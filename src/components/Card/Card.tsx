import Swal from 'sweetalert2';
import currencyFormat from '../../helpers/currencyFormat';
import { ComandaRareProps, PedidoProps } from '../../types/types';
import { marcarPedidoComoElaborado } from '../../firebase/ReadData';

export const Card = ({ comanda }: ComandaRareProps) => {
  const { id, data } = comanda;

  const {
    aclaraciones,
    direccion,
    hora,
    metodoPago,
    total,
    telefono,
    detallePedido,
    elaborado,
  } = data;

  const imprimirTicket = async (nuevoPedido: PedidoProps) => {
    try {
      const response = await fetch('http://localhost:3000/imprimir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nuevoPedido }),
      });

      if (response.ok) {
        nuevoPedido.elaborado = true;
        Swal.fire({
          icon: 'success',
          title: 'Impresión exitosa',
          text: 'El ticket se imprimió correctamente',
        });

        if (!nuevoPedido.elaborado) {
          await marcarPedidoComoElaborado(id); // Llamamos a la función para marcar el pedido como elaborado
        }
      } else {
        console.error('Error al imprimir');
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un error al imprimir el ticket',
        });
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error en la solicitud',
      });
    }
  };

  return (
    <div
      className={`flex font-antonio uppercase flex-col justify-between max-w-sm  overflow-hidden ${
        elaborado ? 'bg-green-500 hover:bg-green-600' : 'bg-custom-red'
      }`}
    >
      <div className="p-4">
        <p className={`text-2xl  text-white font-bold float-right`}>{id}</p>
        <div className="mb-4">
          <p className={`text-2xl  text-white font-bold`}>{hora}</p>
          <p className="text-white mt-4 text-2xl text-center">
            {' '}
            {aclaraciones}
          </p>
        </div>
        {detallePedido.map(
          (
            { burger, toppings }: { burger: string; toppings: string[] },
            i: number
          ) => (
            <div key={i} className={`text-black text-base font-semibold`}>
              {burger}
              <p>
                {toppings.map((topping: string, toppingIndex: number) => (
                  <span key={toppingIndex} className="text-sm block">
                    - {topping}
                  </span>
                ))}
              </p>
            </div>
          )
        )}
      </div>
      <div className="px-6 py-4 text-center">
        <p
          className={`text-base ${
            elaborado ? 'text-green-700' : 'texk-black 700'
          }`}
        >
          {direccion}
        </p>
        <p
          className={`text-base ${
            elaborado ? 'text-green-700' : 'texk-black 700'
          }`}
        >
          {telefono}
        </p>
        <p
          className={`text-base ${
            elaborado ? 'text-green-700' : 'texk-black 700'
          }`}
        >
          {metodoPago}
        </p>
        <p
          className={`text-lg ${
            elaborado ? 'text-green-500' : 'text-black'
          } font-bold`}
        >
          {currencyFormat(total)}
        </p>
        <button
          onClick={() => imprimirTicket(data)}
          className={`mt-8 bg-black text-custom-red font-bold py-2 px-4  inline-flex items-center`}
        >
          <svg
            className={`fill-current w-4 h-4 mr-2 ${
              elaborado ? 'text-green-800' : 'texk-black 800'
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
          </svg>
          <span>IMPRIMIR TICKET</span>
        </button>
      </div>
    </div>
  );
};
