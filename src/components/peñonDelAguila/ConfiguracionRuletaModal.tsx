import React, { useState, useRef, useEffect } from "react";
import arrowIcon from "../../assets/arrowIcon.png"; // Asegúrate de importar el ícono

interface ConfiguracionRuletaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveConfig: (selectedItems: number[]) => void;
  initialItems?: number[];
}

export const ConfiguracionRuletaModal: React.FC<
  ConfiguracionRuletaModalProps
> = ({ isOpen, onClose, onSaveConfig, initialItems = [] }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null); // Referencia al contenedor de scroll

  const [totalItems, setTotalItems] = useState(30);
  const [selectedItems, setSelectedItems] = useState<number[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [isScrollNeeded, setIsScrollNeeded] = useState(false); // Estado para detectar si hay scroll
  const [isNearBottom, setIsNearBottom] = useState(false); // Estado para detectar si estás cerca del fondo

  // Configurar animación al abrir
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setCurrentTranslate(0);
    }
  }, [isOpen]);

  // Detectar si se necesita scroll en la cuadrícula
  useEffect(() => {
    const checkIfScrollNeeded = () => {
      const container = scrollContainerRef.current;
      if (container) {
        setIsScrollNeeded(container.scrollHeight > container.clientHeight);
      }
    };

    if (isOpen) {
      checkIfScrollNeeded();
      window.addEventListener("resize", checkIfScrollNeeded);
    }

    return () => {
      window.removeEventListener("resize", checkIfScrollNeeded);
    };
  }, [isOpen, totalItems, selectedItems]); // Dependencias para reevaluar cuando cambian los ítems

  // Manejar el scroll para actualizar isNearBottom e isNearTop
  const [isNearTop, setIsNearTop] = useState(true); // Inicializamos en true porque comenzamos en la parte superior

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setIsNearBottom(scrollBottom < 20); // Considerar "cerca del fondo" si quedan menos de 20px

      // Determinar si estamos cerca del inicio
      setIsNearTop(container.scrollTop < 20); // Considerar "cerca del inicio" si hay menos de 20px scrolleados
    }
  };

  // Gestión de arrastre para el gesto de cierre
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStart(e.touches[0].clientY);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStart(e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStart === null) return;
    const currentPosition = e.touches[0].clientY;
    const difference = currentPosition - dragStart;
    if (difference < 0) return;
    setCurrentTranslate(difference);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
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

  // Manejar cambio en el número total de elementos
  const handleTotalItemsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0 && value <= 100) {
      setTotalItems(value);
      setSelectedItems((prev) => prev.filter((item) => item <= value));
    }
  };

  // Manejar toggle de selección de un elemento
  const handleToggleItem = (item: number) => {
    setSelectedItems((prev) => {
      if (prev.includes(item)) {
        return prev.filter((i) => i !== item);
      } else {
        return [...prev, item];
      }
    });
  };

  // Guardar la configuración
  const handleSaveConfig = () => {
    setLoading(true);
    const configToSave =
      selectedItems.length > 0
        ? selectedItems
        : Array.from({ length: totalItems }, (_, i) => i + 1);

    setTimeout(() => {
      onSaveConfig(configToSave);
      setLoading(false);
      handleClose();
    }, 600);
  };

  // Seleccionar/deseleccionar todos
  const handleSelectAll = () => {
    if (selectedItems.length === totalItems) {
      setSelectedItems([]);
    } else {
      setSelectedItems(Array.from({ length: totalItems }, (_, i) => i + 1));
    }
  };

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
        className={`relative bg-white w-full max-w-4xl rounded-t-lg px-2 pb-4 pt-10 transition-transform duration-300 touch-none ${
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
          {/* Configuración de número total de ítems */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex flex-col   w-full max-w-xs">
              <label className="text-xs text-center">
                Cantidad maxima de participantes
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={totalItems}
                onChange={handleTotalItemsChange}
                className="w-full px-4 h-10 border border-gray-300 text-center rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          {/* Grid de ítems seleccionables con scroll pero sin barra visible */}
          <div className="relative">
            <div
              ref={scrollContainerRef}
              className="max-h-60 overflow-y-auto p-2 scrollbar-hide"
              onScroll={handleScroll}
              style={{
                scrollbarWidth: "none" /* Firefox */,
                msOverflowStyle: "none" /* IE and Edge */,
              }}
            >
              {/* Estilo adicional para ocultar la barra de scroll en WebKit (Chrome, Safari) */}
              <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {Array.from({ length: totalItems }, (_, i) => i + 1).map(
                  (item) => (
                    <div
                      key={item}
                      onClick={() => handleToggleItem(item)}
                      className={`
                      w-full aspect-square rounded-lg flex items-center justify-center cursor-pointer
                      transition-colors duration-200 text-white font-bold
                      ${selectedItems.includes(item) ? "bg-green-500" : "bg-red-500"}
                    `}
                    >
                      {item}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Indicador de scroll inferior con flecha y gradiente */}
            {isScrollNeeded && !isNearBottom && (
              <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-gradient-to-t from-white to-transparent h-20 w-full flex items-end justify-center ">
                  <div className="animate-bounce">
                    <img
                      src={arrowIcon}
                      className="h-2 transform rotate-90"
                      alt="Desplazar para ver más"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Indicador de scroll superior con flecha y gradiente */}
            {isScrollNeeded && !isNearTop && (
              <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-gradient-to-b from-white to-transparent h-20 w-full flex items-start justify-center ">
                  <div className="animate-bounce">
                    <img
                      src={arrowIcon}
                      className="h-2 transform -rotate-90"
                      alt="Desplazar hacia arriba"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom */}
        <div className="flex pt-4 px-8 justify-between">
          <button
            onClick={handleSaveConfig}
            disabled={loading}
            className="text-gray-100 text-4xl h-20 w-80 bg-black font-bold rounded-lg outline-none"
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
          <div className="flex flex-row items-center gap-4 justify-center">
            <div className="text-center text-sm text-gray-500">
              {selectedItems.length} de {totalItems} participantes seleccionados
            </div>
            <div className="flex justify-center mb-2">
              <button
                onClick={handleSelectAll}
                className="bg-gray-300 text-black px-4 h-10 rounded-full text-sm font-medium"
              >
                {selectedItems.length === totalItems
                  ? "Deseleccionar todos"
                  : "Seleccionar todos"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionRuletaModal;
