import React, { useState } from "react";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import arrow from "../../assets/arrowIcon.png";

// Componente para añadir nuevas categorías, con soporte para categorías recurrentes
export const AddCategoryForm = ({ onCancel, onSuccess, empresaId }) => {
  const [categoryName, setCategoryName] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringItems, setRecurringItems] = useState([""]);
  const [loading, setLoading] = useState(false);

  // Añadir un nuevo campo para ítem recurrente
  const addRecurringItem = () => {
    setRecurringItems([...recurringItems, ""]);
  };

  // Actualizar un ítem recurrente específico
  const updateRecurringItem = (index, value) => {
    const newItems = [...recurringItems];
    newItems[index] = value;
    setRecurringItems(newItems);
  };

  // Eliminar un ítem recurrente
  const removeRecurringItem = (index) => {
    if (recurringItems.length > 1) {
      const newItems = [...recurringItems];
      newItems.splice(index, 1);
      setRecurringItems(newItems);
    }
  };

  // Guardar la categoría en Firestore
  const saveCategory = async () => {
    if (!categoryName.trim()) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "El nombre de la categoría es obligatorio",
      });
      return;
    }

    // Para categorías recurrentes, validar que haya al menos un ítem válido
    if (isRecurring) {
      const validItems = recurringItems.filter((item) => item.trim() !== "");
      if (validItems.length === 0) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Debes agregar al menos un ítem recurrente",
        });
        return;
      }

      // Limpiar ítems vacíos
      setRecurringItems(validItems);
    }

    try {
      setLoading(true);
      const firestore = getFirestore();
      const docRef = doc(firestore, "absoluteClientes", empresaId);

      // Obtener las categorías actuales
      const docSnap = await getDoc(docRef);
      let existingCategories = [];

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.config && data.config.gastosCategories) {
          existingCategories = data.config.gastosCategories;
        } else if (data.gastosCategory && data.gastosCategory.length > 0) {
          existingCategories = data.gastosCategory;
        }
      }

      // Preparar la nueva categoría
      let newCategory;
      if (isRecurring) {
        // Para categorías recurrentes, crear un objeto con el nombre como clave y un array de ítems
        const validItems = recurringItems.filter((item) => item.trim() !== "");
        newCategory = { [categoryName.toLowerCase()]: validItems };
      } else {
        // Para categorías simples, solo guardar el nombre
        newCategory = categoryName.toLowerCase();
      }

      // Añadir la nueva categoría
      const updatedCategories = [...existingCategories, newCategory];

      // Actualizar en Firestore
      await updateDoc(docRef, {
        "config.gastosCategories": updatedCategories,
      });

      Swal.fire({
        icon: "success",
        title: "Categoría creada",
        text: `La categoría "${categoryName}" se creó correctamente`,
        timer: 2000,
        showConfirmButton: false,
      });

      // Notificar éxito y pasar la categoría creada
      if (onSuccess) {
        onSuccess(newCategory);
      }
    } catch (error) {
      console.error("Error al guardar categoría:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al crear la categoría",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4">
      <p className="text-2xl mx-4 my-2 text-center">Nueva categoría</p>

      <div
        className="text-gray-400 mb-4 flex-row gap-1 text-xs justify-center flex items-center font-light cursor-pointer"
        onClick={onCancel}
      >
        <img
          src={arrow}
          className="transform rotate-180 h-2 opacity-30"
          alt="Volver"
        />
        Volver
      </div>

      {/* Nombre de la categoría */}
      <div className="section w-full relative z-0 mb-4">
        <input
          type="text"
          id="categoryName"
          name="categoryName"
          className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
          value={categoryName}
          placeholder="Nombre de la categoría"
          onChange={(e) => setCategoryName(e.target.value)}
          autoFocus
        />
      </div>

      {/* Opción para categoría recurrente */}
      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id="isRecurring"
          name="isRecurring"
          className="mr-2 h-4 w-4"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
        />
        <label htmlFor="isRecurring" className="text-xs">
          Crear categoria con items. Ej: Para Infraestructura siempre pagas luz,
          alquiler, agua y gas; Armarlo asi te facilitara la gestion.
        </label>
      </div>

      {/* Mostrar campos para ítems recurrentes si se selecciona la opción */}
      {isRecurring && (
        <div className="mb-4">
          <p className="text-xs mb-2">Ítems recurrentes:</p>

          {recurringItems.map((item, index) => (
            <div key={index} className="flex items-center mb-2">
              <input
                type="text"
                value={item}
                onChange={(e) => updateRecurringItem(index, e.target.value)}
                placeholder={`Ítem ${index + 1}`}
                className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
              />

              {/* Botón para eliminar ítem */}
              {recurringItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRecurringItem(index)}
                  className="ml-2 text-red-500 h-10 w-10 flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}

          {/* Botón para agregar más ítems */}
          <button
            type="button"
            onClick={addRecurringItem}
            className="mt-2 text-xs flex items-center text-black bg-gray-200 px-3 py-2 rounded"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 mr-1"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
            Agregar ítem
          </button>
        </div>
      )}

      {/* Botón para guardar */}
      <button
        type="button"
        onClick={saveCategory}
        className="text-gray-100 w-full h-20 mt-2 rounded-lg bg-black text-4xl font-bold"
        disabled={!categoryName.trim() || loading}
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
  );
};

export default AddCategoryForm;
