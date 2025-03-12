interface NavButtonsProps {
  seccionActiva: string;
  setSeccionActiva: (seccion: string) => void;
}

export const NavButtons = ({
  seccionActiva,
  setSeccionActiva,
}: NavButtonsProps) => {
  return (
    <div className=" w-full">
      <div className="flex font-coolvetica mx-auto flex-row gap-2 mb-4">
        <button
          className={`p-2 h-10 ${
            seccionActiva === "porHacer"
              ? "bg-black rounded-full text-gray-100"
              : "bg-gray-200 rounded-full  text-black"
          } text-black font-bold w-min px-4 `}
          onClick={() => setSeccionActiva("porHacer")}
        >
          Hacer
        </button>
        <button
          className={`p-2 h-10 ${
            seccionActiva === "hechos"
              ? "bg-black rounded-full text-gray-100"
              : "bg-gray-200 rounded-full  text-black"
          } text-black font-medium w-min px-4   `}
          onClick={() => setSeccionActiva("hechos")}
        >
          Hechos
        </button>
        <button
          className={`p-2 h-10 ${
            seccionActiva === "entregados"
              ? "bg-black rounded-full text-gray-100"
              : "bg-gray-200 rounded-full  text-black"
          } text-black font-medium w-min px-4  `}
          onClick={() => setSeccionActiva("entregados")}
        >
          Entregados
        </button>
      </div>
    </div>
  );
};
