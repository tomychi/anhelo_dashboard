// componente para seleccionar un cadete
// se utiliza en el componente Comandera.tsx
import React, { ChangeEvent, useState } from 'react';
import Swal from 'sweetalert2';
import { updateCadeteForOrder } from '../../firebase/UploadOrder';

interface SelectCadeteProps {
  elaborado: boolean;
  cadete: string;
  fecha: string;
  id: string;
  cadetes: string[];
}

export const SelectCadete = ({
  elaborado,
  cadete,
  fecha,
  id,
  cadetes,
}: SelectCadeteProps) => {
  const [selectedCadete, setSelectedCadete] = useState(cadete);

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

  return (
    <div className="mt-4 w-full uppercase font-black gap-2 flex flex-row justify-center">
      <label htmlFor="cadete" className="text-white">
        Cadete:
      </label>
      <select
        id="cadete"
        name="cadete"
        value={selectedCadete}
        onChange={handleCadeteChange}
        className={` bg-white  w-full uppercase rounded-none flex flex-row gap-4 ${
          elaborado ? 'text-green-500' : 'text-custom-red'
        } font-black  `}
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
      </select>
    </div>
  );
};
