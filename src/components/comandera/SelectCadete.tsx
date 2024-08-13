// componente para seleccionar un cadete
// se utiliza en el componente Comandera.tsx
import React, { ChangeEvent, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { updateCadeteForOrder } from '../../firebase/UploadOrder';
import { readEmpleados } from '../../firebase/registroEmpleados';
import { collection, getFirestore, onSnapshot } from 'firebase/firestore';

interface SelectCadeteProps {
  elaborado: boolean;
  cadete: string;
  fecha: string;
  id: string;
}

export const SelectCadete = ({
  elaborado,
  cadete,
  fecha,
  id,
}: SelectCadeteProps) => {
  const [selectedCadete, setSelectedCadete] = useState(cadete);
  const [cadetes, setCadetes] = useState<string[]>([]);

  // Función para obtener y filtrar cadetes
  const fetchCadetes = async () => {
    try {
      const empleados = await readEmpleados();
      const cadetesDisponibles = empleados
        .filter(
          (empleado) => empleado.category === 'cadete' && empleado.available
        )
        .map((empleado) => empleado.name);
      console.log(cadetesDisponibles);
      setCadetes(cadetesDisponibles);
    } catch (error) {
      console.error('Error al obtener los empleados:', error);
    }
  };

  // Llamar a la función fetchCadetes al montar el componente y cuando se actualice
  useEffect(() => {
    const firestore = getFirestore();

    fetchCadetes();

    // Aquí podrías agregar un listener para actualizar la lista de cadetes en tiempo real
    // Si estás utilizando Firestore, puedes agregar un listener en el useEffect

    // Ejemplo:
    const unsubscribe = onSnapshot(
      collection(firestore, 'empleados'),
      fetchCadetes
    );
    return () => unsubscribe();
  }, []);
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
