import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import {
	collection,
	getFirestore,
	onSnapshot,
	addDoc,
} from "firebase/firestore";
import { readEmpleados } from "../firebase/registroEmpleados";
import Calendar from "../components/Calendar";
import { RootState } from "../redux/configureStore";
import { useSelector } from "react-redux";

interface Empleado {
	name: string;
	category: string;
	correo: string;
	available: boolean;
	area: string;
	puesto: string;
	depto: string;
}

// Hook personalizado para detectar clics fuera del elemento
const useOutsideClick = (callback: () => void) => {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				callback();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [callback]);

	return ref;
};

// Componente Modal
const Modal = ({
	isOpen,
	onClose,
	children,
}: {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
}) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
			<div className="bg-white p-6 rounded-lg relative">
				<button onClick={onClose} className="absolute top-2 right-2 text-xl">
					&times;
				</button>
				{children}
			</div>
		</div>
	);
};

export const Equipo = () => {
	const [empleados, setEmpleados] = useState<Empleado[]>([]);
	const [selectAll, setSelectAll] = useState(false);
	const [selectedItems, setSelectedItems] = useState<string[]>([]);
	const [showActionBar, setShowActionBar] = useState(false);
	const { totalProductosVendidos } = useSelector(
		(state: RootState) => state.data
	);
	const [showFilter, setShowFilter] = useState(false);
	const [filters, setFilters] = useState<{
		depto: string[];
		area: string[];
		puesto: string[];
	}>({ depto: [], area: [], puesto: [] });
	const [searchTerm, setSearchTerm] = useState("");
	const [showModal, setShowModal] = useState(false);
	const [newMember, setNewMember] = useState<Empleado>({
		name: "",
		category: "",
		correo: "",
		available: true,
		area: "",
		puesto: "",
		depto: "",
	});

	const fetchEmpleados = async () => {
		try {
			const empleadosData = await readEmpleados();
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
			setSelectedItems(empleados.map((empleado) => empleado.name));
		} else {
			setSelectedItems([]);
		}
	};

	const handleSelectItem = (name: string) => {
		setSelectedItems((prevSelected) =>
			prevSelected.includes(name)
				? prevSelected.filter((item) => item !== name)
				: [...prevSelected, name]
		);
	};

	useEffect(() => {
		setSelectAll(selectedItems.length === empleados.length);
		setShowActionBar(selectedItems.length > 0);
	}, [selectedItems, empleados]);

	const handleCloseActionBar = () => {
		setSelectedItems([]);
		setShowActionBar(false);
	};

	const toggleFilter = () => {
		setShowFilter(!showFilter);
	};

	const handleFilterChange = (
		category: "depto" | "area" | "puesto",
		value: string
	) => {
		setFilters((prev) => {
			if (prev[category].includes(value)) {
				return {
					...prev,
					[category]: prev[category].filter((item) => item !== value),
				};
			} else {
				return { ...prev, [category]: [...prev[category], value] };
			}
		});
	};

	const getUniqueValues = (key: "depto" | "area" | "puesto") => {
		return Array.from(new Set(empleados.map((emp) => emp[key])));
	};

	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value.toLowerCase());
	};

	const filteredEmpleados = empleados.filter(
		(emp) =>
			(filters.depto.length === 0 || filters.depto.includes(emp.depto)) &&
			(filters.area.length === 0 || filters.area.includes(emp.area)) &&
			(filters.puesto.length === 0 || filters.puesto.includes(emp.puesto)) &&
			emp.name.toLowerCase().includes(searchTerm)
	);

	const handleNewMemberSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const firestore = getFirestore();
		try {
			await addDoc(collection(firestore, "empleados"), newMember);
			setShowModal(false);
			setNewMember({
				name: "",
				category: "",
				correo: "",
				available: true,
				area: "",
				puesto: "",
				depto: "",
			});
			fetchEmpleados(); // Actualizar la lista de empleados
		} catch (error) {
			console.error("Error al añadir nuevo miembro:", error);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setNewMember((prev) => ({ ...prev, [name]: value }));
	};

	// Usar el hook personalizado para cerrar el filtro al hacer clic fuera
	const filterRef = useOutsideClick(() => {
		setShowFilter(false);
	});

	return (
		<div className="flex flex-col relative">
			<div className="flex flex-row  gap-4 items-center  mt-6 mb-2  mx-auto">
				<p className="text-black font-bold text-4xl ">Equipo</p>
				<button
					onClick={() => setShowModal(true)}
					className="bg-gray-200 ease-in-out duration-300 hover:bg-gray-300 h-10 gap-2 text-gray-100 mt-2 rounded-full flex items-center pt-3 pb-4 pl-4 pr-4"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="black"
						className="w-6 mt-1"
					>
						<path d="M5.25 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM2.25 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM18.75 7.5a.75.75 0 0 0-1.5 0v2.25H15a.75.75 0 0 0 0 1.5h2.25v2.25a.75.75 0 0 0 1.5 0v-2.25H21a.75.75 0 0 0 0-1.5h-2.25V7.5Z" />
					</svg>
					<p className="font-medium text-black">Nuevo miembro</p>
				</button>
			</div>
			<div className="mb-8">
				<div className="flex flex-col w-1/3 mx-auto  gap-2 mt-2">
					<Calendar />
					<div className="flex flex-row gap-2">
						<div className="relative w-1/3" ref={filterRef}>
							<button
								onClick={toggleFilter}
								className="flex items-center w-full h-10 rounded-lg border border-black focus:ring-0 font-coolvetica text-black text-xs font-light px-2"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth="1"
									stroke="currentColor"
									className="h-6 mr-2"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
									/>
								</svg>
								Filtrar
							</button>
							{showFilter && (
								<div className="absolute z-10 mt-1 w-64 bg-white rounded-md shadow-lg">
									<div className="p-2">
										<h3 className="font-semibold mb-2">Departamento</h3>
										{getUniqueValues("depto").map((depto) => (
											<label key={depto} className="flex items-center mb-1">
												<input
													type="checkbox"
													checked={filters.depto.includes(depto)}
													onChange={() => handleFilterChange("depto", depto)}
													className="mr-2"
												/>
												{depto}
											</label>
										))}
									</div>
									<div className="p-2">
										<h3 className="font-semibold mb-2">Área</h3>
										{getUniqueValues("area").map((area) => (
											<label key={area} className="flex items-center mb-1">
												<input
													type="checkbox"
													checked={filters.area.includes(area)}
													onChange={() => handleFilterChange("area", area)}
													className="mr-2"
												/>
												{area}
											</label>
										))}
									</div>
									<div className="p-2">
										<h3 className="font-semibold mb-2">Puesto</h3>
										{getUniqueValues("puesto").map((puesto) => (
											<label key={puesto} className="flex items-center mb-1">
												<input
													type="checkbox"
													checked={filters.puesto.includes(puesto)}
													onChange={() => handleFilterChange("puesto", puesto)}
													className="mr-2"
												/>
												{puesto}
											</label>
										))}
									</div>
								</div>
							)}
						</div>
						<div className="flex items-center w-2/3 h-10 rounded-lg border border-black focus:ring-0 font-coolvetica text-black text-xs font-light">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="1"
								stroke="currentColor"
								className="h-6 ml-2 mb-0.5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
								/>
							</svg>
							<input
								type="text"
								placeholder="Buscar miembro"
								value={searchTerm}
								onChange={handleSearch}
								className="ml-1 w-full bg-transparent focus:outline-none"
							/>
						</div>
					</div>
				</div>
			</div>

			<div className="font-coolvetica">
				<table className="w-full text-xs text-left text-black">
					<thead className="text-black border-b">
						<tr>
							<th scope="col" className="pl-4 w-1/7 h-10">
								<label className="inline-flex items-center">
									<input
										type="checkbox"
										checked={selectAll}
										onChange={handleSelectAll}
										className="form-checkbox hidden"
									/>
									<span
										className={`w-6 h-6 flex items-center justify-center ${
											selectAll ? "text-black" : "text-gray-300"
										}`}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="currentColor"
											className="size-6"
										>
											<path
												fillRule="evenodd"
												d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
												clipRule="evenodd"
											/>
										</svg>
									</span>
								</label>
							</th>
							<th scope="col" className=" w-1/7 h-10">
								Nombre
							</th>
							<th scope="col" className=" w-1/7 h-10">
								Sueldo
							</th>
							<th scope="col" className=" w-1/7 h-10">
								Depto
							</th>
							<th scope="col" className=" w-1/7 h-10">
								Area
							</th>
							<th scope="col" className=" w-1/7 h-10">
								Puesto
							</th>
							<th scope="col" className=" w-4/7 h-10">
								Correo
							</th>
						</tr>
					</thead>
					<tbody>
						{filteredEmpleados.map((empleado) => (
							<tr
								key={empleado.name}
								className="text-black border font-light border-black border-opacity-20"
							>
								<td className="pl-4 w-1/7 h-10">
									<label className="inline-flex items-center">
										<input
											type="checkbox"
											checked={selectedItems.includes(empleado.name)}
											onChange={() => handleSelectItem(empleado.name)}
											className="form-checkbox hidden"
										/>
										<span
											className={`w-6 h-6 flex items-center justify-center ${
												selectedItems.includes(empleado.name)
													? "text-black"
													: "text-gray-300"
											}`}
										>
											{selectedItems.includes(empleado.name) ? (
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
													className="size-6"
												>
													<path
														fillRule="evenodd"
														d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
														clipRule="evenodd"
													/>
												</svg>
											) : (
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="black"
													className="size-6"
												>
													<path
														fillRule="evenodd"
														d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
														clipRule="evenodd"
													/>
												</svg>
											)}
										</span>
									</label>
								</td>
								<th scope="row" className=" w-1/7 font-light h-10">
									{empleado.name
										? empleado.name.charAt(0).toUpperCase() +
										  empleado.name.slice(1).toLowerCase()
										: ""}
								</th>
								<td className=" w-1/7 font-light h-10">
									{empleado.area === "cocina"
										? totalProductosVendidos * 230
										: 0}
								</td>
								<td className=" w-1/7 font-light h-10">{empleado.depto}</td>
								<td className=" w-1/7 font-light h-10">
									{empleado.area
										? empleado.area.charAt(0).toUpperCase() +
										  empleado.area.slice(1).toLowerCase()
										: ""}
								</td>
								<td className=" w-1/7 font-light h-10">
									{empleado.puesto
										? empleado.puesto.charAt(0).toUpperCase() +
										  empleado.puesto.slice(1).toLowerCase()
										: ""}
								</td>
								<td className=" w-4/7 font-light h-10">{empleado.correo}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{showActionBar && (
				<div
					className="fixed bottom-0 left-0 right-0 bg-black  text-gray-100 font-coolvetica
         p-4 flex justify-between items-center"
				>
					<div className="flex items-center  gap-2">
						<span className="mr-8 font-medium text-4xl">
							{selectedItems.length} seleccionados
						</span>
						<button className="bg-gray-100 hover:bg-gray-300 ease-in-out duration-300 rounded-full text-black  px-3 py-1 ">
							Asignar depto
						</button>
						<button className="bg-gray-100 hover:bg-gray-300 ease-in-out duration-300 rounded-full text-black px-3 py-1  ">
							Asignar área
						</button>
						<button className="bg-gray-100 hover:bg-gray-300 ease-in-out duration-300 rounded-full text-black px-3 py-1 ">
							Asignar puesto
						</button>
						<button className="bg-gray-100 hover:bg-gray-300 ease-in-out duration-300 rounded-full  text-black  px-3 py-1  ">
							Eliminar miembro/s
						</button>
					</div>
					<button onClick={handleCloseActionBar} className="text-2xl">
						&times;
					</button>
				</div>
			)}

			<Modal isOpen={showModal} onClose={() => setShowModal(false)}>
				<h2 className="text-2xl font-bold mb-4">Añadir Nuevo Miembro</h2>
				<form onSubmit={handleNewMemberSubmit} className="space-y-4">
					<div>
						<label htmlFor="name" className="block mb-1">
							Nombre
						</label>
						<input
							type="text"
							id="name"
							name="name"
							value={newMember.name}
							onChange={handleInputChange}
							className="w-full border rounded px-2 py-1"
							required
						/>
					</div>
					<div>
						<label htmlFor="correo" className="block mb-1">
							Correo
						</label>
						<input
							type="email"
							id="correo"
							name="correo"
							value={newMember.correo}
							onChange={handleInputChange}
							className="w-full border rounded px-2 py-1"
							required
						/>
					</div>
					<div>
						<label htmlFor="area" className="block mb-1">
							Área
						</label>
						<input
							type="text"
							id="area"
							name="area"
							value={newMember.area}
							onChange={handleInputChange}
							className="w-full border rounded px-2 py-1"
							required
						/>
					</div>
					<div>
						<label htmlFor="puesto" className="block mb-1">
							Puesto
						</label>
						<input
							type="text"
							id="puesto"
							name="puesto"
							value={newMember.puesto}
							onChange={handleInputChange}
							className="w-full border rounded px-2 py-1"
							required
						/>
					</div>
					<div>
						<label htmlFor="depto" className="block mb-1">
							Departamento
						</label>
						<input
							type="text"
							id="depto"
							name="depto"
							value={newMember.depto}
							onChange={handleInputChange}
							className="w-full border rounded px-2 py-1"
							required
						/>
					</div>
					<button
						type="submit"
						className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
					>
						Añadir Miembro
					</button>
				</form>
			</Modal>
		</div>
	);
};
