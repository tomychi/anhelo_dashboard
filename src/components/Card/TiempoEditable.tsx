import { useState } from 'react';
import { RootState } from '../../redux/configureStore';
import { useSelector } from 'react-redux';

export interface TiempoEditableProps {
  title: string;
  tiempoInicial: string;
  pedidoId: string;
  fecha: string;
  updateTiempoForOrder: (
    fechaPedido: string,
    pedidoId: string,
    nuevoTiempo: string
  ) => Promise<void>;
}

export const TiempoEditable = ({
  title,
  tiempoInicial,
  pedidoId,
  fecha,
  updateTiempoForOrder,
}: TiempoEditableProps) => {
  // Estado para almacenar el tiempo actual y el nuevo tiempo que se está editando
  const [tiempo, setTiempo] = useState(tiempoInicial);
  const [nuevoTiempo, setNuevoTiempo] = useState(tiempoInicial);
  const user = useSelector((state: RootState) => state.auth.user);

  // Función para manejar el cambio en el nuevo tiempo
  const handleNuevoTiempoChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNuevoTiempo(event.target.value);
  };

  // Función para manejar la actualización del tiempo
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // Evita que el formulario se envíe de forma predeterminada

    // Llama a la función para actualizar el tiempo
    updateTiempoForOrder(fecha, pedidoId, nuevoTiempo)
      .then(() => {
        // Si la actualización es exitosa, actualiza el estado del tiempo actual
        setTiempo(nuevoTiempo);
        // Limpia el estado del nuevo tiempo
        setNuevoTiempo('');
      })
      .catch((error) => {
        // Maneja cualquier error que ocurra durante la actualización del tiempo
        console.error('Error actualizando el tiempo:', error);
      });
  };

  return (
    <div>
      {/* Muestra el tiempo actual y un formulario para editarlo */}
      <p>{`${title}: ${tiempo}`}</p>
      {user.email === 'cadetes@anhelo.com' ? null : (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={nuevoTiempo}
            onChange={handleNuevoTiempoChange}
          />
          <button type="submit">Guardar</button>
        </form>
      )}
    </div>
  );
};
