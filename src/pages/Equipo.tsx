import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { collection, getFirestore, onSnapshot } from "firebase/firestore";
import { readEmpleados } from "../firebase/registroEmpleados";

interface Empleado {
	id: string;
	name: string;
	category: string;
	email: string;
	available: boolean;
}

export const Equipo = () => {
	const [empleados, setEmpleados] = useState<Empleado[]>([]);
	const [selectAll, setSelectAll] = useState(false);
	const [selectedItems, setSelectedItems] = useState<string[]>([]);

	const fetchEmpleados = async () => {
		try {
			const empleadosData = await readEmpleados();
			// Filtrar para excluir al empleado con name: "NO ASIGNADO"
			const filteredEmpleados = empleadosData.filter(
				(empleado) => empleado.name !== "NO ASIGNADO"
			);
			setEmpleados(filteredEmpleados);
		} catch (error) {
			console.error("Error al obtener los empleados:", error);
		}
	};

	useEffect(() => {
		const firestore = getFirestore();

		fetchEmpleados();

		const unsubscribe = onSnapshot(
			collection(firestore, "empleados"),
			fetchEmpleados
		);
		return () => unsubscribe();
	}, []);

	const handleSelectAll = () => {
		setSelectAll(!selectAll);
		if (!selectAll) {
			setSelectedItems(empleados.map((empleado) => empleado.id));
		} else {
			setSelectedItems([]);
		}
	};

	const handleSelectItem = (id: string) => {
		setSelectedItems((prevSelected) =>
			prevSelected.includes(id)
				? prevSelected.filter((item) => item !== id)
				: [...prevSelected, id]
		);
	};

	useEffect(() => {
		setSelectAll(selectedItems.length === empleados.length);
	}, [selectedItems, empleados]);

	return (
		<div className="flex flex-col">
			<div className="flex flex-row justify-between items-center mt-8 mx-4">
				<p className="text-black font-bold text-4xl ">Equipo</p>
				<NavLink
					className="bg-black h-10 gap-2 text-gray-100 mt-2 rounded-full flex items-center pt-3 pb-4 pl-4 pr-4"
					to="/nuevaCompra"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="w-6 mt-1"
					>
						<path d="M5.25 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM2.25 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM18.75 7.5a.75.75 0 0 0-1.5 0v2.25H15a.75.75 0 0 0 0 1.5h2.25v2.25a.75.75 0 0 0 1.5 0v-2.25H21a.75.75 0 0 0 0-1.5h-2.25V7.5Z" />
					</svg>
					<p className="font-medium">Nuevo miembro </p>
				</NavLink>
			</div>
			<div className="w-1/3 bg-black h-[0.5px] mt-4"></div>
			<div className="p-4">
				<div className="flex flex-row gap-2 mt-2">
					<div className="flex items-center w-1/3 h-10 rounded-lg border border-black focus:ring-0 font-coolvetica text-black px-4 pr-8 text-xs font-light">
						Todos
					</div>
					<div className="flex items-center w-2/3 h-10 rounded-lg border border-black focus:ring-0 font-coolvetica text-black px-4 pr-8 text-xs font-light">
						Buscar
					</div>
				</div>
			</div>

			<div className="font-coolvetica">
				<table className="w-full text-xs text-left text-black">
					<thead className="text-black border">
						<tr>
							<th scope="col" className="pl-4 w-1/7 py-3">
								<input
									type="checkbox"
									checked={selectAll}
									onChange={handleSelectAll}
									className="form-checkbox  h-5 w-5 text-blue-600"
								/>
							</th>
							<th scope="col" className=" w-1/7 py-3">
								Nombre
							</th>
							<th scope="col" className=" w-1/7 py-3">
								Puesto
							</th>
							<th scope="col" className=" w-4/7 py-3">
								Correo
							</th>
						</tr>
					</thead>
					<tbody>
						{empleados.map((empleado) => (
							<tr
								key={empleado.id}
								className="text-black border font-light border-black border-opacity-20"
							>
								<td className="pl-4 w-1/7 py-3">
									<input
										type="checkbox"
										checked={selectedItems.includes(empleado.id)}
										onChange={() => handleSelectItem(empleado.id)}
										className="form-checkbox h-5 w-5 text-blue-600"
									/>
								</td>
								<th scope="row" className=" w-1/7 font-light py-3">
									{empleado.name}
								</th>
								<td className=" w-1/7 font-light py-3">{empleado.category}</td>
								<td className=" w-4/7 font-light py-3">{empleado.email}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};
