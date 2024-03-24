import { useState } from 'react';
import {updateCompesasionForOrder} from "../../firebase/UploadOrder"

interface DescuentoProps {
  fechaPedido: string 
    pedidoId: string
}

export const	Descuento = ({fechaPedido, pedidoId}: DescuentoProps) => {
  const [bonificacion, setBonificacion] = useState('');
  const [compensacionPorError, setCompensacionPorError] = useState(0);
   const handleSubmit = () => {
    updateCompesasionForOrder(fechaPedido, pedidoId, compensacionPorError, bonificacion)
      .then(() => {
        console.log('Datos actualizados correctamente en la base de datos');
        // Aquí puedes realizar cualquier acción adicional después de enviar los datos
      })
      .catch(error => {
        console.error('Error al actualizar datos en la base de datos:', error);
      });
  };
	return	(
		    <div>
      <h2>Ingrese Bonificación y Compensación por Error</h2>
      <div>
        <label htmlFor="bonificacion">Bonificación:</label>
        <input
          type="text"
          id="bonificacion"
          value={bonificacion}
          onChange={e => setBonificacion(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="compensacionPorError">Compensación por Error:</label>
        <input
          type="number"
          id="compensacionPorError"
          value={compensacionPorError}
          onChange={e => setCompensacionPorError(parseInt(e.target.value))}
        />
      </div>
          <button onClick={()=> handleSubmit()}>Enviar a la base de datos</button>
    </div>
	)
}

