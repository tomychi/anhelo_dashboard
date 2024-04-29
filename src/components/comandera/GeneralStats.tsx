import { useEffect, useState } from 'react';
import currencyFormat from '../../helpers/currencyFormat';
import { PedidoProps } from '../../types/types';
import { RegistroProps } from '../../pages/RegistroEmpleado';
import {
  EmpleadosProps,
  obtenerRegistroActual,
  readEmpleados,
} from '../../firebase/registroEmpleados';
import { copyToClipboard } from '../../helpers/copy';

interface GeneralStatsProps {
  customerSuccess: number;
  promedioTiempoElaboracion: number;
  promedioTiempoDeEntregaTotal: (orders: PedidoProps[]) => number;
  orders: PedidoProps[];
  cadeteSeleccionado: string;
  handleCadeteChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  cadetesUnicos: string[];
  sumaTotalPedidos: number;
  sumaTotalEfectivo: number;
}

export const GeneralStats = ({
  customerSuccess,
  promedioTiempoElaboracion,
  promedioTiempoDeEntregaTotal,
  orders,
  cadeteSeleccionado,
  handleCadeteChange,
  cadetesUnicos,
  sumaTotalPedidos,
  sumaTotalEfectivo,
}: GeneralStatsProps) => {
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
  }, []);
  // Determina si un empleado está activo (presente) o inactivo (ausente) en función del registro
  const empleadoActivo = (empleadoNombre: string) => {
    const empleado = registro.find(
      (registroEmpleado) => registroEmpleado.nombreEmpleado === empleadoNombre
    );
    return empleado && empleado.marcado; // Devuelve true si el empleado está en el registro y marcado como presente
  };

  return (
    <div className="text-custom-red uppercase font-antonio flex flex-col gap-4 mb-8">
      <div className="flex flex-col gap-2">
        <div className="flex w-max  flex-row border-2 pl-1.5 font-black border-red-main">
          <p>Filtrar por cadetes:</p>
          <select
            value={cadeteSeleccionado}
            onChange={handleCadeteChange}
            className="bg-black uppercase"
          >
            <option value="">Todos los cadetes</option>
            {cadetesUnicos.map((cadete: string, index: number) => {
              if (cadete === undefined) return;
              return (
                <option key={index} value={cadete}>
                  {cadete}
                </option>
              );
            })}
          </select>
        </div>
        {/* Seccion empleados activos */}
        <div className="flex flex-row gap-2">
          {empleados.map((empleado, index) => {
            const horaEntrada = empleadoActivo(empleado.name)
              ? registro.find(
                  (registroEmpleado) =>
                    registroEmpleado.nombreEmpleado === empleado.name
                )?.horaEntrada || 'Hora de entrada no disponible'
              : 'Ausente';
            return (
              <div key={index} className="flex items-center">
                <div
                  className={`w-3 h-3 ${
                    empleadoActivo(empleado.name)
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  } rounded-full mr-2`}
                ></div>
                <div>{`${empleado.name} (${horaEntrada})`}</div>
              </div>
            );
          })}
        </div>
        {cadeteSeleccionado && (
          <div>
            <p>
              Suma total de pedidos para {cadeteSeleccionado}:{' '}
              {sumaTotalPedidos}
            </p>
            <p
              className="cursor-pointer"
              onClick={() =>
                copyToClipboard(
                  `${cadeteSeleccionado}: ${currencyFormat(sumaTotalEfectivo)}`
                )
              }
            >
              Suma total de pagos en efectivo para {cadeteSeleccionado}:{' '}
              {currencyFormat(sumaTotalEfectivo)}
            </p>
          </div>
        )}
      </div>
      <div className="border-b-2 border-red-main w-full"></div>
      <div>
        <p className="border-b-2 font-black w-max border-red-main">
          PEDIDOS ENTREGADOS A TIEMPO: {Math.round(customerSuccess)}%
        </p>

        <p className=" border-b-2 font-black w-max  border-red-main">
          Promedio de tiempo de elaboración:{' '}
          {Math.round(promedioTiempoElaboracion)} minutos
        </p>
        <p className=" border-b-2 font-black w-max border-red-main">
          Promedio de tiempo de entrega total:{' '}
          {Math.round(promedioTiempoDeEntregaTotal(orders))} MINUTOS
        </p>
      </div>
    </div>
  );
};
