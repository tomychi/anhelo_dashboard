import React, { ChangeEvent, FormEvent, useState } from "react";
import { obtenerFechaActual } from "../../helpers/dateToday";
import { UploadExpense, ExpenseProps } from "../../firebase/UploadGasto";
import Swal from "sweetalert2";
import { updateMaterialCost } from "../../firebase/Materiales";
import { calculateUnitCost } from "../../helpers/calculator";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import { uploadFile } from "../../firebase/files";
import { projectAuth } from "../../firebase/config";

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

export const FormGasto = () => {
	const currentUserEmail = projectAuth.currentUser?.email;
	const isMarketingUser = currentUserEmail === "marketing@anhelo.com";
	const [unidadPorPrecio, setUnidadPorPrecio] = useState<number>(0);
	const { materiales } = useSelector((state: RootState) => state.materials);
	const [file, setFile] = useState<File | null>(null);

	const [formData, setFormData] = useState<ExpenseProps>({
		description: "",
		total: 0,
		category: isMarketingUser ? "marketing" : "", // Si es usuario de marketing, la categoría es 'marketing'
		fecha: obtenerFechaActual(),
		name: "",
		quantity: 0,
		unit: "",
		id: "",
		estado: "",
	});

	const handleChange = (
		e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target;

		const numericValue = parseFloat(value);
		const sanitizedValue = isNaN(numericValue) ? "" : numericValue;

		setFormData((prevData) => ({
			...prevData,
			[name]: name === "total" || name === "quantity" ? sanitizedValue : value,
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
				id: selectedMaterial.id,
				name: selectedMaterial.nombre,
				quantity: 0,
				unit: selectedMaterial.unit,
				total: 0,
				description: "",
				category: selectedMaterial.categoria,
				fecha: obtenerFechaActual(),
				estado: "",
			});
		} else {
			setFormData({
				...formData,
				name: value,
				quantity: 0,
				unit: "",
				total: 0,
				description: "",
				category: isMarketingUser ? "marketing" : "", // Si es usuario de marketing, la categoría es 'marketing'
				fecha: obtenerFechaActual(),
				estado: "",
			});
		}
	};

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const cost = calculateUnitCost(
			formData.total,
			formData.quantity,
			unidadPorPrecio,
			formData.unit,
			formData.name
		);

		// Aquí deberías manejar la carga del archivo si es necesario
		// Por ejemplo, podrías usar una función para subir el archivo a Firebase Storage

		UploadExpense(formData)
			.then((result) => {
				Swal.fire({
					icon: "success",
					title: `Gasto cargado`,
					text: `El gasto ${result.id} se cargó correctamente`,
				});
				// Aquí podrías agregar lógica adicional para manejar el archivo subido
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
			category: isMarketingUser ? "marketing" : "", // Si es usuario de marketing, la categoría es 'marketing'
			fecha: obtenerFechaActual(),
			name: "",
			quantity: 0,
			unit: "",
			id: "",
			estado: "",
		});
		setFile(null);
	};

	console.log(isMarketingUser);

	return (
		<form
			onSubmit={handleSubmit}
			className="items-center w-full justify-center p-4 rounded-md font-coolvetica text-black"
		>
			<div className="item-section w-full flex flex-col gap-4">
				<FileUpload onFileSelect={handleFileSelect} />
				<div className="section relative z-0">
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
						{materiales.map((material, index) => (
							<option key={index} value={material.nombre} />
						))}
					</datalist>
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
						<option value="pendiente">Pendiente</option>
						<option value="pagado">Pagado</option>
					</select>
				</div>
				{!isMarketingUser && (
					<div className="section w-full relative z-0">
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
				)}
				<div className="section w-full relative z-0">
					<input
						type="string"
						id="fecha"
						name="fecha"
						className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
						value={formData.fecha}
						placeholder="Fecha"
						onChange={handleChange}
						required
					/>
				</div>
				<button
					type="submit"
					className="text-gray-100 w-full py-4 rounded-lg bg-black text-4xl font-medium"
				>
					Guardar
				</button>
			</div>
		</form>
	);
};
