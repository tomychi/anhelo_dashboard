import Swal from 'sweetalert2';
import currencyFormat from '../../helpers/currencyFormat';
import { ComandaRareProps, PedidoProps } from '../../types/types';
import {
  eliminarDocumento,
  marcarPedidoComoElaborado,
} from '../../firebase/ReadData';
import { ChangeEvent, useEffect, useState } from 'react';
import {
  updateCadeteForOrder,
  updateDelayForOrder,
  updateDislikeForOrder,
} from '../../firebase/UploadOrder';
import { addCadete, readCadetes } from '../../firebase/Cadetes';
import { obtenerDiferenciaHoraria } from '../../helpers/dateToday';

const copyToClipboard = (textToCopy: string) => {
  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      Swal.fire({
        icon: 'success',
        title: 'Copiado',
        text: 'Texto copiado al portapapeles',
      });
    })
    .catch((error) => {
      console.error('Error copying to clipboard:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error al copiar al portapapeles',
      });
    });
};

export const Card = ({ comanda }: ComandaRareProps) => {
  const {
    aclaraciones,
    direccion,
    hora,
    metodoPago,
    total,
    telefono,
    detallePedido,
    elaborado,
    referencias,
    id,
    piso,
    fecha,
    cadete,
    tiempoElaborado,
  } = comanda;
  const [selectedCadete, setSelectedCadete] = useState(cadete);
  const [nuevoCadete, setNuevoCadete] = useState('');
  const [cadetes, setCadetes] = useState<string[]>([]);

  useEffect(() => {
    const getCadetes = async () => {
      const cade = await readCadetes();
      setCadetes(cade);
    };
    getCadetes();
  }, []);

  const handleNuevoCadeteChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNuevoCadete(event.target.value);
  };

  const agregarNuevoCadete = () => {
    // Aquí puedes agregar la lógica para crear un nuevo cadete con el valor de nuevoCadete
    addCadete(nuevoCadete)
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'CADETE AGREGADO',
          text: `SE AGREGO: ${nuevoCadete} `,
        });
        setCadetes((prev) => [...prev, nuevoCadete]);
      })
      .catch(() => {
        console.error('Error al crear el cadete:');
      });
    setNuevoCadete('');
  };

  // Manejar el cambio en el select
  const handleCadeteChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nuevoCadete = event.target.value;

    if (nuevoCadete === 'default') {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Elegi un cadete',
      });
      setSelectedCadete('default');

      return;
    }

    if (nuevoCadete === 'nuevo') {
      // El usuario eligió agregar un nuevo cadete, restablecer el estado para el nuevo cadete
      setSelectedCadete('nuevo');
      return;
    }
    setSelectedCadete(nuevoCadete);

    // Aquí debes obtener la fecha del pedido y el ID del pedido según tu implementación

    // Luego llama a la función para actualizar el cadete en la base de datos
    updateCadeteForOrder(fecha, id, nuevoCadete)
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'CADETE ASIGNADO',
          text: `El viaje lo lleva: ${nuevoCadete} `,
        });
      })
      .catch(() => {
        console.error('Error al actualizar el cadete del pedido:');
      });
  };
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
    }
  };

  const handleCopyIconClick = (textToCopy: string) => {
    copyToClipboard(textToCopy);
    Swal.fire({
      icon: 'success',
      title: 'Copiado',
      text: 'Texto copiado al portapapeles',
    });
  };

  return (
    <div
      className={`flex justify-center font-antonio uppercase flex-col  max-w-sm  overflow-hidden h-min p-4 ${
        elaborado ? 'bg-green-500 hover:bg-green-600' : 'bg-custom-red'
      }`}
    >
      <div className="relative">
        {elaborado ? (
          <div className="absolute top-1 left-1 flex flex-row gap-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 cursor-pointer bg-red-500"
              onClick={() =>
                updateDelayForOrder(fecha, id, true)
                  .then(() => {
                    Swal.fire({
                      icon: 'success',
                      title: 'DELAY',
                      text: `Llego tarde el pedido: ${id} `,
                    });
                  })
                  .catch(() => {
                    Swal.fire({
                      icon: 'error',
                      title: 'DELAY',
                      text: `no se subio `,
                    });
                  })
              }
            >
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
                clipRule="evenodd"
              />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 cursor-pointer bg-red-500"
              onClick={() =>
                updateDislikeForOrder(fecha, id, true)
                  .then(() => {
                    Swal.fire({
                      icon: 'success',
                      title: 'DISLIKE',
                      text: `No gusto el pedido: ${id} `,
                    });
                  })
                  .catch(() => {
                    Swal.fire({
                      icon: 'error',
                      title: 'DISLIKEE',
                      text: `no se subio `,
                    });
                  })
              }
            >
              <path d="M15.73 5.5h1.035A7.465 7.465 0 0 1 18 9.625a7.465 7.465 0 0 1-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 0 1-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.499 4.499 0 0 0-.322 1.672v.633A.75.75 0 0 1 9 22a2.25 2.25 0 0 1-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H3.622c-1.026 0-1.945-.694-2.054-1.715A12.137 12.137 0 0 1 1.5 12.25c0-2.848.992-5.464 2.649-7.521C4.537 4.247 5.136 4 5.754 4H9.77a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23ZM21.669 14.023c.536-1.362.831-2.845.831-4.398 0-1.22-.182-2.398-.52-3.507-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977a8.958 8.958 0 0 1-1.302 4.666c-.245.403.028.959.5.959h1.053c.832 0 1.612-.453 1.918-1.227Z" />
            </svg>
          </div>
        ) : null}

        <div className="absolute top-1 right-1 flex flex-row gap-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6 cursor-pointer"
            onClick={() =>
              handleCopyIconClick(
                `Hora: ${hora}\nAclaraciones: ${aclaraciones}\nDireccion: ${direccion}\nPiso: ${piso}\nReferencias: ${referencias}\nTelefono: ${telefono}\nMetodo de pago: ${metodoPago}\nTotal: ${currencyFormat(
                  total
                )}`
              )
            }
          >
            <path
              fillRule="evenodd"
              d="M10.5 3A1.501 1.501 0 0 0 9 4.5h6A1.5 1.5 0 0 0 13.5 3h-3Zm-2.693.178A3 3 0 0 1 10.5 1.5h3a3 3 0 0 1 2.694 1.678c.497.042.992.092 1.486.15 1.497.173 2.57 1.46 2.57 2.929V19.5a3 3 0 0 1-3 3H6.75a3 3 0 0 1-3-3V6.257c0-1.47 1.073-2.756 2.57-2.93.493-.057.989-.107 1.487-.15Z"
              clipRule="evenodd"
            />
          </svg>

          <svg
            onClick={() =>
              Swal.fire({
                title: '¿Estás seguro?',
                text: '¡No podrás revertir esto!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminarlo',
                cancelButtonText: 'Cancelar',
              }).then((result) => {
                if (result.isConfirmed) {
                  eliminarDocumento('pedidos', id)
                    .then(() => {
                      Swal.fire({
                        icon: 'success',
                        title: '¡Eliminado!',
                        text: `El pedido con ID ${id} ha sido eliminado.`,
                      });
                    })
                    .catch(() => {
                      Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudo eliminar el pedido.',
                      });
                    });
                }
              })
            }
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6 cursor-pointer"
          >
            <path
              fillRule="evenodd"
              d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="mb-8 flex justify-center">
          <p className={`text-2xl text-white font-black block`}>{hora}</p>
          {tiempoElaborado ? (
            <div className="top-1 flex flex-row gap-4 items-center">
              <p
                className={`text-2xl text-white font-black block flex items-center`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6 block"
                >
                  <path
                    fillRule="evenodd"
                    d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
                    clipRule="evenodd"
                  />
                </svg>
                {tiempoElaborado}
              </p>
            </div>
          ) : null}
          <p className="bg-black mt-4  text-2xl text-center text-green-500">
            {aclaraciones}
          </p>
        </div>
        {detallePedido.map(
          (
            {
              burger,
              toppings,
              quantity,
            }: { burger: string; toppings: string[]; quantity: number },
            i: number
          ) => (
            <div key={i} className="flex mt-4 items-center flex-col">
              <p className="text-black text-base  font-black">
                {quantity}X {burger}
              </p>
              <p>
                {toppings.map((topping: string, toppingIndex: number) => (
                  <span
                    key={toppingIndex}
                    className="text-sm flex justify-center"
                  >
                    - {topping}
                  </span>
                ))}
              </p>
            </div>
          )
        )}
      </div>
      <div className=" mt-8 text-center">
        <p
          className={`text-base ${
            elaborado ? 'text-green-700' : 'text-black 700'
          }`}
        >
          Direccion: {direccion}
        </p>
        <p
          className={`text-base ${
            elaborado ? 'text-green-700' : 'text-black 700'
          }`}
        >
          Piso: {piso}
        </p>
        <p
          className={`text-base ${
            elaborado ? 'text-green-700' : 'text-black 700'
          }`}
        >
          Referencias: {referencias}
        </p>
        <p
          className={`text-base ${
            elaborado ? 'text-green-700' : 'text-black 700'
          }`}
        >
          TELEFONO: {telefono}
        </p>
        <p
          className={`text-base ${
            elaborado ? 'text-green-700' : 'text-black 700'
          }`}
        >
          Metodo de pago: {metodoPago}
        </p>
        <p
          className={`text-lg ${
            elaborado ? 'text-green-700' : 'text-black'
          } font-black`}
        >
          {currencyFormat(total)}
        </p>
        <div className="mt-8 uppercase font-black gap-2 flex flex-row justify-center">
          <label htmlFor="cadete">Cadete:</label>
          <select
            id="cadete"
            name="cadete"
            value={selectedCadete}
            onChange={handleCadeteChange}
            className="bg-black text-custom-red  uppercase"
          >
            <option value={cadete} defaultValue={cadete}>
              {cadete}
            </option>
            {cadetes.map((c, i) => {
              if (c === cadete) return null;
              return (
                <option value={c} key={i}>
                  {c}
                </option>
              );
            })}
            <option value="nuevo">Agregar nuevo cadete</option>
          </select>
          {/* Agregar campo para ingresar el nombre del nuevo cadete */}
          {selectedCadete === 'nuevo' && (
            <div>
              <input
                type="text"
                value={nuevoCadete}
                onChange={handleNuevoCadeteChange}
              />
              <button onClick={agregarNuevoCadete}>Agregar</button>
            </div>
          )}
        </div>
        <button
          onClick={() => imprimirTicket(comanda)}
          className={` bg-black w-full flex justify-center mt-4 ${
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
          <span>IMPRIMIR TICKET</span>
        </button>
      </div>
    </div>
  );
};
