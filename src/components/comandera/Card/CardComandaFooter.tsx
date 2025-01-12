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
import { doc, getFirestore, runTransaction } from 'firebase/firestore';

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
    setTimeout(() => {
      setBotonDesactivado(false);
    }, 3000);
  }
};

interface CardComandaFooterProps {
  user: {
    email: string;
  };
  comanda: PedidoProps;
}

export const CardComandaFooter = ({
  user,
  comanda,
}: CardComandaFooterProps) => {
  const { elaborado, id, fecha, tiempoEntregado, hora, pendingOfBeingAccepted } = comanda;

  const [botonDesactivado, setBotonDesactivado] = useState(false);
  const [mostrarExtras, setMostrarExtras] = useState(false);

  const handleAcceptOrder = async () => {
    try {
      const firestore = getFirestore();
      const [dia, mes, anio] = fecha.split("/");
      const pedidoDocRef = doc(firestore, "pedidos", anio, mes, dia);

      await runTransaction(firestore, async (transaction) => {
        const pedidoDocSnapshot = await transaction.get(pedidoDocRef);
        if (!pedidoDocSnapshot.exists()) {
          throw new Error("No se encontró el documento del día en Firestore");
        }

        const pedidosDelDia = pedidoDocSnapshot.data()?.pedidos || [];
        const index = pedidosDelDia.findIndex(
          (pedido) => pedido.id === id
        );

        if (index !== -1) {
          pedidosDelDia[index].pendingOfBeingAccepted = false;
          transaction.set(pedidoDocRef, { pedidos: pedidosDelDia });
          
          Swal.fire({
            icon: 'success',
            title: 'Pedido Aceptado',
            text: `El pedido con ID ${id} ha sido aceptado.`,
          });
        } else {
          throw new Error("Pedido no encontrado");
        }
      });
    } catch (error) {
      console.error('Error al aceptar el pedido:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo aceptar el pedido.',
      });
    }
  };

  if (user.email === 'cadetes@anhelo.com') {
    return (
      <div>
        {elaborado && tiempoEntregado === undefined && (
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
                    text: 'No se pudo entregar el pedido.',
                  });
                });
            }}
            className={`bg-black w-full flex justify-center mt-4 ${
              elaborado ? 'text-green-500' : 'text-custom-red'
            } font-black p-4 inline-flex items-center`}
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
        )}
      </div>
    );
  }

  return (
    <div>
      {elaborado && user.email === 'mostrador@anhelo.com' && (
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
          } font-black p-4 inline-flex items-center`}
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

      {pendingOfBeingAccepted ? (
        <button
          onClick={handleAcceptOrder}
          className="bg-black w-full flex justify-center mt-14 text-blue-500 font-black p-4 inline-flex items-center"
          disabled={botonDesactivado}
        >
          <svg
            className="fill-current w-4 h-4 mr-2 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
          </svg>
          <span>ACEPTAR PEDIDO</span>
        </button>
      ) : (
        <button
          onClick={() => imprimirTicket(comanda, setBotonDesactivado, hora, id)}
          className={`bg-black w-full flex justify-center mt-14 ${
            elaborado ? 'text-green-500' : 'text-custom-red'
          } font-black p-4 inline-flex items-center`}
          disabled={botonDesactivado}
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
      )}

      {user.email !== 'cadetes@anhelo.com' && (
        <div>
          <button
            className="font-black text-white w-full cursor-pointer mt-4 border-4 border-white"
            onClick={() => setMostrarExtras(!mostrarExtras)}
          >
            {mostrarExtras ? 'OCULTAR EXTRAS' : 'ACCIONES EXTRAS'}
          </button>

          {mostrarExtras && (
            <div className="mt-4">
              <Descuento fechaPedido={fecha} pedidoId={id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};