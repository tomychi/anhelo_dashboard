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
      setCurrentTranslate(0);
    }
  }, [isOpen, currentFeatures]);

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
    <>
      <div className="mt-4 flex-col space-y-2 w-full font-coolvetica flex flex-col ">
        {/* Sección de funcionalidades */}
        <div className="">
          <h3 className="text-2xl font-bold my-6 text-center">
            Features disponibles
          </h3>
          <div className=" px-4  rounded-lg max-h-60 overflow-y-auto">
            {SYSTEM_FEATURES.map((feature) => {
              const isActive = currentFeatures.includes(feature.id);
              return (
                <div
                  key={feature.id}
                  className="flex items-center justify-between w-full py-2 border-b border-gray-200"
                >
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{feature.title}</p>
                    <p className="text-xs text-gray-400 ">
                      {feature.description}
                    </p>
                  </div>
                  <div
                    className={`w-14 h-8 ml-12 flex items-center rounded-full p-1 cursor-pointer ${
                      featureToggles[feature.id] ? "bg-black" : "bg-gray-200"
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

      <div className="mx-4 mb-12">
        <button
          onClick={handleAddFeatures}
          disabled={loading}
          className="text-gray-100 w-full mt-6 text-4xl h-20 px-4 bg-black font-bold rounded-3xl font-coolvetica outline-none"
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
        <p className="font-medium text-xs opacity-30 font-coolvetica text-center mt-4 mb-8">
          Ⓡ 2023. Absolute, Soluciones Empresariales.
        </p>
      </div>
    </>
  );
};

export default MoreFeaturesModal;
