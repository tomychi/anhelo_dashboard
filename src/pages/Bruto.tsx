import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import currencyFormat from "../helpers/currencyFormat";

export const Bruto = () => {
  const { orders } = useSelector((state: RootState) => state.data);

  // Función para sumar el total según el método de pago
  const sumarTotalPorMetodoPago = (metodoPago: string) => {
    return orders.reduce((total, order) => {
      if (order.metodoPago === metodoPago) {
        return total + order.total;
      }
      return total;
    }, 0);
  };

  const totalEfectivo = sumarTotalPorMetodoPago("efectivo");
  const totalVirtual = sumarTotalPorMetodoPago("mercadopago");

  const totalGeneral = totalEfectivo + totalVirtual;

  const porcentajeEfectivo = (totalEfectivo * 100) / totalGeneral;
  const porcentajeVirtual = (totalVirtual * 100) / totalGeneral;

  const metodosDePago = {
    Efectivo: totalEfectivo,
    Virtual: totalVirtual,
  };

  return (
    <div className="flex p-4 gap-4 justify-between flex-col w-full">
      {/* <Calendar /> */}
      <div className="w-full flex flex-col gap-4">
        <table className="h-min w-full font-coolvetica text-sm text-left rtl:text-right text-black">
          <thead className="text-xs uppercase text-black border border-red-main bg-custom-red ">
            <tr>
              <th scope="col" className="px-6 py-3">
                METODO DE PAGO
              </th>
              <th scope="col" className="px-6 py-3">
                MONTO
              </th>
              <th scope="col" className="px-6 py-3">
                PORCENTAJES
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(metodosDePago).map(([metodo, monto]) => {
              const porcentaje =
                metodo === "Efectivo" ? porcentajeEfectivo : porcentajeVirtual;
              return (
                <tr
                  key={metodo}
                  className="bg-black text-custom-red uppercase font-black border border-red-main"
                >
                  <th
                    scope="row"
                    className="px-6 py-4 font-black text-custom-red whitespace-nowrap"
                  >
                    {metodo}
                  </th>
                  <td className="px-6 py-4">{currencyFormat(monto)}</td>
                  <td className="px-6 py-4">{porcentaje.toFixed(2)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
