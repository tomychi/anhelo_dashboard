/**
 * Componente de barra de progreso reutilizable
 * @param {Object} props - Propiedades del componente
 * @param {number} props.percent - Porcentaje de progreso (0-100)
 * @param {number} props.current - Elemento actual que se está procesando
 * @param {number} props.total - Total de elementos a procesar
 * @param {string} props.label - Etiqueta personalizada (opcional)
 * @param {string} props.height - Altura de la barra (opcional, default: "h-2.5")
 * @param {string} props.bgColor - Color de fondo de la barra (opcional, default: "bg-gray-200")
 * @param {string} props.fillColor - Color de relleno de la barra (opcional, default: "bg-black")
 * @param {boolean} props.showLabels - Mostrar etiquetas de texto (opcional, default: true)
 * @returns {JSX.Element}
 */
const ProgressBar = ({
  percent,
  current,
  total,
  label,
  height = "h-1",
  bgColor = "bg-gray-200",
  fillColor = "bg-black",
  showLabels = true,
}) => {
  // Asegurar que el porcentaje esté entre 0 y 100
  const safePercent = Math.min(Math.max(percent, 0), 100);

  // Mensaje predeterminado si no se proporciona una etiqueta personalizada
  const defaultLabel =
    current && total ? `Procesando ${current} de ${total}` : `Progreso`;

  return (
    <div className="w-full flex flex-col items-center justify-center ">
      {showLabels && (
        <div className="flex items-center justify-center text-xs gap-2 mb-2">
          <span className="text-gray-100 font-light text-center">
            {label || defaultLabel} :
          </span>
          <span className="text-gray-100 font-bold">
            {Math.round(safePercent)}%
          </span>
        </div>
      )}
      <div className={`w-full ${bgColor} rounded-full ${height}`}>
        <div
          className={`${fillColor} ${height} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${safePercent}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
