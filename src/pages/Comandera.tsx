import { useEffect, useState } from "react";
import { Card } from "../components/Card";
import pedidos from "../assets/pedidos.json";

function obtenerFechaActual() {
	const fecha = new Date();
	const dia = String(fecha.getDate()).padStart(2, "0");
	const mes = String(fecha.getMonth() + 1).padStart(2, "0");
	const anio = String(fecha.getFullYear());
	return `${dia}-${mes}-${anio}`;
}

export const Comandera = () => {
	const [seccionActiva, setSeccionActiva] = useState("porHacer"); // porHacer o hechos
	const [pedidosHoy, setPedidosHoy] = useState([]);

	useEffect(() => {
		const fechaActual = obtenerFechaActual();

		// Filtrar los pedidos por la fecha de hoy
		const pedidosFechaActual = pedidos.filter(
			(pedido) => pedido.fecha === fechaActual
		);

		// Ordenar los pedidos filtrados por hora
		pedidosFechaActual.sort((a, b) => {
			const horaA = new Date(`2023-10-22 ${a.hora}`);
			const horaB = new Date(`2023-10-22 ${b.hora}`);
			return horaA - horaB;
		});

		setPedidosHoy(pedidosFechaActual);
	}, []);

	// Filtra los pedidos según la sección activa
	const pedidosPorHacer = pedidosHoy.filter((comanda) => !comanda.elaborado);
	const pedidosHechos = pedidosHoy.filter((comanda) => comanda.elaborado);

	return (
		<div>
			<div className="flex justify-center font-antonio  my-4">
				<button
					className={`mx-2 py-2 px-4 ${
						seccionActiva === "porHacer"
							? "bg-custom-red"
							: "border border-red-700 text-custom-red"
					} text-black font-black uppercase `}
					onClick={() => setSeccionActiva("porHacer")}
				>
					Por Hacer
				</button>
				<button
					className={`mx-2 py-2 px-4 ${
						seccionActiva === "hechos"
							? "bg-custom-red"
							: "border border-red-700 text-custom-red"
					} text-black font-black uppercase `}
					onClick={() => setSeccionActiva("hechos")}
				>
					Hechos
				</button>
			</div>
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
				{seccionActiva === "porHacer" ? (
					Array.isArray(pedidosPorHacer) && pedidosPorHacer.length > 0 ? (
						pedidosPorHacer.map((comanda, i) => (
							<Card key={i} comanda={comanda} />
						))
					) : (
						<p>No hay pedidos por hacer.</p>
					)
				) : Array.isArray(pedidosHechos) && pedidosHechos.length > 0 ? (
					pedidosHechos.map((comanda, i) => <Card key={i} comanda={comanda} />)
				) : (
					<p>No hay pedidos hechos.</p>
				)}
			</div>
		</div>
	);
};
