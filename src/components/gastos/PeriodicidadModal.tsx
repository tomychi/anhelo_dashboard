import React, { useState, useRef, useEffect } from "react";

interface PeriodicidadModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoria: string;
  periodicidadActual: number;
  onUpdate: (categoria: string, nuevaPeriodicidad: number) => void;
}

const PeriodicidadModal: React.FC<PeriodicidadModalProps> = ({
  isOpen,
  onClose,
  categoria,
  periodicidadActual,
  onUpdate,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const modalRef = useRef(null);
  const [periodicidad, setPeriodicidad] = useState(periodicidadActual || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Configurar animación al abrir
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setCurrentTranslate(0);
      setPeriodicidad(periodicidadActual || 1);
    }
  }, [isOpen, periodicidadActual]);

  // Gestión de arrastre para el gesto de cierre
  const handleTouchStart = (e) => {
    setDragStart(e.touches[0].clientY);
  };

  const handleMouseDown = (e) => {
    setDragStart(e.clientY);
  };

  const handleTouchMove = (e) => {
    if (dragStart === null) return;
    const currentPosition = e.touches[0].clientY;
    const difference = currentPosition - dragStart;
    if (difference < 0) return;
    setCurrentTranslate(difference);
  };

  const handleMouseMove = (e) => {
    if (dragStart === null) return;
    const difference = e.clientY - dragStart;
    if (difference < 0) return;
    setCurrentTranslate(difference);
  };

  const handleDragEnd = () => {
    if (currentTranslate > 200) {
      handleClose();
    } else {
      setCurrentTranslate(0);
    }
    setDragStart(null);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (dragStart !== null) {
        handleDragEnd();
      }
    };

    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleDragEnd);

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [dragStart, currentTranslate]);

  // Cerrar el modal y resetear estado
  const handleClose = () => {
    setIsAnimating(false);
    setCurrentTranslate(0);
    onClose();
  };

  // Guardar cambios
  const handleSavePeriodicidad = async () => {
    setLoading(true);
    try {
      // Llamar a la función del componente padre para actualizar
      onUpdate(categoria, periodicidad);
      handleClose();
    } catch (error) {
      console.error("Error al guardar la periodicidad:", error);
      setError("Ocurrió un error al guardar la periodicidad.");
    } finally {
      setLoading(false);
    }
  };

  // Opciones predefinidas de periodicidad
  const opcionesPeriodicidad = [
    { label: "Diario", valor: 1 },
    { label: "Semanal", valor: 7 },
    { label: "Quincenal", valor: 15 },
    { label: "Mensual", valor: 30 },
  ];

  // Si está cerrado, no renderizar nada
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end font-coolvetica justify-center">
      <div
        className={`absolute inset-0 backdrop-blur-sm bg-black transition-opacity duration-300 ${
          isAnimating ? "bg-opacity-50" : "bg-opacity-0"
        }`}
        style={{
          opacity: Math.max(0, 1 - currentTranslate / 400),
        }}
        onClick={handleClose}
      />

      <div
        ref={modalRef}
        className={`relative bg-white w-full max-w-4xl rounded-t-lg px-4 pb-4 pt-10 transition-transform duration-300 touch-none ${
          isAnimating ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          transform: `translateY(${currentTranslate}px)`,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-12 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        >
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
            <div className="w-12 h-1 bg-gray-200 rounded-full" />
          </div>
        </div>

        <div className="flex-col space-y-4 w-full">
          <h2 className="text-2xl mx-8 text-center font-bold mb-4">
            Configurar periodicidad: {categoria}
          </h2>

          <div className="text-sm text-gray-600 mb-4 text-center">
            Define cada cuántos días se debe considerar este gasto para el
            cálculo de costos
          </div>

          {/* Opciones predefinidas */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {opcionesPeriodicidad.map((opcion) => (
              <button
                key={opcion.valor}
                className={`p-4 rounded-lg text-center transition-colors ${
                  periodicidad === opcion.valor
                    ? "bg-black text-white"
                    : "bg-gray-100"
                }`}
                onClick={() => setPeriodicidad(opcion.valor)}
              >
                {opcion.label}
              </button>
            ))}
          </div>

          {/* Input para valor personalizado */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personalizado (en días)
            </label>
            <div className="flex items-center">
              <input
                type="number"
                min="1"
                max="365"
                value={periodicidad}
                onChange={(e) => setPeriodicidad(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
              <span className="ml-2">días</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Ejemplo: 31 para gastos mensuales, 7 para semanales
            </p>
          </div>

          {/* Explicación */}
          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 mb-6">
            <h3 className="font-medium mb-2">¿Cómo funciona?</h3>
            <p>
              Si eliges una periodicidad de <strong>{periodicidad} días</strong>
              :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                Los gastos de esta categoría se dividirán entre {periodicidad}{" "}
                para cálculos diarios
              </li>
              <li>
                Si seleccionas 3 días en el calendario, se tomará{" "}
                {3 / periodicidad < 1
                  ? ((3 / periodicidad) * 100).toFixed(1) + "%"
                  : (3 / periodicidad).toFixed(1)}{" "}
                del gasto total
              </li>
              <li>
                Ideal para gastos{" "}
                {periodicidad === 1
                  ? "diarios"
                  : periodicidad === 7
                    ? "semanales"
                    : periodicidad === 15
                      ? "quincenales"
                      : "mensuales o periódicos"}
              </li>
            </ul>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
              <p className="text-red-500 text-xs">{error}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleSavePeriodicidad}
          disabled={loading}
          className="text-gray-100 w-full mt-6 text-4xl h-20 px-4 bg-black font-bold rounded-lg outline-none"
        >
          {loading ? (
            <div className="flex justify-center w-full items-center">
              <div className="flex flex-row gap-1">
                <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          ) : (
            "Guardar"
          )}
        </button>
      </div>
    </div>
  );
};

export default PeriodicidadModal;
