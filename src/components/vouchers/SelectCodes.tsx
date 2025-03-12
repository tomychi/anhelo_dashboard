import { useState, useEffect } from "react";
import {
  Codigo,
  moverCodigosARango,
  obtenerCodigosOrdenados,
  VoucherTituloConFecha,
} from "../../firebase/voucher";

export const SelectCodes = ({
  voucherTitles,
}: {
  voucherTitles: VoucherTituloConFecha[];
}) => {
  const [codigos, setCodigos] = useState<Codigo[]>([]);
  const [minCodigo, setMinCodigo] = useState<number | "">("");
  const [maxCodigo, setMaxCodigo] = useState<number | "">("");
  const [selectedCodes, setSelectedCodes] = useState<Codigo[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCodigos = async () => {
      setLoading(true);
      try {
        const codigosOrdenados = await obtenerCodigosOrdenados();
        setCodigos(codigosOrdenados);
      } catch (error) {
        console.error("Error al obtener los códigos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCodigos();
  }, []);

  const handleSelectRange = async () => {
    if (minCodigo === "" || maxCodigo === "") {
      alert("Por favor, ingrese ambos valores de rango.");
      return;
    }

    if (!selectedTitle) {
      alert("Por favor, seleccione un título.");
      return;
    }

    const seleccionados = codigos.filter(
      (codigo) =>
        codigo.num >= (minCodigo as number) &&
        codigo.num <= (maxCodigo as number)
    );

    setSelectedCodes(seleccionados);

    try {
      await moverCodigosARango(selectedTitle, seleccionados);
      alert("Códigos movidos correctamente");
    } catch (error) {
      alert("Error al mover códigos");
    }
  };

  return (
    <div className="flex flex-col p-4 gap-4">
      {/* Selector de título */}
      <select
        value={selectedTitle}
        onChange={(e) => setSelectedTitle(e.target.value)}
        className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
      >
        <option value="">Seleccionar Título</option>
        {voucherTitles.map((title) => (
          <option key={title.titulo} value={title.titulo}>
            {title.titulo}
          </option>
        ))}
      </select>

      <input
        type="number"
        placeholder="Código mínimo"
        value={minCodigo || ""}
        onChange={(e) =>
          setMinCodigo(
            e.target.value === "" ? "" : parseInt(e.target.value, 10)
          )
        }
        className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
      />
      <input
        type="number"
        placeholder="Código máximo"
        value={maxCodigo || ""}
        onChange={(e) =>
          setMaxCodigo(
            e.target.value === "" ? "" : parseInt(e.target.value, 10)
          )
        }
        className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
      />
      <button
        onClick={handleSelectRange}
        disabled={loading}
        className="text-gray-100 w-full h-10 px-4 bg-black font-medium rounded-md outline-none"
      >
        {loading ? "Cargando..." : "Seleccionar Rango"}
      </button>
    </div>
  );
};
