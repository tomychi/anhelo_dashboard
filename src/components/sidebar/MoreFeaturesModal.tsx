// components/MoreFeaturesModal.tsx
import React, { useState, useRef, useEffect } from "react";
import { SYSTEM_FEATURES } from "../../utils/permissionsUtils";

interface MoreFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFeatures: string[];
  onAddFeatures: (features: string[]) => void;
  loading: boolean;
}

const MoreFeaturesModal: React.FC<MoreFeaturesModalProps> = ({
  isOpen,
  onClose,
  currentFeatures,
  onAddFeatures,
  loading,
}) => {
  // Estado para los toggles de features
  const [featureToggles, setFeatureToggles] = useState<Record<string, boolean>>(
    {}
  );
  const [error, setError] = useState("");
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Inicializar los toggles al abrir el modal
  useEffect(() => {
    if (isOpen) {
      const initialToggles: Record<string, boolean> = {};
      SYSTEM_FEATURES.forEach((feature) => {
        // Poner cada feature como desactivada inicialmente,
        // excepto las que ya tiene el usuario
        initialToggles[feature.id] = currentFeatures.includes(feature.id);
      });
      setFeatureToggles(initialToggles);
      setIsAnimating(true);
      setCurrentTranslate(0);
    }
  }, [isOpen, currentFeatures]);

  // Manejo de eventos para drag
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
      onClose();
    }
    setCurrentTranslate(0);
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

  const handleToggleFeature = (featureId: string) => {
    // No permitir desactivar features que ya están en uso
    if (currentFeatures.includes(featureId) && featureToggles[featureId]) {
      return;
    }

    setFeatureToggles((prev) => ({
      ...prev,
      [featureId]: !prev[featureId],
    }));
  };

  const handleAddFeatures = () => {
    // Obtener los features seleccionados que no están ya activos
    const selectedFeatures = Object.keys(featureToggles).filter(
      (key) => featureToggles[key] && !currentFeatures.includes(key)
    );

    if (selectedFeatures.length === 0) {
      setError("Por favor, selecciona al menos una funcionalidad nueva");
      return;
    }

    // Llamar a la función para actualizar los features
    onAddFeatures(selectedFeatures);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex items-end font-coolvetica justify-center">
      <div
        className={`absolute inset-0 backdrop-blur-sm bg-black transition-opacity duration-300 ${
          isAnimating ? "bg-opacity-50" : "bg-opacity-0"
        }`}
        style={{
          opacity: Math.max(0, 1 - currentTranslate / 400),
        }}
        onClick={onClose}
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
        {/* Barra de drag */}
        <div
          className="absolute top-0 left-0 right-0 h-12 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        >
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
        </div>

        <div className="mt-4 flex-col space-y-2 w-full">
          <h2 className="text-2xl font-bold mb-4">Añadir funcionalidades</h2>

          <p className="text-sm text-gray-500 mb-4">
            Selecciona las funcionalidades adicionales que deseas activar para
            tu empresa.
          </p>

          {/* Sección de funcionalidades */}
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2">
              Funcionalidades disponibles
            </h3>
            <div className="bg-gray-200  rounded-lg max-h-60 overflow-y-auto">
              {SYSTEM_FEATURES.map((feature) => {
                const isActive = currentFeatures.includes(feature.id);
                return (
                  <div
                    key={feature.id}
                    className="flex items-center justify-between w-full py-2 border-b border-gray-200"
                  >
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{feature.title}</p>
                      <p className="text-xs text-gray-500">
                        {feature.description}
                      </p>
                    </div>
                    <div
                      className={`w-14 h-8 ml-12 flex items-center rounded-full p-1 cursor-pointer ${
                        featureToggles[feature.id] ? "bg-black" : "bg-gray-300"
                      } ${isActive ? "opacity-50" : ""}`}
                      onClick={() => handleToggleFeature(feature.id)}
                    >
                      <div
                        className={`bg-gray-100 w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                          featureToggles[feature.id] ? "translate-x-6" : ""
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
              <p className="text-red-500 text-xs">{error}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleAddFeatures}
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
            "Agregar"
          )}
        </button>
      </div>
    </div>
  );
};

export default MoreFeaturesModal;
