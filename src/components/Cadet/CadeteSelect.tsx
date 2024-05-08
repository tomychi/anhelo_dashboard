import { useEffect } from 'react';
import './CadeteSelect.css';
import { readEmpleados } from '../../firebase/registroEmpleados';
interface CadeteSelectProps {
  handleCadeteChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  cadetes: string[];
  setCadetes: (cadetes: string[]) => void;
}

const CadeteSelect: React.FC<CadeteSelectProps> = ({
  handleCadeteChange,
  cadetes,
  setCadetes,
}) => {
  useEffect(() => {
    const obtenerCadetes = async () => {
      try {
        const empleados = await readEmpleados();
        const cadetesFiltrados = empleados
          .filter((empleado) => empleado.category === 'cadete')
          .map((empleado) => empleado.name);
        setCadetes(cadetesFiltrados);
      } catch (error) {
        console.error('Error al obtener los cadetes:', error);
      }
    };

    obtenerCadetes();
  }, []);

  return (
    <div className=" z-50 bg-white p-3 rounded-lg shadow-md">
      <label>Selecciona un cadete:</label>
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
