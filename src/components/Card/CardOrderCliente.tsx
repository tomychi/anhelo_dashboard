import React from 'react';
import { PedidoProps } from '../../types/types';

interface CardOrderCliente {
  p: PedidoProps;
}

export const CardOrderCliente = ({ p }: CardOrderCliente) => {
  return (
    <div key={p.id} className="p-4 uppercase bg-red-main flex flex-col gap-1">
      <h3 className="text-lg font-black mb-2">Detalles del Pedido</h3>
      <p>
        <span className="font-black">ID del Pedido:</span> {p.id}
      </p>
      <p>
        <span className="font-black">Dirección:</span> {p.direccion}
      </p>
      <p>
        <span className="font-black">Aclaraciones:</span> {p.aclaraciones}
      </p>
      <p>
        <span className="font-black">Fecha:</span> {p.fecha}
      </p>

      <p>
        <span className="font-black">Método de Pago:</span> {p.metodoPago}
      </p>
      <p>
        <span className="font-black">Subtotal:</span> ${p.subTotal}
      </p>
      <p>
        <span className="font-black">Envío:</span> ${p.envio}
      </p>
      <p>
        <span className="font-black">Total:</span> ${p.total}
      </p>
      <p>
        <span className="font-black">Referencias:</span> {p.referencias}
      </p>
      <p>
        <span className="font-black">ubicacion:</span> {p.ubicacion}
      </p>
      {p.cadete && (
        <p>
          <span className="font-black">Cadete:</span> {p.cadete}
        </p>
      )}
      {p.dislike && (
        <p>
          <span className="font-black">Dislike:</span> {p.dislike}
        </p>
      )}
      {p.delay && (
        <p>
          <span className="font-black">Delay:</span> {p.delay}
        </p>
      )}
      <p>
        <span className="font-black">Hora:</span> {p.hora}
      </p>
      <p>
        <span className="font-black">Tiempo Elaborado:</span>{' '}
        {p.tiempoElaborado}
      </p>
      <p>
        <span className="font-black">Tiempo Entregado:</span>{' '}
        {p.tiempoEntregado}
      </p>
      <p>
        <span className="font-black">¿Entregado?:</span>{' '}
        {p.entregado ? 'Sí' : 'No'}
      </p>
    </div>
  );
};
