import { useEffect, useState } from "react";
import currencyFormat from "../../helpers/currencyFormat";
import { PedidoProps } from "../../types/types";
import { RegistroProps } from "../../pages/Empleados";
import {
	EmpleadosProps,
	obtenerRegistroActual,
} from "../../firebase/registroEmpleados";
import { copyToClipboard } from "../../helpers/copy";
import ScrollContainer from "./ScrollContainer";

interface GeneralStatsProps {
	customerSuccess: number;
	orders: PedidoProps[];
	cadeteSeleccionado: string | null;
	sumaTotalPedidos: number;
	sumaTotalEfectivo: number;
	empleados: EmpleadosProps[];
	promedioTiempoEntrega: string;
}

export const GeneralStats = ({
	customerSuccess,
	cadeteSeleccionado,
	sumaTotalPedidos,
	sumaTotalEfectivo,
	promedioTiempoEntrega,
}: GeneralStatsProps) => {
	const [registro, setRegistro] = useState<RegistroProps[]>([]);

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

	const empleadoActivo = (empleadoNombre: string) => {
		const empleado = registro.find(
			(registroEmpleado) => registroEmpleado.nombreEmpleado === empleadoNombre
		);
		if (empleado) {
			if (empleado.marcado) {
				return { activo: true, horaSalida: null };
			} else {
				return { activo: false, horaSalida: empleado.horaSalida };
			}
		}
		return { activo: false, horaSalida: null };
	};

	const obtenerUltimasDosPalabras = (texto: string): string => {
		const palabras = texto.split(" ");
		const ultimasDosPalabras = palabras.slice(-2).join(" ");
		return ultimasDosPalabras;
	};

	return (
		<div className="text-custom-red uppercase font-antonio flex flex-col gap-4 mb-2">
			{cadeteSeleccionado && (
				<div>
					<div>
						<p>
							Tiempo promedio de entrega por pedido:{" "}
							{promedioTiempoEntrega === "N/A"
								? "0 minutos"
								: obtenerUltimasDosPalabras(promedioTiempoEntrega)}
						</p>
					</div>
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
				<p className="border-b-2 w-fit  font-black  text-2xl border-red-main">
					ENTREGAS A TIEMPO:{" "}
					{isNaN(customerSuccess) ? "0%" : Math.round(customerSuccess) + "%"}
				</p>
			</div>
		</div>
	);
};
