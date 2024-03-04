import Swal from "sweetalert2";
interface ConfirmationModalProps {
	handleConfirmation: () => void;
}

export const ConfirmationModal = ({
	handleConfirmation,
}: ConfirmationModalProps) => {
	const showConfirmation = () => {
		Swal.fire({
			title: "¿Estás seguro?",
			text: "Se van a guardar los cambios en la base de datos.",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#3085d6",
			cancelButtonColor: "#d33",
			confirmButtonText: "Sí, guardar cambios",
			cancelButtonText: "Cancelar",
		}).then((result) => {
			if (result.isConfirmed) {
				handleConfirmation(); // Llamamos a la función para guardar los cambios
			}
		});
	};

	return (
		<button
			onClick={showConfirmation}
			className="  text-custom-red w-full p-4 mt-4 bg-black font-black uppercase  outline-none "
		>
			ACTUALIZAR
		</button>
	);
};
