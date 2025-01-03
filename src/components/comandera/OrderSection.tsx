import React, { useEffect, useState } from "react";
import { PedidoProps } from "../../types/types";
import { CardComanda } from "./Card/CardComanda";
import { ReadOrdersForToday } from "../../firebase/ReadData";

interface OrderSectionProps {
	cadetes: string[];
}

export const OrderSection: React.FC<OrderSectionProps> = ({ cadetes }) => {
	const [orders, setOrders] = useState<PedidoProps[]>([]);

	useEffect(() => {
		// Suscribirse a los cambios en tiempo real
		const unsubscribe = ReadOrdersForToday((updatedOrders) => {
			setOrders(updatedOrders);
		});

		// Limpiar la suscripción cuando el componente se desmonte
		return () => {
			unsubscribe();
		};
	}, []);

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
			{orders.map(
				({
					aclaraciones,
					detallePedido,
					direccion,
					elaborado,
					envio,
					fecha,
					hora,
					metodoPago,
					subTotal,
					telefono,
					total,
					referencias,
					id,
					ubicacion,
					paid,
					cadete,
					dislike,
					delay,
					tiempoElaborado,
					tiempoEntregado,
					entregado,
					map,
					kms,
					minutosDistancia,
					efectivoCantidad,
					mercadopagoCantidad,
				}) => (
					<div key={`comanda-${hora}-${id}`}>
						<CardComanda
							aclaraciones={aclaraciones}
							direccion={direccion}
							hora={hora}
							metodoPago={metodoPago}
							total={total}
							paid={paid}
							telefono={telefono}
							detallePedido={detallePedido}
							elaborado={elaborado}
							referencias={referencias}
							ubicacion={ubicacion}
							fecha={fecha}
							cadete={cadete}
							efectivoCantidad={efectivoCantidad}
							mercadopagoCantidad={mercadopagoCantidad}
							tiempoElaborado={tiempoElaborado}
							tiempoEntregado={tiempoEntregado}
							entregado={entregado}
							id={id}
							subTotal={subTotal}
							dislike={dislike}
							delay={delay}
							map={map}
							kms={kms}
							minutosDistancia={minutosDistancia}
							envio={envio}
							cadetes={cadetes}
						/>
					</div>
				)
			)}
		</div>
	);
};
