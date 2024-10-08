interface NavButtonsProps {
  seccionActiva: string;
  setSeccionActiva: (seccion: string) => void;
}

export const NavButtons = ({
  seccionActiva,
  setSeccionActiva,
}: NavButtonsProps) => {
  return (
    <div className="">
      <div className="flex font-coolvetica flex-row gap-2 mb-4">
        <button
          className={`p-2 ${
            seccionActiva === "porHacer"
              ? "bg-black rounded-full text-gray-100"
              : "border border-1 rounded-full border-black text-black"
          } text-black font-medium w-40 `}
          onClick={() => setSeccionActiva("porHacer")}
        >
          Hacer
        </button>
        <button
          className={`p-2 ${
            seccionActiva === "hechos"
              ? "bg-black rounded-full text-gray-100"
              : "border border-1 rounded-full border-black text-black"
          } text-black font-medium w-40  `}
          onClick={() => setSeccionActiva("hechos")}
        >
          Hechos
        </button>
        <button
          className={`p-2 ${
            seccionActiva === "entregados"
              ? "bg-black rounded-full text-gray-100"
              : "border border-1 rounded-full border-black text-black"
          } text-black font-medium w-40  `}
          onClick={() => setSeccionActiva("entregados")}
        >
          Entregados
        </button>

        <button
          className={`p-2 ${
            seccionActiva === "cerca"
              ? "bg-black rounded-full text-gray-100"
              : "border border-1 rounded-full border-black text-black"
          } text-black font-medium w-40  `}
          onClick={() => setSeccionActiva("cerca")}
        >
          cerca
        </button>
        {/* <button
					className={`p-2 ${
						seccionActiva === "mapa"
							? "bg-black rounded-full text-gray-100"
							: "border border-1 rounded-full border-black text-black"
					} text-black font-medium w-40 `}
					onClick={() => setSeccionActiva("mapa")}
				>
					Mapa
				</button>

				<button
					className={`p-2 ${
						seccionActiva === "registro"
							? "bg-black rounded-full text-gray-100"
							: "border border-1 rounded-full border-black text-black"
					} text-black font-medium w-40 `}
					onClick={() => setSeccionActiva("registro")}
				>
					Registro
				</button> */}
      </div>
    </div>
  );
};
