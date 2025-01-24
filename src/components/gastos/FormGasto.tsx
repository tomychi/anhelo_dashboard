import React, { ChangeEvent, FormEvent, useState } from "react";
import { obtenerFechaActual } from "../../helpers/dateToday";
import { UploadExpense, } from "../../firebase/UploadGasto";
import Swal from "sweetalert2";
import { updateMaterialCost } from "../../firebase/Materiales";
import { calculateUnitCost } from "../../helpers/calculator";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import { uploadFile } from "../../firebase/files";
import { projectAuth } from "../../firebase/config";
import { CATEGORIAS, UNIDADES, ESTADOS, ExpenseProps } from "../../constants/expenses";


interface FileUploadProps {
	onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
	const [file, setFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const selectedFile = e.target.files[0];
			setFile(selectedFile);
			onFileSelect(selectedFile); // Pasar el archivo seleccionado a la prop
			startUpload(selectedFile);
		}
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			const selectedFile = e.dataTransfer.files[0];
			setFile(selectedFile);
			onFileSelect(selectedFile); // Pasar el archivo seleccionado a la prop

			startUpload(selectedFile);
		}
	};

	const startUpload = (file: File) => {
		setUploading(true);
		setError(null);

		uploadFile(
			file,
			(progress) => setUploadProgress(progress),
			(downloadURL) => {
				console.log("Archivo subido con éxito:", downloadURL);
				setUploading(false);
			},
			(uploadError) => {
				console.error("Error al subir el archivo:", uploadError);
				setError("Hubo un error al subir el archivo. Inténtalo de nuevo.");
				setUploading(false);
			}
		);
	};

	return (
		<div
			className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer"
			onDragOver={handleDragOver}
			onDrop={handleDrop}
			onClick={() => document.getElementById("fileInput")?.click()}
		>
			<input
				type="file"
				id="fileInput"
				className="hidden"
				onChange={handleFileChange}
			/>
			<svg
				className="w-12 h-12 text-gray-400 mb-4"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
				/>
			</svg>
			<p className="text-sm text-gray-600">
				{file ? file.name : "Selecciona o arrastra un documento"}
			</p>
			{uploading && (
				<p className="text-sm text-gray-600">
					Subiendo: {Math.round(uploadProgress)}%
				</p>
			)}
			{error && <p className="text-sm text-red-600">{error}</p>}
		</div>
	);
};

const formatDateForInput = (dateString: string): string => {
	const [day, month, year] = dateString.split('/');
	return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const formatDateForDB = (dateString: string): string => {
	const [year, month, day] = dateString.split('-');
	return `${day}/${month}/${year}`;
};

export const FormGasto = () => {
	const currentUserEmail = projectAuth.currentUser?.email;
	const isMarketingUser = currentUserEmail === "marketing@anhelo.com";
	const [unidadPorPrecio, setUnidadPorPrecio] = useState<number>(0);
	const { materiales } = useSelector((state: RootState) => state.materials);
	const [file, setFile] = useState<File | null>(null);


	const [formData, setFormData] = useState<Omit<ExpenseProps, 'id'>>({
		description: "",
		total: 0,
		category: isMarketingUser ? "marketing" : "ingredientes",
		fecha: obtenerFechaActual(), // Asumimos que esto devuelve DD/MM/YYYY
		name: "",
		quantity: 0,
		unit: "unidad",
		estado: "pendiente"
	});
	const [inputDateValue, setInputDateValue] = useState(formatDateForInput(obtenerFechaActual()));

	const handleChange = (
		e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target;

		if (name === "total" || name === "quantity") {
			const numericValue = parseFloat(value);
			setFormData(prev => ({
				...prev,
				[name]: isNaN(numericValue) ? 0 : numericValue
			}));
		} else {
			setFormData(prev => ({
				...prev,
				[name]: value
			}));
		}
	};

	const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
		const inputDate = e.target.value; // Formato YYYY-MM-DD
		setInputDateValue(inputDate);

		// Actualizar el formData con el formato DD/MM/YYYY
		setFormData(prev => ({
			...prev,
			fecha: formatDateForDB(inputDate)
		}));
	};


	const handleFileSelect = (selectedFile: File) => {
		setFile(selectedFile);
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
			setFormData({
				...formData,
				name: selectedMaterial.nombre,
				quantity: 0,
				unit: selectedMaterial.unit,
				total: 0,
				description: "",
				category: selectedMaterial.categoria,
				estado: "pendiente"
			});
		} else {
			setFormData({
				...formData,
				name: value,
				quantity: 0,
				unit: "unidad",
				total: 0,
				description: "",
				category: isMarketingUser ? "marketing" : "ingredientes",
				estado: "pendiente"
			});
		}
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		console.log('Formulario enviado con datos:', formData);
		console.log('Unidad por precio:', unidadPorPrecio);

		const cost = calculateUnitCost(
			formData.total,
			formData.quantity,
			unidadPorPrecio,
			formData.unit,
			formData.name
		);

		console.log('Costo calculado:', cost);

		try {
			const expenseWithId = { ...formData, id: '' };
			const result = await UploadExpense(expenseWithId);

			console.log('Gasto guardado con éxito:', result);

			await Swal.fire({
				icon: "success",
				title: "Gasto cargado",
				text: `El gasto ${result.id} se cargó correctamente`
			});

			if (cost && formData.name) {
				try {
					console.log('Intentando actualizar material:', {
						nombre: formData.name,
						costo: cost,
						cantidad: formData.quantity
					});

					await updateMaterialCost(formData.name, cost, formData.quantity);

					await Swal.fire({
						icon: "success",
						title: "Costo actualizado",
						text: `El costo ${cost} se actualizó correctamente`
					});
				} catch (error) {
					console.error('Error al actualizar material:', error);
					Swal.fire({
						icon: "error",
						title: "Error",
						text: `Error al actualizar el costo del material: ${error}`
					});
				}
			} else {
				console.log('No se actualizó el material porque:', {
					tieneNombre: Boolean(formData.name),
					tieneCosto: Boolean(cost)
				});
			}

			const currentDate = formData.fecha;
			setFormData({
				description: "",
				total: 0,
				category: isMarketingUser ? "marketing" : "ingredientes",
				fecha: currentDate,
				name: "",
				quantity: 0,
				unit: "unidad",
				estado: "pendiente"
			});
			setFile(null);

		} catch (error) {
			console.error('Error en el proceso completo:', error);
			Swal.fire({
				icon: "error",
				title: "Error",
				text: `Hubo un error al cargar el gasto: ${error}`
			});
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="items-center w-full justify-center p-4 rounded-md font-coolvetica text-black"
		>
			<div className="item-section w-full flex flex-col gap-2">
				<FileUpload onFileSelect={handleFileSelect} />
				<div className="section relative z-0">
					{!isMarketingUser && (
						<div className="section w-full relative mb-2 z-0">
							<select
								id="category"
								name="category"
								className="cursor-pointer custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
								value={formData.category}
								onChange={handleChange}
								required
							>
								<option value="">Seleccionar categoría</option>
								{CATEGORIAS.map((category) => (
									<option key={category} value={category}>
										{category}
									</option>
								))}
							</select>
						</div>
					)}
					<input
						type="text"
						id="name"
						name="name"
						className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
						value={formData.name}
						onChange={handleNameChange}
						placeholder="Nombre del item"
						list={isMarketingUser ? undefined : "itemNames"}
						required
						autoComplete="off"
					/>
					{!isMarketingUser && (
						<datalist id="itemNames">
							{materiales.map((material, index) => (
								<option key={index} value={material.nombre} />
							))}
						</datalist>
					)}
				</div>
				<div className="section relative z-0">
					<input
						type="number"
						id="quantity"
						name="quantity"
						value={formData.quantity || ""}
						className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
						onChange={handleChange}
						placeholder="Cantidad"
						required
					/>
				</div>
				<div className="section relative z-0">
					<select
						id="unit"
						name="unit"
						value={formData.unit}
						className="cursor-pointer custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
						onChange={handleChange}
						required
					>
						<option value="">Seleccionar unidad</option>
						{UNIDADES.map((unit) => (
							<option key={unit} value={unit}>
								{unit}
							</option>
						))}
					</select>
				</div>
				<div className="section w-full relative z-0">
					<input
						type="number"
						id="total"
						name="total"
						className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
						value={formData.total || ""}
						onChange={handleChange}
						placeholder="Total $"
						required
					/>
				</div>
				<div className="section w-full relative z-0">
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
				<div className="section w-full relative z-0">
					<select
						id="estado"
						name="estado"
						className="cursor-pointer custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
						value={formData.estado}
						onChange={handleChange}
						required
					>
						{ESTADOS.map((estado) => (
							<option key={estado} value={estado}>
								{estado}
							</option>
						))}
					</select>
				</div>

				<div className="section w-full relative z-0">
					<input
						type="date"
						id="fecha"
						name="fecha"
						className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
						value={inputDateValue}
						onChange={handleDateChange}
						required
					/>
				</div>
				<button
					type="submit"
					className="text-gray-100 w-full h-20 mt-2 rounded-lg bg-black text-4xl font-bold"
				>
					Guardar
				</button>
			</div>
		</form>
	);
};
