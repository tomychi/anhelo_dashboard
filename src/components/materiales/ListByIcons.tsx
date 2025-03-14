import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import {
  MaterialProps,
  readMateriales,
  readProductos,
  ProductoProps,
  updateMaterial,
  deleteMaterial,
  updateProducto,
  deleteProducto,
} from "../../firebase/Materiales";
import EditItemModal from "./EditItemModal";
import currencyFormat from "../../helpers/currencyFormat";

export const ListByIcons: React.FC = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const [materiales, setMateriales] = useState<MaterialProps[]>([]);
  const [productos, setProductos] = useState<ProductoProps[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para el modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<
    MaterialProps | ProductoProps | null
  >(null);
  const [selectedItemType, setSelectedItemType] = useState<
    "material" | "producto"
  >("material");

  // Variables para determinar empresa
  const [isAnhelo, setIsAnhelo] = useState(false);
  const [empresaId, setEmpresaId] = useState<string | undefined>(undefined);

  // Estado para presión larga
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  useEffect(() => {
    const getDatosEmpresa = () => {
      // Determinar si es ANHELO u otra empresa
      const empresaNombre =
        auth?.tipoUsuario === "empresa" && auth.usuario?.datosGenerales
          ? auth.usuario.datosGenerales.nombre || ""
          : "";

      const isAnheloEmpresa = empresaNombre === "ANHELO";
      setIsAnhelo(isAnheloEmpresa);

      // Determinar el ID de la empresa
      const id =
        auth?.tipoUsuario === "empresa"
          ? auth.usuario?.id
          : auth?.tipoUsuario === "empleado"
            ? auth.usuario?.empresaId
            : undefined;

      setEmpresaId(id);
      return { isAnheloEmpresa, id };
    };

    const fetchData = async () => {
      try {
        setLoading(true);
        const { isAnheloEmpresa, id } = getDatosEmpresa();

        if (id) {
          // Obtener materiales y productos
          const materialesData = await readMateriales(isAnheloEmpresa, id);
          const productosData = await readProductos(isAnheloEmpresa, id);

          setMateriales(materialesData);
          setProductos(productosData);
        }
      } catch (error) {
        console.error("Error al obtener datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [auth]);

  // Función para capitalizar primera letra
  const capitalizeFirstLetter = (string: string = "") => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  // Handlers para presión larga
  const handlePressStart = (
    item: MaterialProps | ProductoProps,
    type: "material" | "producto"
  ) => {
    // Prevenir que se active en dispositivos táctiles innecesariamente
    if ("ontouchstart" in window) return;

    setIsPressing(true);
    const timer = setTimeout(() => {
      openEditModal(item, type);
    }, 500); // 500ms para considerar presión larga

    setPressTimer(timer);
  };

  const handlePressEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    setIsPressing(false);
  };

  const handleTouchStart = (
    item: MaterialProps | ProductoProps,
    type: "material" | "producto"
  ) => {
    setIsPressing(true);
    const timer = setTimeout(() => {
      openEditModal(item, type);
    }, 500);

    setPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    setIsPressing(false);
  };

  // Abrir modal de edición
  const openEditModal = (
    item: MaterialProps | ProductoProps,
    type: "material" | "producto"
  ) => {
    setSelectedItem(item);
    setSelectedItemType(type);
    setModalOpen(true);
  };

  // Actualizar material o producto
  const handleUpdateItem = async (
    updatedItem: MaterialProps | ProductoProps
  ) => {
    try {
      if (!empresaId) {
        throw new Error("ID de empresa no disponible");
      }

      if (selectedItemType === "material") {
        // Asegurarse de que el item tenga ID
        if (!(updatedItem as MaterialProps).id) {
          throw new Error("ID de material no disponible");
        }

        await updateMaterial(updatedItem as MaterialProps, isAnhelo, empresaId);

        // Actualizar lista local
        setMateriales((prev) =>
          prev.map((item) =>
            item.id === (updatedItem as MaterialProps).id
              ? (updatedItem as MaterialProps)
              : item
          )
        );

        // Éxito
        alert("Material actualizado correctamente");
      } else {
        // Para productos, asegurarse de que tenga ID
        const productoItem = updatedItem as ProductoProps & { id?: string };
        if (!productoItem.id) {
          throw new Error("ID de producto no disponible");
        }

        await updateProducto(productoItem, isAnhelo, empresaId);

        // Actualizar lista local
        setProductos((prev) =>
          prev.map((item) => {
            const itemWithId = item as ProductoProps & { id?: string };
            return itemWithId.id === productoItem.id
              ? (productoItem as ProductoProps)
              : item;
          })
        );

        // Éxito
        alert("Producto actualizado correctamente");
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert(`Error al actualizar: ${error}`);
      throw error; // Re-lanzar para que lo maneje el modal
    }
  };

  // Eliminar material o producto
  const handleDeleteItem = async (itemId: string) => {
    try {
      if (!empresaId) {
        throw new Error("ID de empresa no disponible");
      }

      // Pedir confirmación
      const confirmar = confirm(
        "¿Estás seguro de que deseas eliminar este elemento?"
      );

      if (!confirmar) {
        throw new Error("Eliminación cancelada");
      }

      if (selectedItemType === "material") {
        await deleteMaterial(itemId, isAnhelo, empresaId);

        // Actualizar lista local
        setMateriales((prev) => prev.filter((item) => item.id !== itemId));

        // Éxito
        alert("Material eliminado correctamente");
      } else {
        await deleteProducto(itemId, isAnhelo, empresaId);

        // Actualizar lista local
        setProductos((prev) =>
          prev.filter((item) => (item as any).id !== itemId)
        );

        // Éxito
        alert("Producto eliminado correctamente");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert(`Error al eliminar: ${error}`);
      throw error; // Re-lanzar para que lo maneje el modal
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="p-4 font-coolvetica">
      {/* Sección de Productos */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-3">Productos</h2>
        <div className="overflow-x-auto">
          <div className="flex space-x-4 pb-2" style={{ overflowX: "auto" }}>
            {productos.length === 0 ? (
              <p className="text-gray-500 italic">
                No hay productos registrados.
              </p>
            ) : (
              productos.map((producto, index) => (
                <div
                  key={index}
                  className={`min-w-[200px] bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 ${isPressing ? "scale-95" : "scale-100"} transition-transform duration-200`}
                  onMouseDown={() => handlePressStart(producto, "producto")}
                  onMouseUp={handlePressEnd}
                  onMouseLeave={handlePressEnd}
                  onTouchStart={() => handleTouchStart(producto, "producto")}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className="h-32 bg-gray-200 flex items-center justify-center">
                    {producto.img ? (
                      <img
                        src={producto.img}
                        alt={producto.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400">{producto.name}</span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-md mb-1">
                      {capitalizeFirstLetter(producto.name)}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2 truncate">
                      {producto.description}
                    </p>
                    <div className="flex justify-between text-xs">
                      <span>Costo: {currencyFormat(producto.costo)}</span>
                      <span>Precio: {currencyFormat(producto.price)}</span>
                    </div>
                    {producto.materiales &&
                      Object.keys(producto.materiales).length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">
                            Compuesto de{" "}
                            {Object.keys(producto.materiales).length} materiales
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sección de Materiales */}
      <div>
        <h2 className="text-2xl font-bold mb-3">Materiales</h2>
        <div className="overflow-x-auto">
          <div className="flex space-x-4 pb-2" style={{ overflowX: "auto" }}>
            {materiales.length === 0 ? (
              <p className="text-gray-500 italic">
                No hay materiales registrados.
              </p>
            ) : (
              materiales.map((material, index) => (
                <div
                  key={index}
                  className={`min-w-[200px] bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 ${isPressing ? "scale-95" : "scale-100"} transition-transform duration-200`}
                  onMouseDown={() => handlePressStart(material, "material")}
                  onMouseUp={handlePressEnd}
                  onMouseLeave={handlePressEnd}
                  onTouchStart={() => handleTouchStart(material, "material")}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className="h-32 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">{material.nombre}</span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-md mb-1">
                      {capitalizeFirstLetter(material.nombre)}
                    </h3>
                    <div className="flex justify-between text-xs">
                      <span>Costo: {currencyFormat(material.costo)}</span>
                      <span>Unidad: {material.unit}</span>
                    </div>
                    {material.stock !== undefined && (
                      <p className="text-xs mt-2 text-gray-500">
                        Stock: {material.stock} {material.unit}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de edición */}
      {selectedItem && (
        <EditItemModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          item={selectedItem}
          itemType={selectedItemType}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
        />
      )}
    </div>
  );
};
