import { ChangeEvent, FormEvent, useState } from "react";
import { obtenerFechaActual } from "../../helpers/dateToday";
import { UploadExpense, ExpenseProps } from "../../firebase/UploadGasto";
import Swal from "sweetalert2";

export const FormGasto = () => {
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
		setFormData((prevData) => ({
			...prevData,
			[name]: name === "total" ? parseInt(value) : value,
		}));
	};

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		UploadExpense(formData)
			.then((result) => {
				Swal.fire({
					icon: "success",
					title: `Gasto cargado`,
					text: `El gasto ${result.id} se cargó correctamente`,
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
			className="flex flex-col items-center w-full justify-center font-antonio font-black text-black bg-custom-red p-4"
		>
			<div className="item-section w-full">
				<div className="section  relative z-0 mt-4">
					<label
						htmlFor="name"
						className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>
						Nombre del Ítem:
					</label>
					<input
						type="text"
						id="name"
						name="name"
						className="block py-2.5  w-full  texk-black  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
						value={formData.name}
						onChange={handleChange}
						required
					/>
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
				className=" text-custom-red w-full p-4 bg-black font-black uppercase  outline-none"
			>
				Guardar
			</button>
		</form>
	);
};
