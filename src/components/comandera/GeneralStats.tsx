import currencyFormat from "../../helpers/currencyFormat";
import { PedidoProps } from "../../types/types";
import { EmpleadosProps } from "../../firebase/registroEmpleados";
import { copyToClipboard } from "../../helpers/copy";

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
		<div className="text-black font-coolvetica flex flex-col gap-4 mb-2">
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
						Suma total de pagos en efectivo para {cadeteSeleccionado}:{" "}
						{currencyFormat(sumaTotalEfectivo)}
					</p>
				</div>
			)}
			<div className="mt-4">
				<p className=" w-fit  font-black  text-2xl text-black font-coolvetica">
					Entregas a tiempo:{" "}
					{isNaN(customerSuccess) ? "0%" : Math.round(customerSuccess) + "%"}
				</p>
			</div>
		</div>
	);
};
