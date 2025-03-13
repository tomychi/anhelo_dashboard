import React, { ChangeEvent, FormEvent, useState } from "react";
import Swal from "sweetalert2";
import { projectAuth } from "../firebase/config";
import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import { CreateMaterial } from "../firebase/Materiales";
import { FormProducto } from "../components/materiales/FormProducto";

export interface SimpleMaterialProps {
  nombre: string;
  costo: number;
  unit: string;
}

export const FormMaterial: React.FC = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const currentUserEmail = projectAuth.currentUser?.email;

  // Estado inicial del formulario
  const [formData, setFormData] = useState<SimpleMaterialProps>({
    nombre: "",
    costo: 0,
    unit: "unidad",
  });

  // Maneja cambios en los inputs
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "costo") {
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

  // Maneja el envío del formulario
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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

      // Crear el material
      await CreateMaterial(formData, isAnhelo, empresaId);

      await Swal.fire({
        icon: "success",
        title: "Material creado",
        text: `El material ${formData.nombre} se ha creado correctamente`,
      });

      // Reiniciar el formulario
      setFormData({
        nombre: "",
        costo: 0,
        unit: "unidad",
      });
    } catch (error) {
      console.error("Error al crear el material:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Hubo un error al crear el material: ${error}`,
      });
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="items-center w-full justify-center p-4 rounded-md font-coolvetica text-black"
      >
        <div className="flex flex-row justify-between font-coolvetica items-center mb-4">
          <p className="text-black font-bold text-4xl">Nuevo Material</p>
        </div>

        <div className="item-section w-full flex flex-col gap-2">
          <div className="section relative z-0">
            <input
              type="text"
              id="nombre"
              name="nombre"
              className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Nombre del material"
              required
              autoComplete="off"
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
              value={formData.unit}
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

          <button
            type="submit"
            className="text-gray-100 w-full h-20 mt-2 rounded-lg bg-black text-4xl font-bold"
          >
            Guardar
          </button>
        </div>
      </form>
      <FormProducto />
    </div>
  );
};
