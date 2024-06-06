import Swal from "sweetalert2";
import { UploadVueltaCadete, VueltaInfo } from "../../firebase/Cadetes";
import { PedidoProps } from "../../types/types";
import "./CadeteSelect.css";
interface CadeteSelectProps {
	handleCadeteChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
	cadetes: string[];
	selectedCadete: string | null;
	orders: PedidoProps[];
	vueltas: VueltaInfo[];
	setVueltas: (vueltas: VueltaInfo[]) => void;
}

const CadeteSelect: React.FC<CadeteSelectProps> = ({
	handleCadeteChange,
	cadetes,
	selectedCadete,
	orders,
	vueltas,
	setVueltas,
}) => {
	// mapear las vueltas del cadete y si hay una vuelta sin hora de llegada, mostrar el boton para marcar la vuelta

	const vueltaSinHoraLlegada = vueltas.find(
		(vuelta) => vuelta.horaLlegada === null
	);

	return (
		<div className="z-50 flex flex-col mt-4">
			<select
				onChange={handleCadeteChange}
				className="
    text-black
    font-antonio
    uppercase
    font-black
    bg-red-main
    p-4
    rounded-none
    cursor-pointer
  "
			>
				<option
					value=""
					className="       text-black
        font-antonio
        uppercase
        font-black
        bg-red-main
        
          "
				>
					SELECCIONA UN CADETE
				</option>
				{cadetes.map((cadete, index) => (
					<option
						key={index}
						value={cadete}
						className="text-black font-antonio uppercase font-black bg-red-main"
					>
						{cadete}
					</option>
				))}
			</select>
			{/* boton para que si hay cadete seleccionado me deje hacer click y marcar la vuelta de ese cadete */}

			{selectedCadete ? (
				<button
					className={
						vueltaSinHoraLlegada
							? "bg-custom-red text-black font-antonio font-black uppercase p-8 mb-2 mt-4"
							: "bg-green-500 text-white font-antonio font-black uppercase p-8 mt-4 mb-2"
					}
					onClick={() => {
						// si vueltaSinHoraLlegada es false tiene que marcar la vuelta de salida y tiene q haber pedidos
						if (!vueltaSinHoraLlegada && orders.length === 0) {
							Swal.fire({
								icon: "error",
								title: "No hay pedidos para marcar la vuelta",
							});
							return;
						}

						UploadVueltaCadete(
							orders.map((order) => order.id),
							selectedCadete
						)
							.then((res) => {
								Swal.fire({
									icon: "success",
									title: "VUELTA MARCADA",
									text: res.map((vuelta) => vuelta.horaSalida).join(", "),
								});
								setVueltas(res as VueltaInfo[]);
							})
							.catch((err) => {
								Swal.fire({
									icon: "error",
									title: "Error al marcar la vuelta",
									text: err.message,
								});
							});
					}}
				>
					{vueltaSinHoraLlegada ? "MARCAR REGRESO" : "MARCAR SALIDA"}
				</button>
			) : (
				<button
					className="border-2 border-red-main text-custom-red font-antonio font-black uppercase p-8 mb-2 mt-4"
					onClick={() => {
						Swal.fire({
							icon: "error",
							title: "Necesitas marcar un cadete para arrancar tu vuelta",
						});
					}}
				>
					Necesitas marcar un cadete para arrancar tu vuelta
				</button>
			)}
		</div>
	);
};

export default CadeteSelect;
