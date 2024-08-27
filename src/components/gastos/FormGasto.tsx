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
			className=" items-center w-full justify-center p-4   rounded-md  font-coolvetica  text-black "
		>
			<div className="item-section w-full flex flex-col gap-4">
				<div className="section relative z-0 ">
					<input
						type="text"
						id="name"
						name="name"
						className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
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
				<div className="section  relative z-0 ">
					<input
						type="number"
						id="quantity"
						name="quantity"
						value={formData.quantity}
						className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
						onChange={handleChange}
						placeholder="Cantidad"
						required
					/>
				</div>
				<div className="section  relative z-0 ">
					<input
						type="text"
						id="unit"
						name="unit"
						value={formData.unit}
						className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
						onChange={handleChange}
						placeholder="Unidad de medida"
						required
					/>
				</div>
				<div className="section w-full relative z-0 ">
					<input
						type="number"
						id="total"
						name="total"
						className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
						value={formData.total}
						onChange={handleChange}
						placeholder="Total $"
						required
					/>
				</div>
				<div className="section w-full relative z-0 ">
					<input
						type="text"
						id="description"
						name="description"
						className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
						value={formData.description}
						placeholder="Descripción"
						onChange={handleChange}
					/>
				</div>
				<div className="section w-full relative z-0 ">
					<input
						type="text"
						id="category"
						name="category"
						className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
						value={formData.category}
						placeholder="Categoría"
						onChange={handleChange}
						required
					/>
				</div>
				<div className="section w-full  relative z-0 ">
					<input
						type="string"
						id="fecha"
						name="fecha"
						className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
						value={formData.fecha}
						placeholder="Categoría"
						onChange={handleChange}
						required
					/>
				</div>
				<button
					type="submit"
					className=" text-gray-100 w-full p-4 bg-black font-bold  rounded-md   outline-none"
				>
					Guardar
				</button>
			</div>
		</form>
	);
};
