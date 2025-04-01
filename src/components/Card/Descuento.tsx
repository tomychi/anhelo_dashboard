import { useState } from "react";
import { updateCompesasionForOrder } from "../../firebase/UploadOrder";

interface DescuentoProps {
  fechaPedido: string;
  pedidoId: string;
}

export const Descuento = ({ fechaPedido, pedidoId }: DescuentoProps) => {
  const [bonificacion, setBonificacion] = useState(0);
  const [compensacionPorError, setCompensacionPorError] = useState(0);
  const handleSubmit = () => {
    updateCompesasionForOrder(
      fechaPedido,
      pedidoId,
      compensacionPorError,
      bonificacion
    )
      .then(() => {
        // console.log("Datos actualizados correctamente en la base de datos");
        // Aquí puedes realizar cualquier acción adicional después de enviar los datos
      })
      .catch((error) => {
        console.error("Error al actualizar datos en la base de datos:", error);
      });
  };
  return (
    <div className="font-black flex flex-col gap-4">
      <div className="flex flex-row gap-2">
        <label htmlFor="bonificacion" className="text-white">
          Bonificación:
        </label>
        <input
          className="w-full bg-white text-red-main font-black pl-1 pr-1"
          type="number"
          id="bonificacion"
          value={bonificacion}
          onChange={(e) => setBonificacion(parseInt(e.target.value))}
        />
      </div>
      <div className="flex flex-row gap-2">
        <label htmlFor="compensacionPorError" className="text-white">
          Compensación:
        </label>
        <input
          type="number"
          className="w-full bg-white text-red-main font-black pl-1 pr-1"
          id="compensacionPorError"
          value={compensacionPorError}
          onChange={(e) => setCompensacionPorError(parseInt(e.target.value))}
        />
      </div>
      <button
        onClick={() => handleSubmit()}
        className="bg-white text-custom-red uppercase cursor-pointer"
      >
        Enviar a la base de datos
      </button>
    </div>
  );
};
