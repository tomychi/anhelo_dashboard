import axios from "axios";
import routingProblem from "./problem.json";
import { useEffect, useState } from "react";
// {
//   "name": "cocina",
//   "coordinates": [-64.333731 , -33.095653]
// }
const accessToken =
	"pk.eyJ1IjoidG9teWNoaTEwIiwiYSI6ImNscGo1bDlsdDA1eTkyb240cmM3N2k4MGQifQ.o_0Lb8CoKuxI5PD5ETsOSg";
const url = "https://api.mapbox.com/optimized-trips/v2";

export const Delivery = () => {
	const [solution, setSolution] = useState(null);
	const [processStatus, setProcessStatus] = useState([]);

	// Función para enviar el problema de enrutamiento
	const sendRoutingProblem = async () => {
		try {
			const response = await axios.post(
				`${url}?access_token=${accessToken}`,
				routingProblem,
				{
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			return response.data;
		} catch (error) {
			console.error("Error al enviar el problema de enrutamiento:", error);
			return null;
		}
	};

	// Función para obtener la solución
	const getSolution = async (jobId: string) => {
		try {
			const response = await axios.get(
				`${url}/${jobId}?access_token=${accessToken}`
			);

			if (response.status === 200) {
				setSolution(response.data);
			} else {
				console.error("Error al obtener la solución:", response.statusText);
			}
		} catch (error) {
			console.error("Error al obtener la solución:", error);
		}
	};

	// Función para obtener el estado de los problemas de enrutamiento
	const getRoutingProblemsStatus = async () => {
		try {
			const response = await axios.get(`${url}?access_token=${accessToken}`, {
				headers: {
					"Content-Type": "application/json",
				},
			});

			return response.data; // Retorna la lista de problemas de enrutamiento y sus estados
		} catch (error) {
			console.error(
				"Error al obtener el estado de los problemas de enrutamiento:",
				error
			);
			throw error;
		}
	};

	// Función para obtener una solución al presionar un botón
	const handleGetSolution = async () => {
		const response = await sendRoutingProblem();
		if (response && response.id) {
			getSolution("2592ba5e-3289-4f46-be18-827c2fdd200f");
		}
	};

	// Función para obtener y mostrar los estados de los procesos
	const handleGetProcessStatus = async () => {
		try {
			const statusData = await getRoutingProblemsStatus();
			if (statusData) {
				setProcessStatus(statusData);
			}
		} catch (error) {
			// Manejar errores
		}
	};

	return (
		<div>
			<button
				onClick={handleGetSolution}
				className="flex bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-black py-2 px-4 border border-blue-500 hover:border-transparent "
			>
				Obtener Solución
			</button>
			<button
				onClick={handleGetProcessStatus}
				className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-black py-2 px-4 border border-blue-500 hover:border-transparent "
			>
				Ver Estados de Procesos
			</button>

			{/* Aquí mostrarías la solución obtenida */}
			<pre>{JSON.stringify(solution, null, 2)}</pre>

			{/* Aquí mostrarías los estados de los procesos */}
			<pre>{JSON.stringify(processStatus, null, 2)}</pre>
		</div>
	);
};
