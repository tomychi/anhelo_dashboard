import React, { useState, useRef, useEffect } from "react";
import {
  MaterialProps,
  ProductoProps,
  readMateriales,
} from "../../firebase/Materiales";
import currencyFormat from "../../helpers/currencyFormat";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import ImageUpload from "./ImageUpload";
import { uploadImage } from "../../firebase/storageService";

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
  const auth = useSelector((state: RootState) => state.auth);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Estado para formulario de edición
  const [formData, setFormData] = useState<any>(item);

  // Estado para distinguir productos compuestos
  const [isProductoCompuesto, setIsProductoCompuesto] = useState(false);

  // Estados para edición de materiales
  const [materialesDisponibles, setMaterialesDisponibles] = useState<
    MaterialProps[]
  >([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [selectedCantidad, setSelectedCantidad] = useState<number>(1);
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState<
    { nombre: string; cantidad: number; costo: number }[]
  >([]);
  const [loadingMateriales, setLoadingMateriales] = useState(false);
  const [totalCosto, setTotalCosto] = useState(0);

  // Estados para imágenes
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Configurar animación al abrir y cargar datos
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setCurrentTranslate(0);
      setFormData(item);
      setSelectedImage(null);
      setUploadProgress(0);

      // Determinar si es un producto compuesto (tiene materiales)
      if (
        itemType === "producto" &&
        (item as ProductoProps).materiales &&
        Object.keys((item as ProductoProps).materiales).length > 0
      ) {
        setIsProductoCompuesto(true);
        loadMaterials();
      } else {
        setIsProductoCompuesto(false);
      }
    }
  }, [isOpen, item, itemType]);

  // Cargar lista de materiales disponibles
  const loadMaterials = async () => {
    try {
      setLoadingMateriales(true);

      // Determinar si es ANHELO u otra empresa
      const empresaNombre =
        auth?.tipoUsuario === "empresa" && auth.usuario?.datosGenerales
          ? auth.usuario.datosGenerales.nombre || ""
          : "";

      const isAnhelo = empresaNombre === "ANHELO";

      // Determinar el ID de la empresa
      const empresaId =
        auth?.tipoUsuario === "empresa"
          ? auth.usuario?.id
          : auth?.tipoUsuario === "empleado"
            ? auth.usuario?.empresaId
            : undefined;

      const materiales = await readMateriales(isAnhelo, empresaId);
      setMaterialesDisponibles(materiales);

      // Convertir los materiales del producto a nuestro formato interno
      if (itemType === "producto" && (item as ProductoProps).materiales) {
        const materialesActuales = Object.entries(
          (item as ProductoProps).materiales
        ).map(([nombre, cantidad]) => {
          const materialInfo = materiales.find((m) => m.nombre === nombre);
          return {
            nombre,
            cantidad: cantidad as number,
            costo: materialInfo?.costo || 0,
          };
        });

        setMaterialesSeleccionados(materialesActuales);
      }
    } catch (error) {
      console.error("Error al cargar materiales:", error);
    } finally {
      setLoadingMateriales(false);
    }
  };

  // Calcular costo total cuando cambian los materiales
  useEffect(() => {
    if (isProductoCompuesto) {
      const costoTotal = materialesSeleccionados.reduce((total, material) => {
        return total + material.costo * material.cantidad;
      }, 0);

      setTotalCosto(costoTotal);

      // Actualizar SOLO el costo en formData, sin tocar el precio
      setFormData((prev) => ({
        ...prev,
        costo: costoTotal,
      }));
    }
  }, [materialesSeleccionados, isProductoCompuesto]);

  // Funciones para manejo de imágenes
  const handleImageSelected = (file: File) => {
    setSelectedImage(file);
  };

  const handleCancelImage = () => {
    setSelectedImage(null);
    // Si queremos eliminar la imagen actual del formData
    if (itemType === "producto") {
      setFormData((prev) => ({
        ...prev,
        img: "",
      }));
    }
  };

  // Subir imagen a Firebase Storage
  const uploadSelectedImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;

    setUploadingImage(true);
    setUploadProgress(0);

    try {
      // Definir la ruta según el tipo de item
      const path = itemType === "producto" ? "productos" : "materiales";
      console.log(`Intentando subir imagen a: ${path}`);

      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Subir imagen
      const imageUrl = await uploadImage(selectedImage, path);
      console.log("URL recibida de uploadImage:", imageUrl);

      // Finalizar progreso
      clearInterval(progressInterval);
      setUploadProgress(100);

      return imageUrl;
    } catch (error) {
      console.error("Error al subir imagen:", error);
      setError("Error al subir imagen. Por favor, inténtalo de nuevo.");
      return null;
    } finally {
      setUploadingImage(false);
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

  // Manejar cambios en los inputs
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Convertir a número si es necesario
    if (name === "price" || name === "costo" || name === "medida") {
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

  // Manejar cambios en el selector de material
  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMaterial(e.target.value);
  };

  // Manejar cambios en la cantidad de material
  const handleCantidadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cantidad = parseInt(e.target.value);
    setSelectedCantidad(isNaN(cantidad) ? 1 : Math.max(1, cantidad));
  };

  // Añadir material a la lista
  const handleAddMaterial = () => {
    if (!selectedMaterial) return;

    // Encontrar información del material seleccionado
    const materialInfo = materialesDisponibles.find(
      (m) => m.nombre === selectedMaterial
    );
    if (!materialInfo) return;

    // Verificar si el material ya existe
    const existingIndex = materialesSeleccionados.findIndex(
      (item) => item.nombre === selectedMaterial
    );

    if (existingIndex >= 0) {
      // Actualizar cantidad si ya existe
      const updatedMateriales = [...materialesSeleccionados];
      updatedMateriales[existingIndex].cantidad += selectedCantidad;
      setMaterialesSeleccionados(updatedMateriales);
    } else {
      // Añadir nuevo material
      setMaterialesSeleccionados([
        ...materialesSeleccionados,
        {
          nombre: selectedMaterial,
          cantidad: selectedCantidad,
          costo: materialInfo.costo || 0,
        },
      ]);
    }

    // Resetear selección
    setSelectedMaterial("");
    setSelectedCantidad(1);
  };

  // Eliminar material de la lista
  const handleRemoveMaterial = (index: number) => {
    const updatedMateriales = [...materialesSeleccionados];
    updatedMateriales.splice(index, 1);
    setMaterialesSeleccionados(updatedMateriales);
  };

  const removeUndefinedFields = (obj: any): any => {
    const cleanObj = { ...obj };
    Object.keys(cleanObj).forEach((key) => {
      if (cleanObj[key] === undefined) {
        delete cleanObj[key];
      } else if (typeof cleanObj[key] === "object" && cleanObj[key] !== null) {
        cleanObj[key] = removeUndefinedFields(cleanObj[key]); // Recursivo para objetos anidados
      }
    });
    return cleanObj;
  };

  // Guardar cambios
  const handleUpdate = async () => {
    setLoading(true);
    setError("");

    try {
      // Crear una copia del formData que podamos modificar
      let updatedFormData = { ...formData };

      // Subir imagen si se ha seleccionado una
      if (selectedImage) {
        const imageUrl = await uploadSelectedImage();

        if (imageUrl) {
          // Actualizar la URL de la imagen en nuestra copia local
          updatedFormData = {
            ...updatedFormData,
            img: imageUrl,
          };

          console.log("URL de imagen obtenida:", imageUrl);
          console.log("FormData actualizado con imagen:", updatedFormData);
        }
      }

      // Lógica específica para productos compuestos
      if (itemType === "producto" && isProductoCompuesto) {
        // Verificar que tenga al menos un material
        if (materialesSeleccionados.length === 0) {
          setError("Un producto compuesto debe tener al menos un material.");
          setLoading(false);
          return;
        }

        // Convertir lista de materiales al formato requerido
        const materialesObj: { [key: string]: number } = {};
        materialesSeleccionados.forEach((item) => {
          materialesObj[item.nombre] = item.cantidad;
        });

        // Actualizar con los materiales y el costo calculado
        updatedFormData = {
          ...updatedFormData,
          materiales: materialesObj,
          costo: totalCosto,
        };
      }

      // Asegurarse de que el campo img exista si no se ha establecido
      if (!updatedFormData.img) {
        updatedFormData.img = "";
      }

      // Si es un material, asegurarse de que todos los campos requeridos existan
      if (itemType === "material") {
        // Asegurar campos para la nueva estructura
        if (updatedFormData.unidadMedida === undefined) {
          updatedFormData.unidadMedida = "g";
        }

        if (updatedFormData.medida === undefined) {
          updatedFormData.medida = 0;
        }
      }

      // Limpiar campos undefined
      const cleanedData = removeUndefinedFields(updatedFormData);

      // Log para depuración
      console.log("Datos finales a guardar (después de limpiar):", cleanedData);

      // Guardar los datos actualizados
      await onUpdate(cleanedData);

      // Cerrar el modal después de guardar
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

                {/* Imagen del material */}
                <div className="section relative z-0">
                  <p className="text-xs font-medium mb-1">
                    Imagen del material:
                  </p>
                  <ImageUpload
                    currentImageUrl={formData.img}
                    onImageSelected={handleImageSelected}
                    onCancel={handleCancelImage}
                    isLoading={uploadingImage}
                    uploadProgress={uploadProgress}
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
                  <input
                    type="number"
                    id="medida"
                    name="medida"
                    className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                    value={formData.medida || ""}
                    onChange={handleChange}
                    placeholder="Cantidad (medida)"
                    required
                  />
                </div>

                <div className="section relative z-0">
                  <select
                    id="unidadMedida"
                    name="unidadMedida"
                    className="cursor-pointer custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                    value={formData.unidadMedida || "g"}
                    onChange={handleChange}
                    required
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="l">l</option>
                    <option value="ml">ml</option>
                    <option value="unidad">unidad</option>
                  </select>
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

                {/* Imagen del producto */}
                <div className="section relative z-0">
                  <p className="text-xs font-medium mb-1">
                    Imagen del producto:
                  </p>
                  <ImageUpload
                    currentImageUrl={formData.img}
                    onImageSelected={handleImageSelected}
                    onCancel={handleCancelImage}
                    isLoading={uploadingImage}
                    uploadProgress={uploadProgress}
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

                {!isProductoCompuesto ? (
                  // Para productos simples, mostrar campo de costo
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
                ) : (
                  // Para productos compuestos, mostrar editor de materiales
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-semibold">Materiales:</p>
                      <p className="text-xs font-medium">
                        Costo total: {currencyFormat(totalCosto)}
                      </p>
                    </div>

                    {loadingMateriales ? (
                      <div className="text-sm text-center py-2">
                        Cargando materiales...
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col gap-2 mb-3">
                          <div className="flex flex-row gap-2">
                            <div className="w-2/3">
                              <select
                                id="material"
                                className="cursor-pointer custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                                value={selectedMaterial}
                                onChange={handleMaterialChange}
                              >
                                <option value="">Seleccionar material</option>
                                {materialesDisponibles.map((material) => (
                                  <option
                                    key={material.id}
                                    value={material.nombre}
                                  >
                                    {material.nombre} (
                                    {currencyFormat(material.costo)})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="w-1/3">
                              <input
                                type="number"
                                id="cantidad"
                                className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
                                value={selectedCantidad}
                                onChange={handleCantidadChange}
                                placeholder="Cantidad"
                                min="1"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddMaterial}
                            className="text-gray-100 w-full h-10 rounded-lg bg-gray-700 text-sm font-bold"
                            disabled={!selectedMaterial}
                          >
                            Añadir Material
                          </button>
                        </div>

                        {materialesSeleccionados.length > 0 ? (
                          <div className="bg-gray-100 p-2 rounded-md max-h-40 overflow-y-auto">
                            {materialesSeleccionados.map((material, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center mb-1 p-1 border-b"
                              >
                                <div>
                                  <span className="font-medium text-xs">
                                    {material.nombre}
                                  </span>
                                  <span className="ml-2 text-xs">
                                    ({material.cantidad})
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <span className="text-xs mr-2">
                                    {currencyFormat(
                                      material.costo * material.cantidad
                                    )}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMaterial(index)}
                                    className="text-red-500 text-xs"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-2 text-xs text-gray-500">
                            Añade materiales para calcular el costo
                          </div>
                        )}
                      </>
                    )}
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
