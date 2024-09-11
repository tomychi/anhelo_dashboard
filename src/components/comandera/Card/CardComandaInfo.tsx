import { useState } from 'react';
import currencyFormat from '../../../helpers/currencyFormat';
import { TiempoEditable } from '../../Card/TiempoEditable';
import { updateOrderFields } from '../../../firebase/UploadOrder';
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
  efectivoCantidad: number;
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
  direccion: initialDireccion,
  ubicacion: initialUbicacion,
  referencias: initialReferencias,
  telefono: initialTelefono,
  metodoPago: initialMetodoPago,
  total: initialTotal,
  efectivoCantidad: initialEfectivoCantidad,
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
  const [editando, setEditando] = useState(false);
  const [direccion, setDireccion] = useState(initialDireccion);
  const [ubicacion, setUbicacion] = useState(initialUbicacion);
  const [referencias, setReferencias] = useState(initialReferencias);
  const [telefono, setTelefono] = useState(initialTelefono);
  const [metodoPago, setMetodoPago] = useState(initialMetodoPago);
  const [total, setTotal] = useState(initialTotal);
  const [efectivoCantidad, setEfectivoCantidad] = useState(
    initialEfectivoCantidad
  );

  const canEdit = user.email === 'tomas.arcostanzo5@gmail.com';

  const handleGuardarCambios = async () => {
    try {
      await updateOrderFields(fecha, id, {
        direccion,
        ubicacion,
        referencias,
        telefono,
        metodoPago,
        total,
      });
      Swal.fire({
        icon: 'success',
        title: 'Cambios guardados',
        text: 'Los datos del pedido han sido actualizados correctamente.',
      });
      setEditando(false);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al actualizar',
        text: `Hubo un problema al actualizar los datos: ${error}`,
      });
    }
  };

  return (
    <div>
      <div className="text-center flex flex-col w-full">
        <div className="flex flex-row w-full">
          <p
            className={`uppercase border-4 font-black ${
              mostrarInfoCompleta ? 'w-full' : 'w-2/3'
            } text-white border-white pl-1 pr-1`}
          >
            Dirección:{' '}
            {editando ? (
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="text-black p-1"
              />
            ) : (
              direccion
            )}
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
            <p className="text-base">
              Ubicación:{' '}
              {editando ? (
                <input
                  type="text"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  className="text-black p-1"
                />
              ) : (
                ubicacion
              )}
            </p>
            <p className="text-base">
              Referencias:{' '}
              {editando ? (
                <input
                  type="text"
                  value={referencias}
                  onChange={(e) => setReferencias(e.target.value)}
                  className="text-black p-1"
                />
              ) : (
                referencias
              )}
            </p>
            <p className="text-base">
              TELEFONO:{' '}
              {editando ? (
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="text-black p-1"
                />
              ) : (
                <a
                  href={`tel:${telefono}`}
                  className="text-blue-600 hover:underline"
                >
                  {telefono}
                </a>
              )}
            </p>
            <div>
              <p className="text-base">
                Método de pago:{' '}
                {editando ? (
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="text-black p-1"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="mercadopago">Mercadopago</option>
                    <option value="ambos">Ambos</option>
                  </select>
                ) : (
                  metodoPago
                )}
              </p>
              {user.email === 'cadetes@anhelo.com' ? (
                metodoPago === 'efectivo' || metodoPago === 'ambos' ? (
                  <p className="text-lg font-black">
                    MONTO: {currencyFormat(efectivoCantidad)}
                  </p>
                ) : (
                  <p className="text-lg font-black">MONTO: Pagado</p>
                )
              ) : (
                <div className="text-lg font-black">
                  MONTO:{' '}
                  {editando ? (
                    <input
                      type="number"
                      value={total}
                      onChange={(e) => setTotal(Number(e.target.value))}
                      className="text-black p-1"
                    />
                  ) : (
                    currencyFormat(total)
                  )}
                  <p className="text-lg font-black">
                    {efectivoCantidad !== 0 ? (
                      <span>
                        MONTO EFECTIVO: {currencyFormat(efectivoCantidad)}
                      </span>
                    ) : null}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {canEdit && (
        <div className="mt-2">
          {editando ? (
            <button
              onClick={handleGuardarCambios}
              className="bg-green-500 text-white p-1 rounded"
            >
              Guardar Cambios
            </button>
          ) : (
            <button
              onClick={() => setEditando(true)}
              className="bg-yellow-500 text-white p-1 rounded"
            >
              Editar Información
            </button>
          )}
        </div>
      )}

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
