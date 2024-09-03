import { useState } from 'react';
import currencyFormat from '../../../helpers/currencyFormat';
import { TiempoEditable } from '../../Card/TiempoEditable';
import { updateTotalForOrder } from '../../../firebase/UploadOrder';
import Swal from 'sweetalert2';

interface CardComandaInfoProps {
  direccion: string;
  ubicacion: string;
  referencias: string;
  telefono: string;
  metodoPago: string;
  total: number;
  user: { email: string };
  id: string;
  fecha: string;
  tiempoElaborado: string;
  tiempoEntregado: string;
  updateTiempoElaboradoForOrder: (
    fechaPedido: string,
    pedidoId: string,
    nuevoTiempo: string
  ) => Promise<void>;
  updateTiempoEntregaForOrder: (
    fechaPedido: string,
    pedidoId: string,
    nuevoTiempo: string
  ) => Promise<void>;
  entregado: boolean;
}

export const CardComandaInfo = ({
  direccion,
  ubicacion,
  referencias,
  telefono,
  metodoPago,
  total,
  user,
  id,
  fecha,
  tiempoElaborado,
  tiempoEntregado,
  updateTiempoElaboradoForOrder,
  updateTiempoEntregaForOrder,
  entregado,
}: CardComandaInfoProps) => {
  const [mostrarInfoCompleta, setMostrarInfoCompleta] = useState(false);
  const [nuevoTotal, setNuevoTotal] = useState(total);
  const [editandoTotal, setEditandoTotal] = useState(false);

  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNuevoTotal(Number(e.target.value));
  };

  const handleGuardarTotal = async () => {
    try {
      await updateTotalForOrder(fecha, id, nuevoTotal); // Usa la función Firebase para actualizar el total
      Swal.fire({
        icon: 'success',
        title: 'Total actualizado',
        text: 'El total del pedido ha sido actualizado correctamente.',
      });
      setEditandoTotal(false);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al actualizar',
        text: `Hubo un problema al actualizar el total: ${error}`,
      });
    }
  };

  return (
    <div>
      <div className="text-center flex flex-col w-full">
        <div className="flex flex-row w-full ">
          <p
            className={`uppercase border-4 font-black ${
              mostrarInfoCompleta ? 'w-full' : 'w-2/3'
            } text-white border-white pl-1 pr-1`}
          >
            Dirección: {direccion}
          </p>

          {!mostrarInfoCompleta && (
            <button
              className="uppercase border-4 font-black w-1/3 text-white border-white pl-1 pr-1"
              onClick={() => setMostrarInfoCompleta(true)}
            >
              Ver más info
            </button>
          )}
        </div>

        {mostrarInfoCompleta && (
          <div className="mt-4 mb-4 font-black text-white">
            <p className="text-base">ubicacion: {ubicacion}</p>
            <p className="text-base">Referencias: {referencias}</p>
            <p className="text-base">
              TELEFONO:{' '}
              <a
                href={`tel:${telefono}`}
                className="text-blue-600 hover:underline"
              >
                {telefono}
              </a>
            </p>
            <div>
              <p className="text-base">Método de pago: {metodoPago}</p>
              {user.email === 'cadetes@anhelo.com' ? (
                metodoPago === 'efectivo' ? (
                  <p className="text-lg font-black">
                    MONTO: {currencyFormat(total)}
                  </p>
                ) : (
                  <p className="text-lg font-black">MONTO: Pagado</p>
                )
              ) : (
                <div className="text-lg font-black">
                  MONTO: {currencyFormat(nuevoTotal)}
                  {user.email === 'tomas.arcostanzo5@gmail.com' && (
                    <div className="mt-2">
                      {editandoTotal ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={nuevoTotal}
                            onChange={handleTotalChange}
                            className="p-1 text-black"
                          />
                          <button
                            onClick={handleGuardarTotal}
                            className="bg-green-500 text-white p-1 rounded"
                          >
                            Guardar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditandoTotal(true)}
                          className="bg-yellow-500 text-white p-1 rounded"
                        >
                          Editar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 w-full">
        {tiempoElaborado ? (
          <div className="w-full">
            <TiempoEditable
              title="Elaborado en"
              tiempoInicial={tiempoElaborado}
              pedidoId={id}
              fecha={fecha}
              updateTiempoForOrder={updateTiempoElaboradoForOrder}
            />
          </div>
        ) : null}
        {entregado && (
          <div className="w-full">
            <TiempoEditable
              title="Entregado a las"
              tiempoInicial={tiempoEntregado}
              pedidoId={id}
              fecha={fecha}
              updateTiempoForOrder={updateTiempoEntregaForOrder}
            />
          </div>
        )}
      </div>
    </div>
  );
};
