import {
	updateTiempoElaboradoForOrder,
	updateTiempoEntregaForOrder,
} from "../../../firebase/UploadOrder";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/configureStore";
import { SelectCadete } from "../SelectCadete";

import {
	CardComandaHeader,
	CardComandaInfo,
	CardComdandaBody,
	CardComandaFooter,
} from "../Card";
import {
	obtenerColorTailwind,
	obtenerDiferenciaHorariaWithColor,
} from "../../../helpers/calculateDiffHours";
import { useEffect, useState } from "react";
import { obtenerDiferenciaHoraria } from "../../../helpers/dateToday";
import { PedidoProps } from "../../../types/types";

interface CardComandaProps extends PedidoProps {
	cadetes: string[];
}

export const CardComanda = ({
	aclaraciones,
	detallePedido,
	direccion,
	elaborado,
	envio,
	fecha,
	hora,
	metodoPago,
	subTotal,
	paid,
	telefono,
	total,
	efectivoCantidad,
	mercadopagoCantidad,
	referencias,
	id,
	ubicacion,
	cadete,
	dislike,
	envioExpress,
	delay,
	tiempoElaborado,
	tiempoEntregado,
	entregado,
	pendingOfBeingAccepted,
	map,
	kms,
	minutosDistancia,
	cookNow,
}: CardComandaProps) => {
	const comanda = {
		aclaraciones,
		detallePedido,
		direccion,
		elaborado,
		envio,
		fecha,
		envioExpress,
		hora,
		metodoPago,
		subTotal,
		paid,
		telefono,
		total,
		efectivoCantidad,
		mercadopagoCantidad,
		referencias,
		id,
		ubicacion,
		cadete,
		dislike,
		delay,
		tiempoElaborado,
		tiempoEntregado,
		pendingOfBeingAccepted,
		entregado,
		map,
		kms,
		minutosDistancia,
	};
	const { user } = useSelector((state: RootState) => state.auth);
	// Estado para almacenar la cantidad de minutos de demora
	const [minutosDeDemora, setMinutosDeDemora] = useState(
		obtenerDiferenciaHoraria(hora)
	);
	const [bgColor, setBgColor] = useState(obtenerColorTailwind(minutosDeDemora));
	// Efecto para actualizar la cantidad de minutos de demora cada minuto
	// Función para calcular y actualizar la cantidad de minutos de demora
	const actualizarMinutosDeDemora = () => {
		const nuevaDiferencia = obtenerDiferenciaHoraria(hora);
		// Actualizar el estado de bg-color
		setBgColor(obtenerColorTailwind(obtenerDiferenciaHorariaWithColor(hora)));
		setMinutosDeDemora(nuevaDiferencia);
	};
	// Actualiza la cantidad de minutos de demora cada minuto
	setInterval(actualizarMinutosDeDemora, 60000); // 60000 milisegundos = 1 minuto
	useEffect(() => {
		// Actualizar el estado de bg-color
		setBgColor(obtenerColorTailwind(obtenerDiferenciaHorariaWithColor(hora)));
	}, [hora]);
	return (
		<div
			className={`flex justify-center font-coolvetica uppercase flex-col max-w-sm overflow-hidden h-min 
  ${bgColor}
   `}
		>
			{/* Barra violeta para cookNow */}
			{cookNow && !elaborado && (
				<div className="bg-purple-600 flex flex-row justify-center h-20 gap-2 items-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="h-6 text-white"
					>
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
						/>
					</svg>
					<p className="text-2xl font-bold text-white">COCINAR YA</p>
				</div>
			)}
			{envioExpress > 0 ? (
				<div className="bg-blue-500 flex flex-row justify-center h-20 gap-2 items-center ">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="h-6"
					>
						<path
							fill-rule="evenodd"
							d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
							clip-rule="evenodd"
						/>
					</svg>

					<p className="text-2xl font-bold">COCINAR YA Y CADETE SOLO</p>
				</div>
			) : (
				<></>
			)}
			<div className="p-4">
				<CardComandaHeader
					user={user}
					hora={hora}
					id={id}
					entregado={entregado}
					tiempoEntregado={tiempoEntregado}
					tiempoElaborado={tiempoElaborado}
					fecha={fecha}
					minutosDeDemora={minutosDeDemora}
				/>
				<CardComandaInfo
					direccion={direccion}
					ubicacion={ubicacion}
					referencias={referencias}
					telefono={telefono}
					metodoPago={metodoPago}
					total={total}
					efectivoCantidad={efectivoCantidad}
					mercadopagoCantidad={mercadopagoCantidad}
					user={user}
					id={id}
					fecha={fecha}
					paid={paid}
					tiempoElaborado={tiempoElaborado}
					tiempoEntregado={tiempoEntregado}
					updateTiempoElaboradoForOrder={updateTiempoElaboradoForOrder}
					updateTiempoEntregaForOrder={updateTiempoEntregaForOrder}
					entregado={entregado}
				/>
				<SelectCadete
					elaborado={elaborado}
					cadete={cadete}
					fecha={fecha}
					id={id}
				/>
				<CardComdandaBody
					aclaraciones={aclaraciones}
					detallePedido={detallePedido}
				/>
				<CardComandaFooter user={user} comanda={comanda} />
			</div>
		</div>
	);
};
