import { useState } from 'react';
import { updateTiempoEntregaForOrder } from '../../firebase/UploadOrder';
interface TiempoEntregadoEditableProps {
  tiempoEntregadoInicial: string;
  pedidoId: string;
  fecha: string;
}

export const TiempoEntregadoEditable = ({
  tiempoEntregadoInicial,
  pedidoId,
  fecha,
}: TiempoEntregadoEditableProps) => {
  // Estado para almacenar el tiempo de entrega actual y el nuevo tiempo de entrega que se está editando
  const [tiempoEntregado, setTiempoEntregado] = useState(
    tiempoEntregadoInicial
  );
  const [nuevoTiempoEntrega, setNuevoTiempoEntrega] = useState(
    tiempoEntregadoInicial
  );

  // Función para manejar el cambio en el nuevo tiempo de entrega
  const handleNuevoTiempoEntregaChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNuevoTiempoEntrega(event.target.value);
  };
  // Función para manejar la actualización del tiempo de entrega
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // Evita que el formulario se envíe de forma predeterminada

    // Llama a la función para actualizar el tiempo de entrega
    updateTiempoEntregaForOrder(fecha, pedidoId, nuevoTiempoEntrega)
      .then(() => {
        // Si la actualización es exitosa, actualiza el estado del tiempo de entrega actual
        setTiempoEntregado(nuevoTiempoEntrega);
        // Limpia el estado del nuevo tiempo de entrega
        setNuevoTiempoEntrega('');
      })
      .catch((error) => {
        // Maneja cualquier error que ocurra durante la actualización del tiempo de entrega
        console.error('Error actualizando el tiempo de entrega:', error);
      });
  };
  return (
    <div>
      {/* Muestra el tiempo de entrega actual y un formulario para editar el tiempo de entrega */}
      <p>Pedido entregado a las {tiempoEntregado}</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={nuevoTiempoEntrega}
          onChange={handleNuevoTiempoEntregaChange}
        />
        <button type="submit">Guardar</button>
      </form>
    </div>
  );
};
