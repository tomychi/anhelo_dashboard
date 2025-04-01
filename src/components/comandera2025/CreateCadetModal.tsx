// CreateCadetModal.tsx
import React, { useState } from "react";
import { createCadet } from "../../firebase/comandera2025";
import Swal from "sweetalert2";

interface CreateCadetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateCadetModal: React.FC<CreateCadetModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // console.log('1. Inicio de handleSubmit');
    setLoading(true);

    try {
      // console.log('2. Validando número de teléfono:', phoneNumber);
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phoneNumber)) {
        throw new Error("El número de teléfono debe tener 10 dígitos");
      }

      // console.log('3. Validación de teléfono exitosa, llamando a createCadet');
      // console.log('4. Datos a enviar:', { phoneNumber, name });

      await createCadet(phoneNumber, name);
      // console.log("5. Cadete creado exitosamente");

      Swal.fire({
        icon: "success",
        title: "Cadete creado",
        text: `El cadete ${name} ha sido creado exitosamente`,
      });

      // console.log('6. Limpiando formulario');
      setPhoneNumber("");
      setName("");
      onClose();
    } catch (error) {
      // console.error('Error en handleSubmit:', error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error ? error.message : "Error al crear el cadete",
      });
    } finally {
      // console.log('7. Finalizando proceso');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold font-coolvetica">Crear Cadete</h2>
          <button
            onClick={onClose}
            className="text-gray-400  hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Número de celular
            </label>
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <path
                  fillRule="evenodd"
                  d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-main focus:border-transparent"
                placeholder="Ingrese número de celular (10 dígitos)"
                required
                pattern="[0-9]{10}"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <path
                  fillRule="evenodd"
                  d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-main focus:border-transparent"
                placeholder="Ingrese nombre del cadete"
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-red-main text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-red-300"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150"></div>
                </div>
              ) : (
                "Crear"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCadetModal;
