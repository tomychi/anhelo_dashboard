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
	const [seccionActiva, setSeccionActiva] = useState("porHacer");
	const [pedidosHoy, setPedidosHoy] = useState([]);

	useEffect(() => {
		const fechaActual = obtenerFechaActual();

		// Copia del arreglo actual de pedidosHoy
		const nuevosPedidosHoy = [...pedidosHoy];

		// Agregar el nuevo pedido a la lista
		const nuevoPedido = {
			numeroPedido: "34", // Actualiza el número del pedido según sea necesario
			pedido:
				"1x triple cheeseburger\ntoppings:\n- bacon\n- salsa barbecue\n- salsa anhelo",
			aclaraciones: "sin mayonesa a la doble",
			direccion: "isabel la católica 635 (+54 9 358 429-2340)",
			hora: "23:50",
			fecha: fechaActual,
			total: "$3650",
			elaborado: false,
		};

		nuevosPedidosHoy.push(nuevoPedido);

		// Ordenar los pedidos filtrados por hora
		nuevosPedidosHoy.sort((a, b) => {
			const horaA = new Date(`2023-12-11 ${a.hora}`);
			const horaB = new Date(`2023-12-11 ${b.hora}`);
			return horaA - horaB;
		});

		setPedidosHoy(nuevosPedidosHoy);
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
			<div className="grid grid-cols-2 p-4 md:grid-cols-3 lg:grid-cols-4 gap-4 ">
				{seccionActiva === "porHacer" ? (
					Array.isArray(pedidosPorHacer) && pedidosPorHacer.length > 0 ? (
						pedidosPorHacer.map((comanda, i) => (
							<Card key={i} comanda={comanda} />
						))
					) : (
						<p className="text-custom-red font-antonio p-4">
							No hay pedidos por hacer.
						</p>
					)
				) : Array.isArray(pedidosHechos) && pedidosHechos.length > 0 ? (
					pedidosHechos.map((comanda, i) => <Card key={i} comanda={comanda} />)
				) : (
					<p className="text-custom-red font-antonio p-4">
						No hay pedidos hechos.
					</p>
				)}
			</div>
		</div>
	);
};
