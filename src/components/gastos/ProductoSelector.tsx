import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";

// Componente para mostrar y seleccionar productos
export const ProductoSelector = ({
  selectedProducto,
  onProductoChange,
  formData,
  setFormData,
  onAddProducto,
}) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProductos, setFilteredProductos] = useState([]);
  const [error, setError] = useState(null);

  const auth = useSelector((state: RootState) => state.auth);
  const empresaId =
    auth?.tipoUsuario === "empresa"
      ? auth.usuario?.id
      : auth?.tipoUsuario === "empleado"
        ? auth.usuario?.empresaId
        : undefined;

  // Para depurar: mostrar información sobre la empresa y el usuario
  useEffect(() => {
    console.log("Información de autenticación:", {
      tipoUsuario: auth?.tipoUsuario,
      usuario: auth?.usuario,
      empresaId: empresaId,
    });
  }, [auth, empresaId]);

  // Cargar productos específicos de esta empresa desde Firestore
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!empresaId) {
          console.error("No se pudo determinar el ID de la empresa");
          setError("No se pudo determinar la empresa actual");
          setLoading(false);
          return;
        }

        console.log(`Buscando productos para la empresa con ID: ${empresaId}`);

        const firestore = getFirestore();

        // Verificar primero si el documento de la empresa existe
        const empresaDocRef = doc(firestore, "absoluteClientes", empresaId);
        const empresaDoc = await getDoc(empresaDocRef);

        if (!empresaDoc.exists()) {
          console.error(
            `No se encontró el documento de la empresa con ID: ${empresaId}`
          );
          setError("Empresa no encontrada");
          setLoading(false);
          return;
        }

        console.log("Documento de empresa encontrado:", empresaDoc.id);

        // Acceder a la colección de productos dentro del documento de la empresa
        const productosRef = collection(
          firestore,
          "absoluteClientes",
          empresaId,
          "productos"
        );

        console.log(
          "Intentando acceder a la colección:",
          `absoluteClientes/${empresaId}/productos`
        );

        const productosSnapshot = await getDocs(productosRef);
        console.log("Snapshot de productos:", productosSnapshot);

        if (productosSnapshot.empty) {
          console.log("No se encontraron productos en la colección");
          setProductos([]);
          setLoading(false);
          return;
        }

        const productosData = productosSnapshot.docs.map((doc) => {
          console.log("Datos del producto:", doc.id, doc.data());
          return {
            id: doc.id,
            ...doc.data(),
          };
        });

        console.log(`Encontrados ${productosData.length} productos`);
        setProductos(productosData);
      } catch (error) {
        console.error("Error al cargar productos:", error);
        setError(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (empresaId) {
      fetchProductos();
    }
  }, [empresaId]);

  // Filtrar productos basados en término de búsqueda
  useEffect(() => {
    if (!searchTerm) {
      setFilteredProductos(productos);
    } else {
      const filtered = productos.filter(
        (producto) =>
          producto.name &&
          producto.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProductos(filtered);
    }
  }, [productos, searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="w-6 h-6 border-2 border-black rounded-full animate-spin border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section w-full relative mb-4 z-0">
        <p className="text-xl my-2 px-4">Productos</p>
        <div className="px-4 text-red-500">
          <p>Error al cargar productos: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section w-full relative mb-4 z-0">
      <p className="text-xl my-2 px-4">Productos</p>

      {/* Buscador de productos */}
      <div className="px-4 mb-3">
        <div className="flex items-center w-full h-10 gap-1 rounded-lg border border-gray-300 focus:ring-0 font-coolvetica text-black text-xs font-light">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="h-6 ml-1.5 mb-0.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            placeholder="Buscar producto"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent outline-none"
          />
        </div>
      </div>

      {filteredProductos.length === 0 ? (
        // Mensaje cuando no hay productos
        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-200 rounded-lg mx-4">
          <p className="text-gray-500 mb-4 text-center">
            No hay productos disponibles para esta empresa
          </p>
          {onAddProducto && (
            <button
              onClick={onAddProducto}
              className="bg-black text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 mr-2"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
              Agregar producto
            </button>
          )}
        </div>
      ) : (
        // Lista horizontal de productos
        <div className="flex flex-row px-4 gap-2 overflow-x-auto">
          {/* Botón para agregar nuevo producto */}
          {onAddProducto && (
            <div
              onClick={onAddProducto}
              className="cursor-pointer px-3 py-2 rounded-lg text-xs flex items-center justify-center bg-gray-100 text-black border border-dashed border-gray-400 whitespace-nowrap flex-shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 mr-2"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
              Agregar
            </div>
          )}

          {/* Lista de productos */}
          {filteredProductos.map((producto) => (
            <div
              key={producto.id}
              onClick={() => {
                if (setFormData) {
                  setFormData((prev) => ({
                    ...prev,
                    name: producto.name || producto.nombre,
                    // En tus datos veo que usas "name" en lugar de "nombre"
                    unit: producto.unit || "unidad",
                    precio: producto.price || producto.precio || 0,
                  }));
                }
                if (onProductoChange) {
                  onProductoChange(producto);
                }
              }}
              className={`cursor-pointer px-3 py-2 rounded-lg text-xs flex items-center justify-center whitespace-nowrap flex-shrink-0 ${
                formData?.name === (producto.name || producto.nombre)
                  ? "bg-black text-gray-100"
                  : "bg-gray-200 text-black"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 mr-2"
              >
                <path
                  fillRule="evenodd"
                  d="M10.362 1.093a.75.75 0 00-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925zM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0018 14.25V6.443zm-8.75 12.25v-8.25l-7.25-4v7.807a.75.75 0 00.388.657l6.862 3.786z"
                  clipRule="evenodd"
                />
              </svg>
              {(producto.name || producto.nombre) &&
                (producto.name || producto.nombre).charAt(0).toUpperCase() +
                  (producto.name || producto.nombre).slice(1).toLowerCase()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductoSelector;
