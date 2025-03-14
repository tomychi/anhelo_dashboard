import React, { useState, useRef, useEffect } from "react";
import { MaterialProps, ProductoProps } from "../../firebase/Materiales";
import currencyFormat from "../../helpers/currencyFormat";

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MaterialProps | ProductoProps;
  itemType: "material" | "producto";
  onUpdate: (updatedItem: MaterialProps | ProductoProps) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  item,
  itemType,
  onUpdate,
  onDelete,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Estado para formulario de edición
  const [formData, setFormData] = useState<any>(item);

  // Configurar animación al abrir
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setCurrentTranslate(0);
      setFormData(item); // Inicializar formulario con datos del item
    }
  }, [isOpen, item]);

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

  // Manejar cambios en los inputs
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Convertir a número si es necesario
    if (name === "price" || name === "costo" || name === "stock") {
      const numericValue = parseFloat(value);
      setFormData((prev: any) => ({
        ...prev,
        [name]: isNaN(numericValue) ? 0 : numericValue,
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Guardar cambios
  const handleUpdate = async () => {
    setLoading(true);
    setError("");

    try {
      await onUpdate(formData);
      handleClose();
    } catch (error) {
      console.error("Error al actualizar:", error);
      setError(
        "Ocurrió un error al actualizar. Por favor, inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  // Eliminar item
  const handleDelete = async () => {
    setLoading(true);
    setError("");

    try {
      const itemId =
        itemType === "material" ? (item as MaterialProps).id : (item as any).id;
      if (!itemId) {
        throw new Error("No se pudo identificar el elemento a eliminar");
      }

      await onDelete(itemId);
      handleClose();
    } catch (error) {
      console.error("Error al eliminar:", error);
      setError("Ocurrió un error al eliminar. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Si está cerrado, no renderizar nada
  if (!isOpen) return null;

  // Personalizar modal según tipo de item
  const title =
    itemType === "material"
      ? `Editar Material: ${(item as MaterialProps).nombre}`
      : `Editar Producto: ${(item as ProductoProps).name}`;

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

        <div className="flex-col space-y-2 w-full">
          <h2 className="text-2xl mx-8 text-center font-bold mb-4">{title}</h2>

          {/* Formulario según tipo de item */}
          <div className="space-y-4">
            {itemType === "material" ? (
              // Formulario para material
              <>
                <div className="section relative z-0">
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                    value={formData.nombre || ""}
                    onChange={handleChange}
                    placeholder="Nombre del material"
                    required
                  />
                </div>

                <div className="section relative z-0">
                  <input
                    type="number"
                    id="costo"
                    name="costo"
                    className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                    value={formData.costo || ""}
                    onChange={handleChange}
                    placeholder="Costo unitario"
                    required
                  />
                </div>

                <div className="section relative z-0">
                  <select
                    id="unit"
                    name="unit"
                    className="cursor-pointer custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                    value={formData.unit || "unidad"}
                    onChange={handleChange}
                    required
                  >
                    <option value="unidad">unidad</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">l</option>
                    <option value="ml">ml</option>
                  </select>
                </div>

                <div className="section relative z-0">
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                    value={formData.stock || ""}
                    onChange={handleChange}
                    placeholder="Stock actual"
                  />
                </div>
              </>
            ) : (
              // Formulario para producto
              <>
                <div className="section relative z-0">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                    value={formData.name || ""}
                    onChange={handleChange}
                    placeholder="Nombre del producto"
                    required
                  />
                </div>

                <div className="section relative z-0">
                  <textarea
                    id="description"
                    name="description"
                    className="custom-bg block w-full h-20 px-4 py-2 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                    value={formData.description || ""}
                    onChange={handleChange}
                    placeholder="Descripción"
                    required
                  />
                </div>

                <div className="section relative z-0">
                  <input
                    type="number"
                    id="price"
                    name="price"
                    className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                    value={formData.price || ""}
                    onChange={handleChange}
                    placeholder="Precio de venta"
                    required
                  />
                </div>

                <div className="section relative z-0">
                  <input
                    type="number"
                    id="costo"
                    name="costo"
                    className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                    value={formData.costo || ""}
                    onChange={handleChange}
                    placeholder="Costo"
                    required
                  />
                </div>

                {/* Información de materiales (no editable aquí) */}
                {formData.materiales &&
                  Object.keys(formData.materiales).length > 0 && (
                    <div className="mt-4 p-2 bg-gray-100 rounded-md">
                      <p className="text-xs font-medium mb-1">Materiales:</p>
                      <ul className="text-xs text-gray-600">
                        {Object.entries(formData.materiales).map(
                          ([nombre, cantidad]) => (
                            <li key={nombre} className="flex justify-between">
                              <span>{nombre}</span>
                              <span>Cant: {cantidad}</span>
                            </li>
                          )
                        )}
                      </ul>
                      <p className="text-xs text-gray-500 mt-2">
                        Para modificar los materiales, usa la pantalla de
                        creación de productos.
                      </p>
                    </div>
                  )}
              </>
            )}

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
                <p className="text-red-500 text-xs">{error}</p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleUpdate}
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
            "Actualizar"
          )}
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-red-500 w-full mt-2 text-4xl h-20 px-4 bg-gray-200 font-bold rounded-lg outline-none"
        >
          {loading ? (
            <div className="flex justify-center w-full items-center">
              <div className="flex flex-row gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          ) : (
            "Eliminar"
          )}
        </button>
      </div>
    </div>
  );
};

export default EditItemModal;
