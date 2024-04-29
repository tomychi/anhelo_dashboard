import React, { useEffect, useState } from 'react';
import {
  EmpleadosProps,
  marcarEntrada,
  marcarSalida,
  obtenerRegistroActual,
  readEmpleados,
} from '../firebase/registroEmpleados';

export interface RegistroProps {
  horaEntrada: string;
  nombreEmpleado: string;
  horaSalida: string;
  marcado: boolean;
}
export const RegistroEmpleado = () => {
  const [registro, setRegistro] = useState<RegistroProps[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadosProps[]>([]);

  useEffect(() => {
    const getEmpleados = async () => {
      const cade = await readEmpleados();
      setEmpleados(cade);
    };
    getEmpleados();
  }, []);

  useEffect(() => {
    const cargarRegistro = async () => {
      try {
        const datosRegistro = await obtenerRegistroActual();
        setRegistro(datosRegistro);
      } catch (error) {
        console.error('Error al cargar el registro:', error);
      }
    };

    cargarRegistro();
  }, [empleados]);

  const handleMarcarEntrada = async (index: number) => {
    const nombreEmpleado = empleados[index].name;
    await marcarEntrada(nombreEmpleado);
    setEmpleados((prevEmpleados) => {
      const nuevosEmpleados = [...prevEmpleados];
      return nuevosEmpleados;
    });
  };

  const handleMarcarSalida = async (index: number) => {
    const nombreEmpleado = empleados[index].name;
    await marcarSalida(nombreEmpleado);
    setEmpleados((prevEmpleados) => {
      const nuevosEmpleados = [...prevEmpleados];
      return nuevosEmpleados;
    });
  };

  return (
    <div className="font-antonio font-black ">
      {empleados.map((empleado, index) => {
        // Verifica si el name del empleado está presente en el registro del día actual
        const estaEnRegistro = registro.some(
          (registroEmpleado) =>
            registroEmpleado.nombreEmpleado === empleado.name
        );

        // Verifica si el empleado está marcado en el registro
        const empleadoMarcado = registro.find(
          (registroEmpleado) =>
            registroEmpleado.nombreEmpleado === empleado.name &&
            registroEmpleado.marcado
        );

        // Determina el color del fondo del botón basado en la presencia del empleado en el registro y su estado de marcado
        const colorFondo = empleadoMarcado ? 'bg-green-600' : 'bg-custom-red';

        return (
          <button
            key={index}
            className={`text-black mt-4 p-4 w-full ${colorFondo} font-black uppercase text-4x1 outline-none`}
            onClick={() =>
              estaEnRegistro
                ? handleMarcarSalida(index)
                : handleMarcarEntrada(index)
            }
          >
            {empleado.name}
          </button>
        );
      })}
    </div>
  );
};
