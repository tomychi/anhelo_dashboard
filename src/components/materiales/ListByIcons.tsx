import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import {
  MaterialProps,
  readMateriales,
  readProductos,
  ProductoProps,
} from "../../firebase/Materiales";
import currencyFormat from "../../helpers/currencyFormat";

export const ListByIcons: React.FC = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const [materiales, setMateriales] = useState<MaterialProps[]>([]);
  const [productos, setProductos] = useState<ProductoProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

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

        // Obtener materiales y productos
        const materialesData = await readMateriales(isAnhelo, empresaId);
        const productosData = await readProductos(isAnhelo, empresaId);

        setMateriales(materialesData);
        setProductos(productosData);
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
                  className="min-w-[200px] bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
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
                  className="min-w-[200px] bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
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
    </div>
  );
};
