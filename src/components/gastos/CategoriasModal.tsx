import React from "react";
import arrow from "../../assets/arrowIcon.png"; // Asegúrate de importar el mismo icono

const CategoriasModal = ({
  isOpen,
  onClose,
  title = "Nueva categoría",
  newCategory,
  setNewCategory,
  onSave,
}) => {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [dragStart, setDragStart] = React.useState(null);
  const [currentTranslate, setCurrentTranslate] = React.useState(0);
  const modalRef = React.useRef(null);

  // Configurar animación al abrir
  React.useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setCurrentTranslate(0);
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
            <div className="section w-full relative z-0 mb-6">
              <input
                type="text"
                placeholder="Nombre de la categoría"
                className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                autoFocus
              />
            </div>

            {/* Botón grande al estilo del formulario */}
            <button
              onClick={onSave}
              disabled={!newCategory.trim()}
              className={`text-gray-100 w-full h-16 mt-2 rounded-lg ${
                !newCategory.trim() ? "bg-gray-400" : "bg-black"
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
