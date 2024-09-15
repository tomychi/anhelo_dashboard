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
		<div className=" flex flex-col mt-4">
			<select
				onChange={handleCadeteChange}
				className="
    text-black rounded-lg
    font-coolvetica
    font-medium
    bg-gray-300
    p-4
    cursor-pointer
  "
			>
				<option
					value=""
					className="          text-black rounded-lg
    font-coolvetica
    font-medium
    bg-gray-300
    p-4
    cursor-pointer
     
        
          "
				>
					SELECCIONA UN CADETE
				</option>
				{cadetes.map((cadete, index) => (
					<option
						key={index}
						value={cadete}
						className="   text-black rounded-lg
    font-coolvetica
    font-medium
    bg-gray-300
    p-4
    cursor-pointer"
					>
						{cadete}
					</option>
				))}
			</select>
		</div>
	);
};

export default CadeteSelect;
