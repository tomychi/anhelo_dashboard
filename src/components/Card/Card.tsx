import React, { useRef } from 'react';
import currencyFormat from '../../helpers/currencyFormat';
import { ComandaRareProps, PedidoProps } from '../../types/types';
import { useReactToPrint } from 'react-to-print';
import imgTicket from '../../assets/ticketAnhelo.png';

const CardPrintComponent = React.forwardRef<
  HTMLDivElement,
  { data: PedidoProps }
>(({ data }, ref) => {
  const {
    aclaraciones,
    direccion,
    metodoPago,
    total,
    telefono,
    detallePedido,
  } = data;

  return (
    <div ref={ref} className="hidden print:block">
      <img src={imgTicket} alt="ANHELO" />
      <div>
        <p style={{ fontWeight: 'bold' }}>PEDIDO:</p>
        {detallePedido.map(({ burger, toppings }, index) => (
          <div key={index}>
            <p>{burger}</p>
            <ul>
              {toppings.map((topping, i) => (
                <li key={i}>{topping}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div>
        <p style={{ fontWeight: 'bold' }}>ACLARACIONES:</p>
        <p>{aclaraciones.toUpperCase()}</p>
      </div>

      <div>
        <p style={{ fontWeight: 'bold' }}>
          DIRECCION: {direccion.toUpperCase()}
        </p>
      </div>

      <div>
        <p style={{ fontWeight: 'bold' }}>TELEFONO: {telefono.toUpperCase()}</p>
      </div>

      <div>
        <p style={{ fontWeight: 'bold' }}>METODO: {metodoPago.toUpperCase()}</p>
      </div>

      <div>
        <p style={{ fontWeight: 'bold' }}>TOTAL: {currencyFormat(total)}</p>
      </div>
    </div>
  );
});

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

  const componentRef = useRef<HTMLDivElement>(null);

  const imprimirTicket = useReactToPrint({
    content: () => componentRef.current,
  });

  return (
    <div
      className={`flex font-antonio uppercase flex-col justify-between max-w-sm  overflow-hidden ${
        elaborado ? 'bg-green-500 hover:bg-green-600' : 'bg-custom-red'
      }`}
    >
      <CardPrintComponent ref={componentRef} data={data} />
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
          onClick={imprimirTicket}
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
