import { PedidoProps } from "../../types/types";
import "./CadeteSelect.css";
interface CadeteSelectProps {
	handleCadeteChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
	cadetes: string[];
	selectedCadete: string | null;
	orders: PedidoProps[];
}

const CadeteSelect: React.FC<CadeteSelectProps> = ({
	handleCadeteChange,
	cadetes,
}) => {
	// mapear las vueltas del cadete y si hay una vuelta sin hora de llegada, mostrar el boton para marcar la vuelta

	return (
		<div className="z-50 flex flex-col mt-4">
			<select
				onChange={handleCadeteChange}
				className="
    text-black
    font-coolvetica
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
        font-coolvetica
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
						className="text-black font-coolvetica uppercase font-black bg-red-main"
					>
						{cadete}
					</option>
				))}
			</select>
		</div>
	);
};

export default CadeteSelect;
