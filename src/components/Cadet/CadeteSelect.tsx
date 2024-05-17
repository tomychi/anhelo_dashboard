import Swal from 'sweetalert2';
import { UploadVueltaCadete, VueltaInfo } from '../../firebase/Cadetes';
import { PedidoProps } from '../../types/types';
import './CadeteSelect.css';
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

      {/* boton para que si hay cadete seleccionado me deje hacer click y marcar la vuelta de ese cadete */}

      {selectedCadete && (
        <button
          className={
            vueltaSinHoraLlegada
              ? 'bg-custom-red text-white px-2 py-1 rounded-md mr-2'
              : 'bg-green-500 text-white px-2 py-1 rounded-md mr-2'
          }
          onClick={() => {
            // si vueltaSinHoraLlegada es false tiene que marcar la vuelta de salida y tiene q haber pedidos
            if (!vueltaSinHoraLlegada && orders.length === 0) {
              Swal.fire({
                icon: 'error',
                title: 'No hay pedidos para marcar la vuelta',
              });
              return;
            }

            UploadVueltaCadete(
              orders.map((order) => order.id),
              selectedCadete
            )
              .then((res) => {
                Swal.fire({
                  icon: 'success',
                  title: 'Vuelta marcada',
                  text: res.map((vuelta) => vuelta.horaSalida).join(', '),
                });
                setVueltas(res as VueltaInfo[]);
              })
              .catch((err) => {
                Swal.fire({
                  icon: 'error',
                  title: 'Error al marcar la vuelta',
                  text: err.message,
                });
              });
          }}
        >
          {vueltaSinHoraLlegada ? 'LLegada a cocina' : 'Saliendo'}
        </button>
      )}
    </div>
  );
};

export default CadeteSelect;
