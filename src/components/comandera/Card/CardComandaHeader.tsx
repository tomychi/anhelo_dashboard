// Objetivo: Mostrar el header de la comanda

import Swal from "sweetalert2";
import { eliminarDocumento } from "../../../firebase/ReadData";
import { obtenerMinutosDesdeTiempo } from "../../../helpers/dateToday";
import { updateOrderTime } from "../../../firebase/UploadOrder";

interface CardComandaHeaderProps {
  user: { email: string };
  hora: string;
  id: string;
  fecha: string;
  minutosDeDemora: string;
  entregado: boolean;
  tiempoEntregado: string;
  tiempoElaborado: string;
}

export const CardComandaHeader = ({
  user,
  hora,
  id,
  fecha,
  minutosDeDemora,
  entregado,
  tiempoEntregado,
}: CardComandaHeaderProps) => {
  if (tiempoEntregado === undefined) {
    tiempoEntregado = "00:00";
  }

  const tiempoEntregaMinutos = obtenerMinutosDesdeTiempo(tiempoEntregado);
  const tiempoPedidoMinutos = obtenerMinutosDesdeTiempo(hora);
  const diferenciaTiempo = tiempoEntregaMinutos - tiempoPedidoMinutos;

  const convertirMinutosAHorasYMinutos = (minutosTotales: number): string => {
    const horas = Math.floor(minutosTotales / 60);
    const minutos = minutosTotales % 60;
    return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(
      2,
      "0"
    )}`;
  };

  const tiempoFormateado = convertirMinutosAHorasYMinutos(diferenciaTiempo);
  const handleUpdateTime = () => {
    Swal.fire({
      title: "Actualizar Hora",
      input: "text",
      inputLabel: "Nueva Hora (HH:MM)",
      inputValue: hora,
      showCancelButton: true,
      confirmButtonText: "Actualizar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value || !/^\d{2}:\d{2}$/.test(value)) {
          return "Por favor ingrese una hora válida en formato HH:MM";
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const nuevaHora = result.value;
        updateOrderTime(fecha, id, nuevaHora)
          .then(() => {
            Swal.fire({
              icon: "success",
              title: "Hora Actualizada",
              text: `La hora del pedido ha sido actualizada a ${nuevaHora}.`,
            });
          })
          .catch((error) => {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: `No se pudo actualizar la hora: ${error.message}`,
            });
          });
      }
    });
  };
  return (
    <div className="flex flex-col items-center gap-1 justify-center">
      <div className="flex flex-col  mb-7">
        {entregado ? (
          <div className="flex flex-col items-center">
            <p>Entro a las {hora} hs</p>
            <p className="text-4xl text-black font-black pr-1 pl-1">
              DEMORA: {tiempoFormateado} hs
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {minutosDeDemora.charAt(0) === "-" ? (
              <>
                <p>enviar a las {hora} hs</p>
                <p className="w-full mt-8 bg-black  pr-1 pl-1 pb-1 text-4xl text-center text-green-500 font-black">
                  NO ENVIAR AUN
                </p>
              </>
            ) : (
              <>
                <p>entro a las {hora} hs</p>
                <p className="text-4xl text-black font-black pr-1 pl-1">
                  DEMORA: {minutosDeDemora} HS
                </p>
              </>
            )}
          </div>
        )}

        <>
          <button onClick={handleUpdateTime} className="btn btn-primary">
            Actualizar Hora
          </button>

          <svg
            onClick={() =>
              Swal.fire({
                title: "¿Estás seguro?",
                text: "¡No podrás revertir esto!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Sí, eliminarlo",
                cancelButtonText: "Cancelar",
              }).then((result) => {
                if (result.isConfirmed) {
                  eliminarDocumento("pedidos", id, fecha)
                    .then(() => {
                      Swal.fire({
                        icon: "success",
                        title: "¡Eliminado!",
                        text: `El pedido con ID ${id} ha sido eliminado.`,
                      });
                    })
                    .catch(() => {
                      Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "No se pudo eliminar el pedido.",
                      });
                    });
                }
              })
            }
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="p-3 h-12 cursor-pointer  text-black"
          >
            <path
              fillRule="evenodd"
              d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
              clipRule="evenodd"
            />
          </svg>
        </>
      </div>
    </div>
  );
};
