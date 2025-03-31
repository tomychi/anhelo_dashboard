// components/MoreFeaturesModal.tsx
import React, { useState, useEffect } from "react";
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
  // Estado para los features seleccionados
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);

  // Inicializar los features seleccionados al abrir el modal
  useEffect(() => {
    if (isOpen) {
      // Iniciar con los features que ya tiene el usuario
      setSelectedFeatures([...currentFeatures]);
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

  const toggleFeature = (featureId: string) => {
    // Si el feature ya está en uso por el usuario, no permitir desactivarlo
    if (
      currentFeatures.includes(featureId) &&
      selectedFeatures.includes(featureId)
    ) {
      // Crear notificación temporal
      const notification = document.createElement("div");
      notification.style.position = "fixed";
      notification.style.bottom = "20px";
      notification.style.padding = "0 20px";
      notification.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
      notification.style.color = "white";
      notification.style.borderRadius = "9999px";
      notification.style.marginRight = "1rem";
      notification.style.paddingLeft = "1rem";
      notification.style.paddingRight = "1rem";
      notification.style.height = "40px";
      notification.style.zIndex = "1000";
      notification.style.transform = "translateX(-50%)";
      notification.style.left = "50%";
      notification.style.textAlign = "center";
      notification.style.fontFamily = "Coolvetica, sans-serif";
      notification.style.fontWeight = "300";
      notification.style.backdropFilter = "blur(8px)";
      notification.style.WebkitBackdropFilter = "blur(8px)";
      notification.style.whiteSpace = "nowrap";
      notification.style.display = "flex";
      notification.style.fontSize = "13px";
      notification.style.alignItems = "center";
      notification.style.justifyContent = "center";
      notification.style.gap = "8px";

      // Crear el SVG (usando un ícono de información)
      const svgIcon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      svgIcon.setAttribute("viewBox", "0 0 24 24");
      svgIcon.setAttribute("fill", "currentColor");
      svgIcon.style.width = "24px";
      svgIcon.style.height = "24px";
      svgIcon.style.flexShrink = "0";

      // Crear el path dentro del SVG (un ícono de información)
      const svgPath = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      svgPath.setAttribute("fill-rule", "evenodd");
      svgPath.setAttribute("clip-rule", "evenodd");
      svgPath.setAttribute(
        "d",
        "M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
      );

      // Añadir el path al SVG
      svgIcon.appendChild(svgPath);

      // Crear un span para el texto
      const textSpan = document.createElement("span");
      textSpan.textContent = "Esta opción no se puede deseleccionar";
      textSpan.style.fontWeight = "light";

      // Añadir el SVG y el texto a la notificación
      notification.appendChild(svgIcon);
      notification.appendChild(textSpan);

      document.body.appendChild(notification);

      // Desaparecer la notificación después de 2 segundos
      setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transition = "opacity 0.5s ease";
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 500);
      }, 2000);

      return; // Salir de la función sin modificar selectedFeatures
    }

    // Comportamiento normal para otros features
    if (selectedFeatures.includes(featureId)) {
      setSelectedFeatures(selectedFeatures.filter((id) => id !== featureId));
    } else {
      setSelectedFeatures([...selectedFeatures, featureId]);
    }
  };

  const handleAddFeatures = () => {
    // Obtener los features seleccionados que no están ya activos
    const newFeatures = selectedFeatures.filter(
      (featureId) => !currentFeatures.includes(featureId)
    );

    if (newFeatures.length === 0) {
      setError("Por favor, selecciona al menos una funcionalidad nueva");
      return;
    }

    // Llamar a la función para actualizar los features
    onAddFeatures(newFeatures);
  };

  // Función para obtener el icono SVG según el tipo de feature
  const getFeatureIcon = (featureId: string) => {
    // Mapeo de iconos según el tipo de feature
    const icons: Record<string, JSX.Element> = {
      dashboard: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-6 px-2"
        >
          <path
            fillRule="evenodd"
            d="M2.25 2.25a.75.75 0 0 0 0 1.5H3v10.5a3 3 0 0 0 3 3h1.21l-1.172 3.513a.75.75 0 0 0 1.424.474l.329-.987h8.418l.33.987a.75.75 0 0 0 1.422-.474l-1.17-3.513H18a3 3 0 0 0 3-3V3.75h.75a.75.75 0 0 0 0-1.5H2.25Zm6.54 15h6.42l.5 1.5H8.29l.5-1.5Zm8.085-8.995a.75.75 0 1 0-.75-1.299 12.81 12.81 0 0 0-3.558 3.05L11.03 8.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l2.47-2.47 1.617 1.618a.75.75 0 0 0 1.146-.102 11.312 11.312 0 0 1 3.612-3.321Z"
            clipRule="evenodd"
          />
        </svg>
      ),
      employees: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-6 px-2"
        >
          <path
            fillRule="evenodd"
            d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
            clipRule="evenodd"
          />
        </svg>
      ),
      inventory: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-6 px-2"
        >
          <path
            fillRule="evenodd"
            d="M7.502 6h7.128A3.375 3.375 0 0 1 18 9.375v9.375a3 3 0 0 0 3-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 0 0-.673-.05A3 3 0 0 0 15 1.5h-1.5a3 3 0 0 0-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6ZM13.5 3A1.5 1.5 0 0 0 12 4.5h4.5A1.5 1.5 0 0 0 15 3h-1.5Z"
            clipRule="evenodd"
          />
          <path
            fillRule="evenodd"
            d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V9.375Z"
            clipRule="evenodd"
          />
        </svg>
      ),
      sales: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-6 px-2"
        >
          <path d="M10.5 18.75a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" />
          <path
            fillRule="evenodd"
            d="M8.625.75A3.375 3.375 0 0 0 5.25 4.125v15.75a3.375 3.375 0 0 0 3.375 3.375h6.75a3.375 3.375 0 0 0 3.375-3.375V4.125A3.375 3.375 0 0 0 15.375.75h-6.75ZM7.5 4.125C7.5 3.504 8.004 3 8.625 3H9.75v.375c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V3h1.125c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-6.75A1.125 1.125 0 0 1 7.5 19.875V4.125Z"
            clipRule="evenodd"
          />
        </svg>
      ),
      finances: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-6 px-2"
        >
          <path d="M21 6.375c0 2.692-4.03 4.875-9 4.875S3 9.067 3 6.375 7.03 1.5 12 1.5s9 2.183 9 4.875Z" />
          <path d="M12 12.75c2.685 0 5.19-.586 7.078-1.609a8.283 8.283 0 0 0 1.897-1.384c.016.121.025.244.025.368C21 12.817 16.97 15 12 15s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.285 8.285 0 0 0 1.897 1.384C6.809 12.164 9.315 12.75 12 12.75Z" />
          <path d="M12 16.5c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 0 0 1.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 0 0 1.897 1.384C6.809 15.914 9.315 16.5 12 16.5Z" />
          <path d="M12 20.25c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 0 0 1.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 0 0 1.897 1.384C6.809 19.664 9.315 20.25 12 20.25Z" />
        </svg>
      ),
      reports: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-6 px-2"
        >
          <path
            fillRule="evenodd"
            d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z"
            clipRule="evenodd"
          />
        </svg>
      ),
      marketing: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 px-2"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M20.5129 3.4866C18.2882 1.24722 15.2597 -0.00837473 12.1032 4.20445e-05C5.54964 4.20445e-05 0.216056 5.33306 0.213776 11.8883C0.210977 13.9746 0.75841 16.0247 1.80085 17.8319L0.114014 23.9932L6.41672 22.34C8.15975 23.2898 10.1131 23.7874 12.0981 23.7874H12.1032C18.6556 23.7874 23.9897 18.4538 23.992 11.8986C24.0022 8.74248 22.7494 5.71347 20.5129 3.4866ZM17.5234 14.3755C17.2264 14.2267 15.7659 13.5085 15.4934 13.4064C15.2209 13.3044 15.0231 13.2576 14.8253 13.5552C14.6275 13.8528 14.058 14.5215 13.8847 14.7199C13.7114 14.9182 13.5381 14.9427 13.241 14.794C12.944 14.6452 11.9869 14.3316 10.8519 13.3198C9.96884 12.5319 9.36969 11.5594 9.19867 11.2618C9.02765 10.9642 9.18043 10.8057 9.32922 10.6552C9.46261 10.5224 9.62622 10.3086 9.77444 10.1348C9.92266 9.9609 9.97283 9.83776 10.0714 9.63938C10.1701 9.44099 10.121 9.26769 10.0469 9.1189C9.97283 8.97011 9.37824 7.50788 9.13083 6.9133C8.88969 6.3341 8.64513 6.4122 8.46271 6.40023C8.29169 6.39168 8.09102 6.38997 7.89264 6.38997C7.58822 6.39793 7.30097 6.53267 7.10024 6.76166C6.82831 7.05923 6.061 7.77752 6.061 9.23976C6.061 10.702 7.12532 12.1146 7.27354 12.313C7.42176 12.5114 9.36855 15.5117 12.3472 16.7989C12.9004 17.0375 13.4657 17.2468 14.0409 17.426C14.7523 17.654 15.3999 17.6204 15.9118 17.544C16.4819 17.4585 17.6694 16.8251 17.9173 16.1313C18.1653 15.4376 18.1648 14.8424 18.0884 14.7187C18.012 14.595 17.8204 14.5266 17.5234 14.3778V14.3755Z"
          />
        </svg>
      ),
      // Añade más iconos según sea necesario
    };

    // Devuelve el icono correspondiente o un icono genérico si no existe
    return (
      icons[featureId] || (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-6 px-2"
        >
          <path
            fillRule="evenodd"
            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z"
            clipRule="evenodd"
          />
        </svg>
      )
    );
  };

  return (
    <>
      <div className="mt-4 flex-col w-full font-coolvetica flex flex-col ">
        {/* Sección de funcionalidades */}
        <div className="">
          <h2 className="text-xl mx-4 my-8 text-center font-bold">
            Features disponibles
          </h2>

          <div className="mx-4  flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
            {SYSTEM_FEATURES.map((feature) => {
              const isAlreadyActive = currentFeatures.includes(feature.id);
              return (
                <div
                  key={feature.id}
                  onClick={() => toggleFeature(feature.id)}
                  className={`w-full p-4 h-30 rounded-3xl border border-gray-200 items-center flex flex-row gap-4 cursor-pointer transition-colors ${
                    selectedFeatures.includes(feature.id)
                      ? "bg-black text-gray-100"
                      : "bg-gray-100"
                  } ${isAlreadyActive ? "relative" : ""}`}
                >
                  {/* Icono izquierdo */}
                  <div
                    className={`${
                      selectedFeatures.includes(feature.id)
                        ? "text-gray-100"
                        : "text-black"
                    }`}
                  >
                    {getFeatureIcon(feature.id)}
                  </div>

                  {/* Información del feature */}
                  <div className="flex flex-col">
                    <h3 className="font-medium text-lg">{feature.title}</h3>
                    <p
                      className={`text-xs font-light ${
                        selectedFeatures.includes(feature.id)
                          ? "text-gray-200"
                          : "text-gray-400"
                      }`}
                    >
                      {feature.description}
                    </p>
                  </div>

                  {/* Indicador para features ya activos */}
                  {isAlreadyActive && (
                    <div className="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 rounded-full">
                      Activo
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mt-4 h-10 px-4 items-center text-xs text-red-500 border-l-4 flex border-red-500 mx-4">
            {error}
          </div>
        )}
      </div>

      {/* boton */}
      <div className="mx-4">
        <button
          onClick={handleAddFeatures}
          disabled={loading}
          className={`text-gray-100 w-full mt-4 h-20 rounded-3xl text-3xl justify-center flex items-center bg-black font-bold font-coolvetica ${
            loading ? "opacity-70" : "cursor-pointer"
          }`}
        >
          {loading ? (
            <div className="flex flex-row gap-1">
              <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse delay-150"></div>
            </div>
          ) : (
            "Agregar"
          )}
        </button>
        <p className="font-medium text-xs opacity-30 font-coolvetica text-center mt-4 mb-8 ">
          Ⓡ 2023. Absolute, Soluciones Empresariales.
        </p>
      </div>
    </>
  );
};

export default MoreFeaturesModal;
