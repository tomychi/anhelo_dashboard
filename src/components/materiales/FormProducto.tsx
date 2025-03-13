import React, { ChangeEvent, FormEvent, useState, useEffect } from "react";
import Swal from "sweetalert2";
import { projectAuth } from "../../firebase/config";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import {
  CreateProducto,
  readMateriales,
  MaterialProps,
} from "../../firebase/Materiales";

interface MaterialItem {
  nombre: string;
  cantidad: number;
}

export interface ProductoProps {
  name: string;
  description: string;
  price: number;
  materiales: {
    [key: string]: number;
  };
}

export const FormProducto: React.FC = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const [materialesDisponibles, setMaterialesDisponibles] = useState<
    MaterialProps[]
  >([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [selectedCantidad, setSelectedCantidad] = useState<number>(1);
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState<
    MaterialItem[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Estado inicial del formulario
  const [formData, setFormData] = useState<Omit<ProductoProps, "materiales">>({
    name: "",
    description: "",
    price: 0,
  });

  // Cargar lista de materiales al iniciar
  useEffect(() => {
    const fetchMateriales = async () => {
      try {
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
        setLoading(false);
      } catch (error) {
        console.error("Error al obtener materiales:", error);
        setLoading(false);
      }
    };

    fetchMateriales();
  }, [auth]);

  // Maneja cambios en los inputs del formulario principal
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "price") {
      const numericValue = parseFloat(value);
      setFormData((prev) => ({
        ...prev,
        [name]: isNaN(numericValue) ? 0 : numericValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Maneja cambios en el material seleccionado
  const handleMaterialChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedMaterial(e.target.value);
  };

  // Maneja cambios en la cantidad
  const handleCantidadChange = (e: ChangeEvent<HTMLInputElement>) => {
    const cantidad = parseInt(e.target.value);
    setSelectedCantidad(isNaN(cantidad) ? 1 : Math.max(1, cantidad));
  };

  // Añade material a la lista
  const handleAddMaterial = () => {
    if (!selectedMaterial) return;

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
        { nombre: selectedMaterial, cantidad: selectedCantidad },
      ]);
    }

    // Resetear selección
    setSelectedCantidad(1);
  };

  // Elimina material de la lista
  const handleRemoveMaterial = (index: number) => {
    const updatedMateriales = [...materialesSeleccionados];
    updatedMateriales.splice(index, 1);
    setMaterialesSeleccionados(updatedMateriales);
  };

  // Maneja el envío del formulario
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Convertir array de materiales a formato de objeto
    const materialesObj: { [key: string]: number } = {};
    materialesSeleccionados.forEach((item) => {
      materialesObj[item.nombre] = item.cantidad;
    });

    try {
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

      // Crear producto completo
      const productoData: ProductoProps = {
        ...formData,
        materiales: materialesObj,
      };

      // Crear el producto
      await CreateProducto(productoData, isAnhelo, empresaId);

      await Swal.fire({
        icon: "success",
        title: "Producto creado",
        text: `El producto ${formData.name} se ha creado correctamente`,
      });

      // Reiniciar el formulario
      setFormData({
        name: "",
        description: "",
        price: 0,
      });
      setMaterialesSeleccionados([]);
    } catch (error) {
      console.error("Error al crear el producto:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Hubo un error al crear el producto: ${error}`,
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="items-center w-full justify-center p-4 rounded-md font-coolvetica text-black"
    >
      <div className="flex flex-row justify-between font-coolvetica items-center mb-4">
        <p className="text-black font-bold text-4xl">Nuevo Producto</p>
      </div>

      <div className="item-section w-full flex flex-col gap-2">
        <div className="section relative z-0">
          <input
            type="text"
            id="name"
            name="name"
            className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nombre del producto"
            required
            autoComplete="off"
          />
        </div>

        <div className="section relative z-0">
          <textarea
            id="description"
            name="description"
            className="custom-bg block w-full h-20 px-4 py-2 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
            value={formData.description}
            onChange={handleChange}
            placeholder="Descripción del producto"
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
            placeholder="Precio"
            required
          />
        </div>

        <div className="mt-4 mb-2">
          <p className="text-lg font-semibold">Materiales / Ingredientes</p>
        </div>

        {loading ? (
          <div className="text-sm">Cargando materiales...</div>
        ) : (
          <div className="flex flex-col gap-2">
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
                    <option key={material.id} value={material.nombre}>
                      {material.nombre}
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
        )}

        {materialesSeleccionados.length > 0 && (
          <div className="mt-2 mb-4">
            <p className="text-sm font-semibold mb-2">
              Materiales seleccionados:
            </p>
            <div className="bg-gray-100 p-2 rounded-md">
              {materialesSeleccionados.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center mb-1 p-1 border-b"
                >
                  <div>
                    <span className="font-medium">{item.nombre}</span>
                    <span className="ml-2 text-sm">({item.cantidad})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMaterial(index)}
                    className="text-red-500 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="text-gray-100 w-full h-20 mt-2 rounded-lg bg-black text-4xl font-bold"
        >
          Guardar
        </button>
      </div>
    </form>
  );
};
