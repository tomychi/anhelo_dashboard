import { useEffect, useState } from "react";
import currencyFormat from "../../helpers/currencyFormat";
import { PedidoProps } from "../../types/types";
import { RegistroProps } from "../../pages/RegistroEmpleado";
import {
	EmpleadosProps,
	obtenerRegistroActual,
	readEmpleados,
} from "../../firebase/registroEmpleados";
import { copyToClipboard } from "../../helpers/copy";
import ScrollContainer from "./ScrollContainer";

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
				console.error("Error al cargar el registro:", error);
			}
		};

		cargarRegistro();
	}, []);

	// Determina si un empleado está activo (presente) o inactivo (ausente) en función del registro
	const empleadoActivo = (empleadoNombre: string) => {
		const empleado = registro.find(
			(registroEmpleado) => registroEmpleado.nombreEmpleado === empleadoNombre
		);
		if (empleado) {
			if (empleado.marcado) {
				// Si el empleado está marcado como presente
				return { activo: true, horaSalida: null };
			} else {
				// Si el empleado está ausente
				return { activo: false, horaSalida: empleado.horaSalida };
			}
		}
		// Si no se encuentra al empleado en el registro
		return { activo: false, horaSalida: null };
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
				<div className="flex items-center flex-row overflow-hidden">
					<ScrollContainer>
						<div className="flex flex-row gap-4 text-xs">
							{empleados.map((empleado, index) => {
								const { activo, horaSalida } = empleadoActivo(empleado.name);
								const horaEntrada = activo
									? (
											registro.find(
												(registroEmpleado) =>
													registroEmpleado.nombreEmpleado === empleado.name
											)?.horaEntrada || "Hora de entrada no disponible"
									  ).substring(0, 5) // Extraer solo HH:mm
									: "Ausente";
								const horaSalidaFormateada = horaSalida
									? horaSalida.substring(0, 5) // Extraer solo HH:mm
									: "Hora de salida no disponible";

								return (
									<div key={index} className="flex items-center flex-row">
										<div className="w-12 h-12 flex items-center justify-center rounded-full mr-2 relative">
											<div
												className={`w-8 h-8 rounded-none ${
													activo ? "bg-green-500" : "bg-red-main"
												}`}
											></div>
										</div>
										<div className="flex flex-col w-full">
											<p>{empleado.name}</p>
											{activo ? (
												<p className="flex items-center">
													<span className="mr-2">Ingreso</span> {horaEntrada} hs
												</p>
											) : (
												<p className="flex items-center">
													<span className="mr-2">Salida</span>{" "}
													{horaSalidaFormateada} hs
												</p>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</ScrollContainer>
				</div>
				; ;
				{cadeteSeleccionado && (
					<div>
						<p>
							Suma total de pedidos para {cadeteSeleccionado}:{" "}
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
							Suma total de pagos en efectivo para {cadeteSeleccionado}:{" "}
							{currencyFormat(sumaTotalEfectivo)}
						</p>
					</div>
				)}
			</div>
			<div className="border-b-2 border-red-main w-full"></div>
			<div>
				<p className="border-b-2 font-black w-max text-2xl border-red-main">
					PEDIDOS ENTREGADOS A TIEMPO: {Math.round(customerSuccess)}%
				</p>

				<p className=" border-b-2 font-black w-max text-xs  border-red-main">
					Promedio de tiempo de elaboración:{" "}
					{Math.round(promedioTiempoElaboracion)} minutos
				</p>
				<p className=" border-b-2 font-black w-max text-xs border-red-main">
					Promedio de tiempo de entrega total:{" "}
					{Math.round(promedioTiempoDeEntregaTotal(orders))} MINUTOS
				</p>
			</div>
		</div>
	);
};
