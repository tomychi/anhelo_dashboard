import React, { useState } from "react";
import arrow from "../../assets/arrowIcon.png"; // Asegúrate de importar el mismo icono

const CategoriasModal = ({
  isOpen,
  onClose,
  title = "Nueva categoría",
  onSave,
  empresaId,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const [categoryName, setCategoryName] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringItems, setRecurringItems] = useState([""]);
  const modalRef = React.useRef(null);

  // Configurar animación al abrir
  React.useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setCurrentTranslate(0);
      // Reset form fields when opening
      setCategoryName("");
      setIsRecurring(false);
      setRecurringItems([""]);
    }
  }, [isOpen]);

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

  React.useEffect(() => {
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
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Añadir un nuevo campo para ítem recurrente
  const addRecurringItem = () => {
    setRecurringItems([...recurringItems, ""]);
  };

  // Actualizar un ítem recurrente específico
  const updateRecurringItem = (index, value) => {
    const newItems = [...recurringItems];
    newItems[index] = value;
    setRecurringItems(newItems);
  };

  // Eliminar un ítem recurrente
  const removeRecurringItem = (index) => {
    if (recurringItems.length > 1) {
      const newItems = [...recurringItems];
      newItems.splice(index, 1);
      setRecurringItems(newItems);
    }
  };

  // Guardar categoría con la nueva estructura
  const handleSaveCategory = () => {
    if (!categoryName.trim()) return;

    // Filtrar ítems vacíos si es recurrente
    const validItems = isRecurring
      ? recurringItems.filter((item) => item.trim() !== "")
      : [];

    // Crear objeto de categoría con la estructura correcta
    const newCategory = {
      nombre: categoryName.toLowerCase(),
      periodicidad: 1,
      items: validItems,
    };

    // Llamar al callback de guardado pasando la nueva categoría
    onSave(newCategory);
    handleClose();
  };

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

        <div className="font-coolvetica text-black">
          {/* Título centrado */}
          <p className="text-2xl mx-4 my-4 text-center">{title}</p>

          {/* Contenido del modal */}
          <div className="p-4">
            {/* Nombre de la categoría */}
            <div className="section w-full relative z-0 mb-4">
              <input
                type="text"
                placeholder="Nombre de la categoría"
                className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Opción para categoría recurrente */}
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="isRecurring"
                name="isRecurring"
                className="mr-2 h-4 w-4"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              <label htmlFor="isRecurring" className="text-xs">
                Crear categoria con items. Ej: Para Infraestructura siempre
                pagas luz, alquiler, agua y gas; Armarlo asi te facilitara la
                experiencia para registrarlos.
              </label>
            </div>

            {/* Mostrar campos para ítems recurrentes si se selecciona la opción */}
            {isRecurring && (
              <div className="mb-4">
                <p className="text-xs mb-2">Ítems recurrentes:</p>

                {recurringItems.map((item, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) =>
                        updateRecurringItem(index, e.target.value)
                      }
                      placeholder={`Ítem ${index + 1}`}
                      className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                    />

                    {/* Botón para eliminar ítem */}
                    {recurringItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRecurringItem(index)}
                        className="ml-2 text-red-500 h-10 w-10 flex items-center justify-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-5 w-5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}

                {/* Botón para agregar más ítems */}
                <button
                  type="button"
                  onClick={addRecurringItem}
                  className="mt-2 text-xs flex items-center text-black bg-gray-200 px-3 py-2 rounded"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 mr-1"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Agregar ítem
                </button>
              </div>
            )}

            {/* Botón para guardar */}
            <button
              onClick={handleSaveCategory}
              disabled={!categoryName.trim()}
              className={`text-gray-100 w-full h-16 mt-2 rounded-lg ${
                !categoryName.trim() ? "bg-gray-400" : "bg-black"
              } text-xl font-bold`}
            >
              Guardar
            </button>

            {/* Botón para volver */}
            <div
              className="text-gray-400 mt-4 flex-row gap-1 text-xs justify-center flex items-center font-light cursor-pointer"
              onClick={handleClose}
            >
              <img
                src={arrow}
                className="transform rotate-180 h-2 opacity-30"
                alt="Volver"
              />
              Cancelar
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriasModal;
