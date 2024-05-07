import './CadeteSelect.css';
interface CadeteSelectProps {
  onChange: (cadete: string) => void;
  cadetes: string[];
}

const CadeteSelect: React.FC<CadeteSelectProps> = ({ onChange, cadetes }) => {
  const handleCadeteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="cadete-select-container">
      <label>Selecciona un cadete:</label>
      {/*  estilos tailwind al select */}
      <select
        onChange={handleCadeteChange}
        className="
        text-white
        bg-blue-500
        hover:bg-blue-700
        py-2
        px-4
        border
        border-blue-700
        rounded
        shadow-md
        cursor-pointer
      "
      >
        <option
          value=""
          className="  text-white
            bg-blue-500
            hover:bg-blue-700
            py-2
            px-4
            border
            border-blue-700
            rounded
            shadow-md
            cursor-pointer
          "
        >
          Todos los cadetes
        </option>
        {cadetes.map((cadete, index) => (
          <option
            key={index}
            value={cadete}
            className="
            text-white
            bg-blue-500
            hover:bg-blue-700
            py-2
            px-4
            border
            border-blue-700
            rounded
            shadow-md
            cursor-pointer
          "
          >
            {cadete}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CadeteSelect;
