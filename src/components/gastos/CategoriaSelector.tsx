import React, { useState, useEffect } from "react";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";

// Categoría predeterminada que siempre debe estar disponible
const DEFAULT_CATEGORY = "materia prima";

// Componente para mostrar y gestionar las categorías
export const CategoriaSelector = ({
  selectedCategory,
  onCategoryChange,
  formData,
  setFormData,
  onAddCategory, // Prop para manejar "Agregar categoría"
  onCategoryTypeChange, // Nueva prop para informar si la categoría es recurrente
  onLoadingChange, // Añadimos esta prop explícitamente
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecurringItems, setSelectedRecurringItems] = useState([]);
  const [showRecurringItems, setShowRecurringItems] = useState(false);

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
          }

          // Asegurarnos de que "materia prima" esté siempre incluida
          // Solo si todas las categorías son strings (no hay objetos de categorías recurrentes)
          if (
            !categoriesFromDB.some((cat) => typeof cat === "object") &&
            !categoriesFromDB.includes(DEFAULT_CATEGORY)
          ) {
            categoriesFromDB = [DEFAULT_CATEGORY, ...categoriesFromDB];
            console.log(`Categoría "${DEFAULT_CATEGORY}" añadida localmente`);
          }

          setCategories(categoriesFromDB);

          // Si la categoría seleccionada no está en la lista, seleccionamos la primera
          if (
            categoriesFromDB.length > 0 &&
            !isCategoryInArray(formData.category, categoriesFromDB)
          ) {
            const firstCategory = categoriesFromDB[0];
            const categoryValue =
              typeof firstCategory === "object"
                ? Object.keys(firstCategory)[0]
                : firstCategory;

            setFormData((prev) => ({
              ...prev,
              category: categoryValue,
            }));

            // Si es una categoría recurrente, también configuramos el array de items
            // y notificamos al componente padre
            if (typeof firstCategory === "object") {
              setSelectedRecurringItems(firstCategory[categoryValue]);
              setShowRecurringItems(true);
              if (onCategoryTypeChange) {
                onCategoryTypeChange(true);
              }
            } else {
              if (onCategoryTypeChange) {
                onCategoryTypeChange(false);
              }
            }
          } else {
            // Verificar si la categoría seleccionada es recurrente
            checkAndSetRecurringType(formData.category, categoriesFromDB);
          }
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
        // En caso de error, al menos asegurarnos de que "materia prima" esté disponible
        setCategories([DEFAULT_CATEGORY]);
        if (onCategoryTypeChange) {
          onCategoryTypeChange(false);
        }
      } finally {
        setLoading(false);
        // Notificar al componente padre que la carga ha terminado
        if (onLoadingChange) {
          onLoadingChange(false);
        }
      }
    };

    if (empresaId) {
      fetchCategories();
    } else {
      // Si no hay empresaId, al menos ponemos la categoría predeterminada
      setCategories([DEFAULT_CATEGORY]);
      setLoading(false);
      // Notificar al componente padre que la carga ha terminado
      if (onLoadingChange) {
        onLoadingChange(false);
      }
      if (onCategoryTypeChange) {
        onCategoryTypeChange(false);
      }
    }
  }, [empresaId, isAnhelo]);

  // Función para verificar si la categoría seleccionada es recurrente
  const checkAndSetRecurringType = (categoryName, categoryArray) => {
    for (const category of categoryArray) {
      if (typeof category === "object") {
        const key = Object.keys(category)[0];
        if (key === categoryName) {
          setSelectedRecurringItems(category[key]);
          setShowRecurringItems(true);
          if (onCategoryTypeChange) {
            onCategoryTypeChange(true);
          }
          return;
        }
      }
    }

    // Si llegamos aquí, no es una categoría recurrente
    setShowRecurringItems(false);
    if (onCategoryTypeChange) {
      onCategoryTypeChange(false);
    }
  };

  // Verificar si una categoría existe en el array (incluyendo objetos)
  const isCategoryInArray = (categoryName, categoryArray) => {
    return categoryArray.some((item) => {
      if (typeof item === "string") {
        return item === categoryName;
      } else if (typeof item === "object") {
        return Object.keys(item)[0] === categoryName;
      }
      return false;
    });
  };

  // Función para guardar una categoría en la base de datos si no existe
  const saveDefaultCategoryIfNeeded = async () => {
    // Solo ejecutamos esto si están usando la categoría predeterminada y no está en la BD
    if (
      formData.category === DEFAULT_CATEGORY &&
      !isCategoryInArray(DEFAULT_CATEGORY, categories)
    ) {
      try {
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

        // Añadir la categoría predeterminada si no existe
        if (!isCategoryInArray(DEFAULT_CATEGORY, existingCategories)) {
          const updatedCategories = [DEFAULT_CATEGORY, ...existingCategories];

          // Actualizar en Firestore
          await updateDoc(docRef, {
            "config.gastosCategories": updatedCategories,
          });

          console.log(
            `Categoría "${DEFAULT_CATEGORY}" guardada en la base de datos`
          );
        }
      } catch (error) {
        console.error("Error al guardar categoría predeterminada:", error);
      }
    }
  };

  // Llamamos a esta función cada vez que la categoría seleccionada cambia a "materia prima"
  useEffect(() => {
    if (formData.category === DEFAULT_CATEGORY && empresaId) {
      saveDefaultCategoryIfNeeded();
    }
  }, [formData.category, empresaId]);

  // Manejar selección de categoría
  const handleCategorySelect = (category) => {
    // Determinar si es una categoría simple o recurrente
    let categoryName;
    let items = [];
    let isRecurring = false;

    if (typeof category === "string") {
      categoryName = category;
      setShowRecurringItems(false);
      isRecurring = false;
    } else if (typeof category === "object") {
      categoryName = Object.keys(category)[0];
      items = category[categoryName];
      setSelectedRecurringItems(items);
      setShowRecurringItems(true);
      isRecurring = true;
    }

    // Actualizar formData
    setFormData((prev) => ({
      ...prev,
      category: categoryName,
    }));

    // Si es recurrente pero no hay item seleccionado aún, seleccionamos el primero
    if (items.length > 0) {
      setFormData((prev) => ({
        ...prev,
        name: items[0], // Seleccionar el primer item por defecto
      }));
    } else {
      // Si no es recurrente, limpiar el nombre
      setFormData((prev) => ({
        ...prev,
        name: "",
      }));
    }

    // Notificar al componente padre si la categoría es recurrente
    if (onCategoryTypeChange) {
      onCategoryTypeChange(isRecurring);
    }
  };

  // Manejar selección de item recurrente
  const handleRecurringItemSelect = (item) => {
    setFormData((prev) => ({
      ...prev,
      name: item,
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="w-6 h-6 border-2 border-black rounded-full animate-spin border-t-transparent"></div>
      </div>
    );
  }

  // Encontrar la categoría seleccionada en el array (para categorías recurrentes)
  const getSelectedCategory = () => {
    for (const category of categories) {
      if (typeof category === "string" && category === formData.category) {
        return category;
      } else if (
        typeof category === "object" &&
        Object.keys(category)[0] === formData.category
      ) {
        return category;
      }
    }
    return formData.category; // Fallback
  };

  return (
    <div className="section w-full relative mb-4 z-0">
      <p className="text-xl my-2 px-4 ">Categoría</p>

      {categories.length === 0 ? (
        // Mensaje cuando no hay categorías (aunque siempre debería haber al menos DEFAULT_CATEGORY)
        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500 mb-4 text-center">
            No hay categorías definidas para esta empresa
          </p>
          <button
            onClick={onAddCategory}
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
        <div>
          {/* Lista de categorías existentes */}
          <div className="flex flex-row px-4 gap-2 overflow-x-auto">
            {/* Botón para agregar nueva categoría */}
            <div
              onClick={onAddCategory}
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

            {categories.map((category, index) => {
              // Determinar si es una categoría simple o recurrente
              const isObject = typeof category === "object";
              const categoryName = isObject
                ? Object.keys(category)[0]
                : category;
              const isSelected = formData.category === categoryName;

              return (
                <div
                  key={index}
                  onClick={() => handleCategorySelect(category)}
                  className={`cursor-pointer px-3 py-2 rounded-lg text-xs flex items-center justify-center whitespace-nowrap flex-shrink-0 ${
                    isSelected
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
                  {categoryName.charAt(0).toUpperCase() +
                    categoryName.slice(1).toLowerCase()}
                  {isObject && (
                    <span className="ml-1 text-xs opacity-70">▼</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mostrar ítems recurrentes si la categoría seleccionada tiene ítems */}
          {showRecurringItems && selectedRecurringItems.length > 0 && (
            <div className="mt-4">
              <p className="text-sm my-2 px-4">Selecciona un ítem</p>
              <div className="flex flex-row px-4 gap-2 overflow-x-auto">
                {selectedRecurringItems.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => handleRecurringItemSelect(item)}
                    className={`cursor-pointer px-3 py-2 rounded-lg text-xs flex items-center justify-center whitespace-nowrap flex-shrink-0 ${
                      formData.name === item
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
                      <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                    </svg>
                    {item.charAt(0).toUpperCase() + item.slice(1).toLowerCase()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoriaSelector;
