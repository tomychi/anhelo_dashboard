import { ChangeEvent, FormEvent, useState } from "react";
import { obtenerFechaActual } from "../../helpers/dateToday";
import { UploadExpense, ExpenseProps } from "../../firebase/UploadGasto";
import Swal from "sweetalert2";
import { updateMaterialCost } from "../../firebase/Materiales";
import { calculateUnitCost } from "../../helpers/calculator";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";

export const FormGasto = () => {
	const [unidadPorPrecio, setUnidadPorPrecio] = useState<number>(0);
	const { materiales } = useSelector((state: RootState) => state.materials);

	const [formData, setFormData] = useState<ExpenseProps>({
		description: "",
		total: 0,
		category: "",
		fecha: obtenerFechaActual(),
		name: "",
		quantity: 0,
		unit: "",
		id: "",
	});

	const handleChange = (
		e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target;

		// Verificamos si el valor ingresado es un número válido
		const numericValue = parseFloat(value);
		const sanitizedValue = isNaN(numericValue) ? "" : numericValue;

		setFormData((prevData) => ({
			...prevData,
			[name]: name === "total" || name === "quantity" ? sanitizedValue : value,
		}));
	};

	const handleNameChange = (
		e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { value } = e.target;
		const selectedMaterial = materiales.find(
			(material) => material.nombre === value
		);

		if (selectedMaterial) {
			setUnidadPorPrecio(selectedMaterial.unidadPorPrecio);
			// Si el material seleccionado existe, actualiza los campos del formulario con sus datos
			setFormData({
				...formData,
				id: selectedMaterial.id,
				name: selectedMaterial.nombre,
				quantity: 0, // Puedes llenar esto con datos predefinidos o dejarlo vacío según tu lógica
				unit: selectedMaterial.unit,
				total: 0, // Puedes llenar esto con datos predefinidos o dejarlo vacío según tu lógica
				description: "", // Puedes llenar esto con datos predefinidos o dejarlo vacío según tu lógica
				category: selectedMaterial.categoria,
				fecha: obtenerFechaActual(),
			});
		} else {
			// Si el material seleccionado no existe, permite al usuario escribirlo manualmente
			setFormData({
				...formData,
				name: value,
				quantity: 0, // Puedes llenar esto con datos predefinidos o dejarlo vacío según tu lógica
				unit: "", // Puedes llenar esto con datos predefinidos o dejarlo vacío según tu lógica
				total: 0, // Puedes llenar esto con datos predefinidos o dejarlo vacío según tu lógica
				description: "", // Puedes llenar esto con datos predefinidos o dejarlo vacío según tu lógica
				category: "", // Puedes llenar esto con datos predefinidos o dejarlo vacío según tu lógica
				fecha: obtenerFechaActual(),
			});
		}
	};

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		const cost = calculateUnitCost(
			formData.total,
			formData.quantity,
			unidadPorPrecio,
			formData.unit,
			formData.name
		);

		e.preventDefault();
		// Llama a la función para actualizar el costo del material

		UploadExpense(formData)
			.then((result) => {
				Swal.fire({
					icon: "success",
					title: `Gasto cargado`,
					text: `El gasto ${result.id} se cargó correctamente`,
				});
			})
			.then(() => {
				updateMaterialCost(formData.id, cost, formData.quantity)
					.then((result) => {
						Swal.fire({
							icon: "success",
							title: `Gasto actualizado`,
							text: `El costo ${result} se cargó correctamente`,
						});
					})
					.catch((error) => {
						Swal.fire({
							icon: "error",
							title: "Error",
							text: `Hubo un error al cargar el gasto: ${error}`,
						});
					});
			})
			.catch((error) => {
				Swal.fire({
					icon: "error",
					title: "Error",
					text: `Hubo un error al cargar el gasto: ${error}`,
				});
			});

		setFormData({
			description: "",
			total: 0,
			category: "",
			fecha: obtenerFechaActual(),
			name: "",
			quantity: 0,
			unit: "",
			id: "",
		});
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="flex flex-col items-center w-full justify-center font-coolvetica font-black text-black  p-4"
		>
			<div className="item-section w-full">
				<div className="section relative z-0 mt-4">
					<input
						type="text"
						id="name"
						name="name"
						className="block text-light rounded-md w-full py-2.5 px-4 texk-black bg-transparent border border-black appearance-none text-black focus:outline-none focus:ring-0"
						value={formData.name}
						onChange={handleNameChange}
						placeholder="Nombre del item"
						list="itemNames"
						required
						autoComplete="off"
					/>
					<datalist id="itemNames">
						{/* Aquí puedes agregar opciones dinámicamente desde tu arreglo de materiales */}
						{materiales.map((material, index) => (
							<option key={index} value={material.nombre} />
						))}
					</datalist>
				</div>
				<div className="section  relative z-0 mt-4">
					<label
						htmlFor="quantity"
						className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>
						Cantidad:
					</label>
					<input
						type="number"
						id="quantity"
						name="quantity"
						value={formData.quantity}
						className="block py-2.5  w-full  texk-black  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
						onChange={handleChange}
						required
					/>
				</div>
				<div className="section  relative z-0 mt-4">
					<label
						htmlFor="unit"
						className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>
						Unidad de Medida:
					</label>
					<input
						type="text"
						id="unit"
						name="unit"
						value={formData.unit}
						className="block py-2.5  w-full  texk-black  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
						onChange={handleChange}
						required
					/>
				</div>
			</div>
			<div className="section w-full relative z-0 mt-4">
				<label
					htmlFor="total"
					className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
				>
					Total $:
				</label>
				<input
					type="number"
					id="total"
					name="total"
					className="block py-2.5  w-full  texk-black  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
					value={formData.total}
					onChange={handleChange}
					required
				/>
			</div>
			<div className="section w-full relative z-0 mt-4">
				<label
					htmlFor="description"
					className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
				>
					Descripción:
				</label>
				<input
					type="text"
					id="description"
					name="description"
					className="block py-2.5  w-full  texk-black  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
					value={formData.description}
					onChange={handleChange}
				/>
			</div>
			<div className="section w-full relative z-0 mt-4">
				<label
					htmlFor="category"
					className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
				>
					Categoría:
				</label>
				<input
					type="text"
					id="category"
					name="category"
					className="block py-2.5  w-full  texk-black  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
					value={formData.category}
					onChange={handleChange}
					required
				/>
			</div>
			<div className="section w-full  relative z-0 mt-4">
				<label
					htmlFor="fecha"
					className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
				>
					Fecha:
				</label>
				<input
					type="string"
					id="fecha"
					name="fecha"
					className="block py-2.5  w-full  texk-black  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
					value={formData.fecha}
					onChange={handleChange}
					required
				/>
			</div>
			<button
				type="submit"
				className=" text-gray-100 w-full p-4 bg-black font-black uppercase  outline-none"
			>
				Guardar
			</button>
		</form>
	);
};
