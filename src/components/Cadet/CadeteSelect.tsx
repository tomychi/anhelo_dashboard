import { PedidoProps } from "../../types/types";
import arrowIcon from "../../assets/arrowIcon.png";
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
    <div className="relative inline-block ml-2">
      <div className="relative inline-block">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-6 absolute left-3 top-1/2  -translate-y-1/2"
          style={{
            filter: "invert(100%)",
          }}
        >
          <path
            fillRule="evenodd"
            d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
            clipRule="evenodd"
          />
        </svg>
        <select
          onChange={handleCadeteChange}
          className="bg-black appearance-none pt-2 pl-11 pr-8 pb-3 px-3 text-gray-100 font-medium rounded-full"
          style={{
            WebkitAppearance: "none",
            MozAppearance: "none",
            width: "auto",
          }}
        >
          <option
            value=""
            className="          text-black rounded-lg
    font-coolvetica
    font-medium
    bg-gray-200
    p-4
    cursor-pointer


          "
          >
            Selecciona un cadete
          </option>
          {cadetes.map((cadete, index) => (
            <option
              key={`${cadete}-${index}-select`}
              value={cadete}
              className="   text-black rounded-lg
    font-coolvetica
    font-medium
    bg-gray-200
    p-4
    cursor-pointer"
            >
              {cadete}
            </option>
          ))}
        </select>
        <img
          src={arrowIcon}
          alt="Arrow Icon"
          className="absolute right-3 top-1/2 h-2 rotate-90 -translate-y-1/2 pointer-events-none"
          style={{
            filter: "invert(100%)",
          }}
        />
      </div>
    </div>
  );
};

export default CadeteSelect;
