import currencyFormat from '../../helpers/currencyFormat';
import { PedidoProps } from '../../types/types';
import { EmpleadosProps } from '../../firebase/registroEmpleados';
import { copyToClipboard } from '../../helpers/copy';

interface GeneralStatsProps {
  customerSuccess: number;
  orders: PedidoProps[];
  cadeteSeleccionado: string | null;
  sumaTotalPedidos: number;
  sumaTotalEfectivo: number;
  empleados: EmpleadosProps[];
}

export const GeneralStats = ({
  customerSuccess,
  cadeteSeleccionado,
  sumaTotalPedidos,
  sumaTotalEfectivo,
}: GeneralStatsProps) => {
  return (
    <div className="text-custom-red uppercase font-antonio flex flex-col gap-4 mb-2">
      {cadeteSeleccionado && (
        <div>
          <div></div>
          <p>
            Suma total de pedidos para {cadeteSeleccionado}: {sumaTotalPedidos}
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
      <div className="mt-4">
        <p className="border-b-2 w-fit  font-black  text-2xl border-red-main">
          ENTREGAS A TIEMPO:{' '}
          {isNaN(customerSuccess) ? '0%' : Math.round(customerSuccess) + '%'}
        </p>
      </div>
    </div>
  );
};
