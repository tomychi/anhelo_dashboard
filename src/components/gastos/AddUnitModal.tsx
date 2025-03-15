import React, { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import arrow from "../../assets/arrowIcon.png";

interface AddUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newUnit: string) => void;
  empresaId: string;
}

export const AddUnitModal: React.FC<AddUnitModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  empresaId,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const [unitName, setUnitName] = useState("");
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Configurar animación al abrir
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setCurrentTranslate(0);
    }
  }, [isOpen]);

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
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Guardar la unidad en Firestore
  const saveUnit = async () => {
    if (!unitName.trim()) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "El nombre de la unidad es obligatorio",
      });
      return;
    }

    try {
      setLoading(true);
      const firestore = getFirestore();
      const docRef = doc(firestore, "absoluteClientes", empresaId);

      // Obtener las unidades actuales
      const docSnap = await getDoc(docRef);
      let existingUnits = [];

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.config && data.config.gastosUnidades) {
          existingUnits = data.config.gastosUnidades;
        }
      }

      // Verificar si la unidad ya existe
      const normalizedUnit = unitName.toLowerCase().trim();
      if (existingUnits.includes(normalizedUnit)) {
        Swal.fire({
          icon: "warning",
          title: "Unidad existente",
          text: `La unidad "${normalizedUnit}" ya existe`,
        });
        setLoading(false);
        return;
      }

      // Añadir la nueva unidad
      const updatedUnits = [...existingUnits, normalizedUnit];

      // Actualizar en Firestore
      await updateDoc(docRef, {
        "config.gastosUnidades": updatedUnits,
      });

      Swal.fire({
        icon: "success",
        title: "Unidad creada",
        text: `La unidad "${normalizedUnit}" se creó correctamente`,
        timer: 2000,
        showConfirmButton: false,
      });

      // Notificar éxito y pasar la unidad creada
      if (onSuccess) {
        onSuccess(normalizedUnit);
      }
    } catch (error) {
      console.error("Error al guardar unidad:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al crear la unidad",
      });
    } finally {
      setLoading(false);
    }
  };

  // Si está cerrado, no renderizar nada
  if (!isOpen) return null;

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

        <div className="px-4">
          <p className="text-2xl mx-4 my-2 text-center">Nueva unidad</p>

          <div
            className="text-gray-400 mb-4 flex-row gap-1 text-xs justify-center flex items-center font-light cursor-pointer"
            onClick={onClose}
          >
            <img
              src={arrow}
              className="transform rotate-180 h-2 opacity-30"
              alt="Volver"
            />
            Volver
          </div>

          {/* Nombre de la unidad */}
          <div className="section w-full relative z-0 mb-4">
            <input
              type="text"
              id="unitName"
              name="unitName"
              className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
              value={unitName}
              placeholder="Nombre de la unidad (ej: caja, docena, paquete)"
              onChange={(e) => setUnitName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Botón para guardar */}
          <button
            type="button"
            onClick={saveUnit}
            className="text-gray-100 w-full h-20 mt-2 rounded-lg bg-black text-4xl font-bold"
            disabled={!unitName.trim() || loading}
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
              "Guardar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUnitModal;
