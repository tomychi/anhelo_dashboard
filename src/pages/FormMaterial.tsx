import React, { ChangeEvent, FormEvent, useState } from "react";
import Swal from "sweetalert2";
import { projectAuth } from "../firebase/config";
import { useSelector } from "react-redux";
import { RootState } from "../redux/configureStore";
import { CreateMaterial, SimpleMaterialProps } from "../firebase/Materiales";
import { FormProducto } from "../components/materiales/FormProducto";
import { ListByIcons } from "../components/materiales/ListByIcons";

interface FormMaterialProps {
  isInModal?: boolean;
  onSuccess?: () => void;
}

export const FormMaterial: React.FC<FormMaterialProps> = ({
  isInModal = false,
  onSuccess,
}) => {
  const auth = useSelector((state: RootState) => state.auth);
  const currentUserEmail = projectAuth.currentUser?.email;

  // Estado inicial del formulario
  const [formData, setFormData] = useState<SimpleMaterialProps>({
    nombre: "",
    costo: 0,
    medida: 0,
    unidadMedida: "g",
  });

  // Maneja cambios en los inputs
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "costo" || name === "medida") {
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

      // Mostrar mensaje de éxito
      if (!isInModal) {
        await Swal.fire({
          icon: "success",
          title: "Material creado",
          text: `El material ${formData.nombre} se ha creado correctamente`,
        });
      } else {
        // Alertas más simples si está en un modal
        alert(`El material ${formData.nombre} se ha creado correctamente`);
      }

      // Reiniciar el formulario
      setFormData({
        nombre: "",
        costo: 0,
        medida: 0,
        unidadMedida: "g",
      });

      // Llamar al callback de éxito si existe
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error al crear el material:", error);
      if (!isInModal) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `Hubo un error al crear el material: ${error}`,
        });
      } else {
        alert(`Hubo un error al crear el material: ${error}`);
      }
    }
  };

  const formContent = (
    <form
      onSubmit={handleSubmit}
      className="items-center w-full justify-center p-4 rounded-md font-coolvetica text-black"
    >
      {!isInModal && (
        <div className="flex flex-row justify-between font-coolvetica items-center mb-4">
          <p className="text-black font-bold text-4xl">Nuevo Material</p>
        </div>
      )}

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
            value={formData.unidadMedida}
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

        <button
          type="submit"
          className="text-gray-100 w-full h-20 mt-2 rounded-lg bg-black text-4xl font-bold"
        >
          Guardar
        </button>
      </div>
    </form>
  );

  // Si está en un modal, devolver solo el contenido del formulario
  if (isInModal) {
    return formContent;
  }

  // Si no está en un modal, devolver el ListByIcons, el contenido del formulario y el FormProducto
  return (
    <div>
      <ListByIcons />
    </div>
  );
};

export default FormMaterial;
