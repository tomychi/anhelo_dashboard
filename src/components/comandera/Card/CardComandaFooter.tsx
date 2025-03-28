import Swal from "sweetalert2";
import {
  marcarPedidoComoElaborado,
  marcarPedidoComoEmbalado,
  marcarPedidoComoEntregado,
} from "../../../firebase/ReadData";
import { obtenerDiferenciaHoraria } from "../../../helpers/dateToday";
import { useState } from "react";
import { Descuento } from "../../Card/Descuento";
import { PedidoProps } from "../../../types/types";
import { doc, getFirestore, runTransaction } from "firebase/firestore";

const imprimirTicket = async (
  nuevoPedido: PedidoProps,
  setBotonDesactivado: React.Dispatch<React.SetStateAction<boolean>>,
  hora: string,
  id: string
) => {
  setBotonDesactivado(true);

  try {
    const response = await fetch("http://localhost:3000/imprimir", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nuevoPedido }),
    });

    if (response.ok) {
      const tiempo = obtenerDiferenciaHoraria(hora);
      await marcarPedidoComoElaborado(id, tiempo);
    } else {
      console.error("Error al imprimir");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un error al imprimir el ticket",
      });
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Hubo un error en la solicitud",
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
  const {
    elaborado,
    id,
    fecha,
    tiempoEntregado,
    hora,
    pendingOfBeingAccepted,
  } = comanda;

  const [botonDesactivado, setBotonDesactivado] = useState(false);
  const [mostrarExtras, setMostrarExtras] = useState(false);

  const handleOrderAction = async (action: "accept" | "reject") => {
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
        const index = pedidosDelDia.findIndex((pedido) => pedido.id === id);

        if (index !== -1) {
          pedidosDelDia[index].pendingOfBeingAccepted = false;
          if (action === "accept") {
            pedidosDelDia[index].aceptado = true;
          } else {
            pedidosDelDia[index].rechazado = true;
          }
          transaction.set(pedidoDocRef, { pedidos: pedidosDelDia });

          Swal.fire({
            icon: "success",
            title: action === "accept" ? "Pedido Aceptado" : "Pedido Rechazado",
            text: `El pedido con ID ${id} ha sido ${action === "accept" ? "aceptado" : "rechazado"}.`,
          });
        } else {
          throw new Error("Pedido no encontrado");
        }
      });
    } catch (error) {
      console.error("Error al procesar el pedido:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo procesar el pedido.",
      });
    }
  };

  return (
    <div>
      {pendingOfBeingAccepted ? (
        <div className="flex gap-2 mt-14">
          <button
            onClick={() => handleOrderAction("accept")}
            className="bg-black w-full flex justify-center text-green-500 font-black p-4 inline-flex items-center"
            disabled={botonDesactivado}
          >
            <svg
              className="fill-current w-4 h-4 mr-2 text-green-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
            </svg>
            <span>ACEPTAR</span>
          </button>

          <button
            onClick={() => handleOrderAction("reject")}
            className="bg-black w-full flex justify-center text-red-500 font-black p-4 inline-flex items-center"
            disabled={botonDesactivado}
          >
            <svg
              className="fill-current w-4 h-4 mr-2 text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M10 8.586L2.929 1.515 1.515 2.929 8.586 10l-7.071 7.071 1.414 1.414L10 11.414l7.071 7.071 1.414-1.414L11.414 10l7.071-7.071-1.414-1.414L10 8.586z" />
            </svg>
            <span>RECHAZAR</span>
          </button>
        </div>
      ) : (
        <button
          onClick={() => imprimirTicket(comanda, setBotonDesactivado, hora, id)}
          className={`bg-black w-full flex justify-center mt-14 ${
            elaborado ? "text-green-500" : "text-custom-red"
          } font-black p-4 inline-flex items-center`}
          disabled={botonDesactivado}
        >
          <svg
            className={`fill-current w-4 h-4 mr-2 ${
              elaborado ? "text-green-500" : "text-custom-red"
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
          </svg>
          <span>IMPRIMIR TICKET</span>
        </button>
      )}

      <div>
        <button
          className="font-black text-white w-full cursor-pointer mt-4 border-4 border-white"
          onClick={() => setMostrarExtras(!mostrarExtras)}
        >
          {mostrarExtras ? "OCULTAR EXTRAS" : "ACCIONES EXTRAS"}
        </button>

        {mostrarExtras && (
          <div className="mt-4">
            <Descuento fechaPedido={fecha} pedidoId={id} />
          </div>
        )}
      </div>
    </div>
  );
};
