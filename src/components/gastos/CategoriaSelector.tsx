import React, { useState, useEffect } from "react";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";
import CategoriasModal from "./CategoriasModal"; // Importamos el nuevo modal

// Componente para mostrar y gestionar las categorías
export const CategoriaSelector = ({
  selectedCategory,
  onCategoryChange,
  formData,
  setFormData,
}) => {
  const [categories, setCategories] = useState([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);

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

  // Cargar categorías desde Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const firestore = getFirestore();
        let docRef;

        if (isAnhelo) {
          // Para Anhelo, podríamos tener una configuración especial
          docRef = doc(firestore, "absoluteClientes", empresaId);
        } else {
          // Para otras empresas
          docRef = doc(firestore, "absoluteClientes", empresaId);
        }

        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          // Primero intentamos obtener del campo gastosCategories en config
          const data = docSnap.data();
          let categoriesFromDB = [];

          if (data.config && data.config.gastosCategories) {
            categoriesFromDB = data.config.gastosCategories;
          } else if (data.gastosCategory && data.gastosCategory.length > 0) {
            // Si no está en config, intentamos con el campo gastosCategory
            categoriesFromDB = data.gastosCategory;
          } else {
            // Si no hay categorías guardadas, inicializamos con un array vacío
            categoriesFromDB = [];

            // Y lo guardamos para futuro uso (opcional, puedes comentar estas líneas)
            // No inicializamos con valores predeterminados para que cada empresa defina sus propias categorías
            await updateDoc(docRef, {
              "config.gastosCategories": categoriesFromDB,
            });
          }

          setCategories(categoriesFromDB);

          // Si la categoría seleccionada no está en la lista, seleccionamos la primera
          if (
            categoriesFromDB.length > 0 &&
            !categoriesFromDB.includes(formData.category)
          ) {
            setFormData((prev) => ({
              ...prev,
              category: categoriesFromDB[0],
            }));
          }
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      } finally {
        setLoading(false);
      }
    };

    if (empresaId) {
      fetchCategories();
    }
  }, [empresaId, isAnhelo]);

  // Guardar una nueva categoría
  const saveNewCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      setLoading(true);
      const firestore = getFirestore();
      const docRef = doc(firestore, "absoluteClientes", empresaId);

      // Añadir la nueva categoría a las existentes
      const updatedCategories = [...categories, newCategory.toLowerCase()];

      // Actualizar en Firestore
      await updateDoc(docRef, {
        "config.gastosCategories": updatedCategories,
      });

      // Actualizar el estado local
      setCategories(updatedCategories);

      // Seleccionar la nueva categoría
      setFormData((prev) => ({
        ...prev,
        category: newCategory.toLowerCase(),
      }));

      // Limpiar el formulario
      setNewCategory("");
      setIsAddingCategory(false);
    } catch (error) {
      console.error("Error al guardar categoría:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="w-6 h-6 border-2 border-black rounded-full animate-spin border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="section w-full relative mb-4 z-0">
      <p className="text-2xl mx-4 my-2 text-center">Categoría</p>

      {categories.length === 0 ? (
        // Mensaje cuando no hay categorías
        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4 text-center">
            No hay categorías definidas para esta empresa
          </p>
          <button
            onClick={() => setIsAddingCategory(true)}
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
            Crear primera categoría
          </button>
        </div>
      ) : (
        // Lista de categorías existentes
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <div
              key={category}
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  category: category,
                }));
              }}
              className={`cursor-pointer px-3 py-2 rounded-lg text-xs flex items-center justify-center ${
                formData.category === category
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
                  d="M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                  clipRule="evenodd"
                />
              </svg>

              {category.charAt(0).toUpperCase() +
                category.slice(1).toLowerCase()}
            </div>
          ))}

          {/* Botón para agregar nueva categoría */}
          <div
            onClick={() => setIsAddingCategory(true)}
            className={`cursor-pointer px-3 py-2 rounded-lg text-xs flex items-center justify-center bg-gray-100 text-black border border-dashed border-gray-400`}
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
        </div>
      )}

      {/* Nuevo modal para agregar categoría */}
      <CategoriasModal
        isOpen={isAddingCategory}
        onClose={() => setIsAddingCategory(false)}
        title="Nueva categoría"
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        onSave={saveNewCategory}
      />
    </div>
  );
};

export default CategoriaSelector;
