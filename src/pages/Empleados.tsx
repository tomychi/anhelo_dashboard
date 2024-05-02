import React, { useEffect, useState } from "react";
import {
	EmpleadosProps,
	marcarEntrada,
	marcarSalida,
	obtenerRegistroActual,
	readEmpleados,
} from "../firebase/registroEmpleados";

export interface RegistroProps {
	horaEntrada: string;
	nombreEmpleado: string;
	horaSalida: string;
	marcado: boolean;
}

const handleMarcarEntrada = async (
	nombreEmpleado: string,
	setEmpleados: React.Dispatch<React.SetStateAction<EmpleadosProps[]>>
) => {
	await marcarEntrada(nombreEmpleado);
	setEmpleados((prevEmpleados) => [...prevEmpleados]);
};

const handleMarcarSalida = async (
	nombreEmpleado: string,
	setEmpleados: React.Dispatch<React.SetStateAction<EmpleadosProps[]>>
) => {
	await marcarSalida(nombreEmpleado);
	setEmpleados((prevEmpleados) => [...prevEmpleados]);
};

const RegistroEmpleado = () => {
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
	}, [empleados]);

	console.log(empleados);

	return (
		<div className="p-4 font-antonio flex flex-row gap-4 font-black">
			{/* INGRESOS Y EGRESOS */}
			<div className="w-1/2">
				<p className="text-4xl text-custom-red">MARCAR PRESENCIAS</p>
				{empleados.map((empleado, index) => {
					// Verifica si el name del empleado está presente en el registro del día actual
					const estaEnRegistro = registro.some(
						(registroEmpleado) =>
							registroEmpleado.nombreEmpleado === empleado.name
					);

					// Verifica si el empleado está marcado en el registro
					const empleadoMarcado = registro.find(
						(registroEmpleado) =>
							registroEmpleado.nombreEmpleado === empleado.name &&
							registroEmpleado.marcado
					);

					// Determina el color del fondo del botón basado en la presencia del empleado en el registro y su estado de marcado
					const colorFondo = empleadoMarcado ? "bg-green-600" : "bg-custom-red";

					return (
						<button
							key={index}
							className={`text-black mt-4 p-4 w-full flex flex-col ${colorFondo} font-black uppercase text-4x1 outline-none`}
							onClick={() =>
								estaEnRegistro
									? handleMarcarSalida(empleado.name, setEmpleados)
									: handleMarcarEntrada(empleado.name, setEmpleados)
							}
						>
							{empleado.name}: {empleado.category}
						</button>
					);
				})}
			</div>
			{/* SUELDOS */}
			<div className=" w-1/2">
				<p className="text-4xl text-custom-red">SUELDOS</p>
			</div>
		</div>
	);
};

export default RegistroEmpleado;
