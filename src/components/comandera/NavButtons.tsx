interface NavButtonsProps {
  seccionActiva: string;
  setSeccionActiva: (seccion: string) => void;
  cadeteSeleccionado: string;
}

export const NavButtons = ({
  seccionActiva,
  setSeccionActiva,
  cadeteSeleccionado,
}: NavButtonsProps) => {
  return (
    <div className="">
      <div className="flex font-antonio flex-row gap-2 mb-2">
        <button
          className={`p-2 ${
            seccionActiva === 'porHacer'
              ? 'bg-custom-red'
              : 'border-2 border-red-main text-custom-red'
          } text-black font-black uppercase `}
          onClick={() => setSeccionActiva('porHacer')}
        >
          Hacer
        </button>
        <button
          className={`p-2 ${
            seccionActiva === 'hechos'
              ? 'bg-custom-red'
              : 'border-2 border-red-main text-custom-red'
          } text-black font-black uppercase `}
          onClick={() => setSeccionActiva('hechos')}
        >
          Hechos
        </button>
        <button
          className={`p-2 ${
            seccionActiva === 'entregados'
              ? 'bg-custom-red'
              : 'border-2 border-red-main text-custom-red'
          } text-black font-black uppercase `}
          onClick={() => setSeccionActiva('entregados')}
        >
          Entregados
        </button>
        <button
          className={`p-2 ${
            seccionActiva === 'mapa'
              ? 'bg-custom-red'
              : 'border-2 border-red-main text-custom-red'
          } text-black font-black uppercase `}
          onClick={() => setSeccionActiva('mapa')}
        >
          Mapa: {cadeteSeleccionado ? ` ${cadeteSeleccionado}` : 'General'}
        </button>
      </div>
    </div>
  );
};