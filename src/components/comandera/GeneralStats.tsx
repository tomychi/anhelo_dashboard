import currencyFormat from "../../helpers/currencyFormat";
import { PedidoProps } from "../../types/types";

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
	return (
		<div className="text-custom-red uppercase font-antonio flex flex-col gap-4 mb-8">
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
			{cadeteSeleccionado && (
				<div>
					<p>
						Suma total de pedidos para {cadeteSeleccionado}: {sumaTotalPedidos}
					</p>
					<p>
						Suma total de pagos en efectivo para {cadeteSeleccionado}:{" "}
						{currencyFormat(sumaTotalEfectivo)}
					</p>
				</div>
			)}
			<div>
				<p className="border-b-2 font-black w-max border-red-main">
					PEDIDOS ENTREGADOS A TIEMPO: {Math.round(customerSuccess)}%
				</p>

				<p className=" border-b-2 font-black w-max  border-red-main">
					Promedio de tiempo de elaboración:{" "}
					{Math.round(promedioTiempoElaboracion)} minutos
				</p>
				<p className=" border-b-2 font-black w-max border-red-main">
					Promedio de tiempo de entrega total:{" "}
					{Math.round(promedioTiempoDeEntregaTotal(orders))} MINUTOS
				</p>
			</div>
		</div>
	);
};
