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

  const empresaNombre =
    auth?.tipoUsuario === "empresa" && auth.usuario?.datosGenerales
      ? auth.usuario.datosGenerales.nombre || ""
      : "";

  const isAnhelo = empresaNombre === "ANHELO";

  // console.log(
  //   `Estado de empresa para productos: ID=${empresaId}, Nombre=${empresaNombre}, isAnhelo=${isAnhelo}`
  // );

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

        // console.log(`Buscando productos para la empresa: ${empresaId}`);

        const firestore = getFirestore();
        let productosData = [];

        if (isAnhelo) {
          // Para Anhelo, cargar de la colección raíz "productos"
          // console.log("Cargando productos para Anhelo desde colección raíz");

          // Verificamos si existe la colección "productos" en la raíz
          try {
            const productosRef = collection(firestore, "productos");
            const productosSnapshot = await getDocs(productosRef);

            productosData = productosSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
          } catch (error) {
            console.error("Error al cargar productos desde raíz:", error);

            // Intentar con ubicación alternativa (burgers, drinks, etc.)
            // console.log(
            //   "Intentando cargar desde colecciones específicas (burgers, drinks, etc.)"
            // );

            // Lista de posibles colecciones de productos para Anhelo
            const colecciones = [
              "burgers",
              "drinks",
              "desserts",
              "fries",
              "toppings",
            ];

            for (const col of colecciones) {
              try {
                const colRef = collection(firestore, col);
                const colSnapshot = await getDocs(colRef);

                const colData = colSnapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                  tipo: col, // Añadimos el tipo para identificarlo
                }));

                productosData = [...productosData, ...colData];
                // console.log(
                //   `Cargados ${colData.length} productos de la colección ${col}`
                // );
              } catch (e) {
                // console.log(`No se pudieron cargar productos de ${col}:`, e);
              }
            }
          }
        } else {
          // Para otras empresas, cargar de la subcolección dentro de absoluteClientes
          const productosRef = collection(
            firestore,
            "absoluteClientes",
            empresaId,
            "productos"
          );

          const productosSnapshot = await getDocs(productosRef);
          productosData = productosSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        }

        // Filtrar productos que no tienen la propiedad materiales o está vacía
        const productosFiltrados = productosData.filter((producto) => {
          // Caso 1: No tiene la propiedad materiales
          if (!producto.materiales) {
            return true;
          }

          // Caso 2: materiales es un objeto vacío (no tiene propiedades)
          if (
            typeof producto.materiales === "object" &&
            Object.keys(producto.materiales).length === 0
          ) {
            return true;
          }

          // Caso 3: materiales es un array vacío
          if (
            Array.isArray(producto.materiales) &&
            producto.materiales.length === 0
          ) {
            return true;
          }

          // En cualquier otro caso, el producto tiene materiales y no lo incluimos
          return false;
        });

        // console.log(`Encontrados ${productosData.length} productos totales`);
        // console.log(
        //   `Filtrados ${productosFiltrados.length} productos sin materiales`
        // );

        setProductos(productosFiltrados);
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
  }, [empresaId, isAnhelo]);

  // Filtrar productos basados en término de búsqueda
  useEffect(() => {
    if (!searchTerm) {
      // Si no hay término de búsqueda, mostramos todos los productos
      setFilteredProductos(productos);
    } else {
      // Filtrar por término de búsqueda
      const filtered = productos.filter((producto) => {
        const nombre = producto.name || producto.nombre || "";
        return nombre.toLowerCase().includes(searchTerm.toLowerCase());
      });
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
      <p className="text-xl my-2 px-4">Productos simples</p>

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
            No hay productos (no compuestos) disponibles
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
          {filteredProductos.map((producto) => {
            // Determinamos el nombre a mostrar (algunos productos usan 'name' y otros 'nombre')
            const nombreProducto =
              producto.name || producto.nombre || "Sin nombre";
            // Si tiene un tipo (de las colecciones específicas de Anhelo), lo añadimos
            const tipoIndicador = producto.tipo ? ` (${producto.tipo})` : "";

            return (
              <div
                key={producto.id}
                onClick={() => {
                  if (setFormData) {
                    setFormData((prev) => ({
                      ...prev,
                      name: nombreProducto,
                      // Intentamos obtener otros campos relevantes
                      unit: producto.unit || "unidad",
                      total: producto.price || producto.precio || 0, // Usa total en lugar de precio para coincidir con el formData
                      description:
                        producto.description || producto.descripcion || "",
                    }));
                  }
                  if (onProductoChange) {
                    onProductoChange(producto);
                  }
                }}
                className={`cursor-pointer px-3 py-2 rounded-lg text-xs flex items-center justify-center whitespace-nowrap flex-shrink-0 ${
                  formData?.name === nombreProducto
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
                {nombreProducto.charAt(0).toUpperCase() +
                  nombreProducto.slice(1).toLowerCase()}
                {tipoIndicador}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductoSelector;
