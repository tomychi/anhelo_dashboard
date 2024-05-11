import Swal from 'sweetalert2';
import {
  marcarPedidoComoElaborado,
  marcarPedidoComoEmbalado,
  marcarPedidoComoEntregado,
} from '../../../firebase/ReadData';
import { obtenerDiferenciaHoraria } from '../../../helpers/dateToday';
import { useState } from 'react';
import { Descuento } from '../../Card/Descuento';
import { PedidoProps } from '../../../types/types';

const imprimirTicket = async (
  nuevoPedido: PedidoProps,
  setBotonDesactivado: React.Dispatch<React.SetStateAction<boolean>>,
  hora: string,
  id: string
) => {
  setBotonDesactivado(true);

  try {
    const response = await fetch('http://localhost:3000/imprimir', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nuevoPedido }),
    });

    if (response.ok) {
      const tiempo = obtenerDiferenciaHoraria(hora);
      await marcarPedidoComoElaborado(id, tiempo);
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
  } finally {
    // Habilita el botón nuevamente después de un tiempo (puedes ajustar el tiempo según tus necesidades)
    setTimeout(() => {
      setBotonDesactivado(false);
    }, 3000); // Después de 3 segundos (3000 milisegundos), el botón se habilita nuevamente
  }
};

interface CardComandaFooterProps {
  user: { email: string };
  comanda: PedidoProps;
}
export const CardComandaFooter = ({
  user,
  comanda,
}: CardComandaFooterProps) => {
  const { elaborado, id, fecha, tiempoEntregado, hora } = comanda;

  const [botonDesactivado, setBotonDesactivado] = useState(false);
  const [mostrarExtras, setMostrarExtras] = useState(false);

  return (
    <div>
      {user.email === 'cadetes@anhelo.com' ? (
        elaborado && (
          <div>
            {tiempoEntregado === undefined ? (
              <button
                onClick={() => {
                  marcarPedidoComoEntregado(id, fecha)
                    .then(() => {
                      Swal.fire({
                        icon: 'success',
                        title: 'ENTREGADOOOOOOOOOOOOOOOO',
                        text: `El pedido con ID ${id} ha sido entregado.`,
                      });
                    })
                    .catch(() => {
                      Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudo entrerga el pedido.',
                      });
                    });
                }}
                className={`bg-black w-full flex justify-center mt-4 ${
                  elaborado ? 'text-green-500' : 'text-custom-red'
                } font-black p-4  inline-flex items-center`}
              >
                <svg
                  className={`fill-current w-4 h-4 mr-2 ${
                    elaborado ? 'text-green-500' : 'text-custom-red'
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
                </svg>
                <span>ENTREGADO</span>
              </button>
            ) : null}
          </div>
        )
      ) : (
        <div>
          {elaborado && user.email === 'mostrador@anhelo.com' && (
            // mostrar un boton para decir pedido embalado
            <button
              onClick={() => {
                marcarPedidoComoEmbalado(id, fecha)
                  .then(() => {
                    Swal.fire({
                      icon: 'success',
                      title: 'EMBALADOOOOOOOOOOOOOOOO',
                      text: `El pedido con ID ${id} ha sido embalado.`,
                    });
                    setBotonDesactivado(true);
                  })
                  .catch(() => {
                    Swal.fire({
                      icon: 'error',
                      title: 'Error',
                      text: 'No se pudo embalar el pedido.',
                    });
                  })
                  .finally(() => {
                    setTimeout(() => {
                      setBotonDesactivado(false);
                    }, 3000);
                  });
              }}
              className={`bg-black w-full flex justify-center mt-4 ${
                elaborado ? 'text-green-500' : 'text-custom-red'
              } font-black p-4  inline-flex items-center`}
            >
              <svg
                className={`fill-current w-4 h-4 mr-2 ${
                  elaborado ? 'text-green-500' : 'text-custom-red'
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
              </svg>
              <span>EMBALADO</span>
            </button>
          )}
          <button
            onClick={() =>
              imprimirTicket(comanda, setBotonDesactivado, hora, id)
            }
            className={` bg-black w-full flex justify-center mt-14 ${
              elaborado ? 'text-green-500' : 'text-custom-red'
            } font-black p-4  inline-flex items-center`}
            disabled={botonDesactivado} // Desactiva el botón si el estado es true
          >
            <svg
              className={`fill-current w-4 h-4 mr-2 ${
                elaborado ? 'text-green-500' : 'text-custom-red'
              }`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
            </svg>
            <span>IMPRIMIR TICKET</span>
          </button>
          <div>
            {user.email === 'cadetes@anhelo.com' ? (
              <p>:</p>
            ) : (
              <div>
                {/* Botón para mostrar o ocultar la sección de EXTRAS */}
                <button
                  className=" font-black text-white w-full cursor-pointer mt-4 border-4 border-white"
                  onClick={() => setMostrarExtras(!mostrarExtras)}
                >
                  {mostrarExtras ? 'OCULTAR EXTRAS' : 'ACCIONES EXTRAS'}
                </button>

                {/* Renderizar la sección de EXTRAS si mostrarExtras es true */}
                {mostrarExtras && (
                  <div className="mt-4">
                    <Descuento fechaPedido={fecha} pedidoId={id} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
