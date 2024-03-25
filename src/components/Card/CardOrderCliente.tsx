import React from 'react';
import { PedidoProps } from '../../types/types';

interface CardOrderCliente {
  p: PedidoProps;
}

export const CardOrderCliente = ({ p }: CardOrderCliente) => {
  return (
    <div key={p.id} className="border rounded-md p-4 mb-4 bg-gray-100">
      <h3 className="text-lg font-semibold mb-2">Detalles del Pedido</h3>
      <p>
        <span className="font-semibold">ID del Pedido:</span> {p.id}
      </p>
      <p>
        <span className="font-semibold">Dirección:</span> {p.direccion}
      </p>
      <p>
        <span className="font-semibold">Aclaraciones:</span> {p.aclaraciones}
      </p>
      <p>
        <span className="font-semibold">Fecha:</span> {p.fecha}
      </p>

      <p>
        <span className="font-semibold">Método de Pago:</span> {p.metodoPago}
      </p>
      <p>
        <span className="font-semibold">Subtotal:</span> ${p.subTotal}
      </p>
      <p>
        <span className="font-semibold">Envío:</span> ${p.envio}
      </p>
      <p>
        <span className="font-semibold">Total:</span> ${p.total}
      </p>
      <p>
        <span className="font-semibold">Referencias:</span> {p.referencias}
      </p>
      <p>
        <span className="font-semibold">Piso:</span> {p.piso}
      </p>
      {p.cadete && (
        <p>
          <span className="font-semibold">Cadete:</span> {p.cadete}
        </p>
      )}
      {p.dislike && (
        <p>
          <span className="font-semibold">Dislike:</span> {p.dislike}
        </p>
      )}
      {p.delay && (
        <p>
          <span className="font-semibold">Delay:</span> {p.delay}
        </p>
      )}
      <p>
        <span className="font-semibold">Hora:</span> {p.hora}
      </p>
      <p>
        <span className="font-semibold">Tiempo Elaborado:</span>{' '}
        {p.tiempoElaborado}
      </p>
      <p>
        <span className="font-semibold">Tiempo Entregado:</span>{' '}
        {p.tiempoEntregado}
      </p>
      <p>
        <span className="font-semibold">¿Entregado?:</span>{' '}
        {p.entregado ? 'Sí' : 'No'}
      </p>
    </div>
  );
};
