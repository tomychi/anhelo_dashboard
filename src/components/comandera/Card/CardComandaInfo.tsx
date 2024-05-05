import { useState } from 'react';
import currencyFormat from '../../../helpers/currencyFormat';
import { TiempoEditable } from '../../Card/TiempoEditable';

interface CardComandaInfoProps {
  direccion: string;
  piso: string;
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
  piso,
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

  return (
    <div>
      <div className="text-center flex flex-col w-full">
        <div className="flex flex-row w-full ">
          {/* Mostrar dirección por defecto */}
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

        {/* Mostrar el resto de la información solo si se hace clic en 'Ver más info' */}
        {mostrarInfoCompleta && (
          <div className="mt-4 mb-4 font-black text-white">
            <p className="text-base">Piso: {piso}</p>
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
                <p className="text-lg font-black">
                  MONTO: {currencyFormat(total)}
                </p>
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
