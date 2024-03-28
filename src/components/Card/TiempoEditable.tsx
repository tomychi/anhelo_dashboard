import React, { useState } from "react";
import { RootState } from "../../redux/configureStore";
import { useSelector } from "react-redux";

export interface TiempoEditableProps {
	title: string;
	tiempoInicial: string;
	pedidoId: string;
	fecha: string;
	updateTiempoForOrder: (
		fechaPedido: string,
		pedidoId: string,
		nuevoTiempo: string
	) => Promise<void>;
}

export const TiempoEditable = ({
	title,
	tiempoInicial,
	pedidoId,
	fecha,
	updateTiempoForOrder,
}: TiempoEditableProps) => {
	// Estado para almacenar el tiempo actual y el nuevo tiempo que se está editando
	const [tiempo, setTiempo] = useState(tiempoInicial);
	const [nuevoTiempo, setNuevoTiempo] = useState(tiempoInicial);
	const [editandoTiempo, setEditandoTiempo] = useState(false);
	const user = useSelector((state: RootState) => state.auth.user);

	// Función para manejar el cambio en el nuevo tiempo
	const handleNuevoTiempoChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setNuevoTiempo(event.target.value);
	};

	// Función para manejar el envío del formulario de edición del tiempo
	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault(); // Evita que el formulario se envíe de forma predeterminada

		// Llama a la función para actualizar el tiempo
		updateTiempoForOrder(fecha, pedidoId, nuevoTiempo)
			.then(() => {
				// Si la actualización es exitosa, actualiza el estado del tiempo actual
				setTiempo(nuevoTiempo);
				// Limpia el estado del nuevo tiempo
				setNuevoTiempo("");
				// Establece el estado de edición en falso para ocultar el formulario
				setEditandoTiempo(false);
			})
			.catch((error) => {
				// Maneja cualquier error que ocurra durante la actualización del tiempo
				console.error("Error actualizando el tiempo:", error);
			});
	};

	return (
		<div>
			<div className="flex flex-row text-center justify-between">
				{/* Muestra el tiempo actual y un formulario para editarlo */}
				<p className="font-black border-4 pr-1 pl-1 border-white text-white w-full">{`${title}: ${tiempo} HS`}</p>
				{/* Renderiza el botón de edición si el usuario no es un cadete */}
				{!editandoTiempo && user.email !== "cadetes@anhelo.com" && (
					<button
						onClick={() => setEditandoTiempo(true)}
						className="font-black border-4 border-white text-white uppercase pr-1 pl-1"
					>
						Editar
					</button>
				)}
			</div>
			{/* Renderiza el formulario de edición del tiempo si se está editando */}
			{editandoTiempo && (
				<form onSubmit={handleSubmit} className="w-full flex flex-row">
					<input
						type="text"
						value={nuevoTiempo}
						onChange={handleNuevoTiempoChange}
						className="bg-white uppercase font-black font-black w-full  text-green-500 pr-1 pl-1 border-4 border-white"
					/>
					<button
						type="submit"
						className="uppercase border-4 border-white font-black text-white pr-1 pl-1"
					>
						Guardar
					</button>
				</form>
			)}
		</div>
	);
};
