import React, { useState, useEffect } from "react";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";

// Categorías predeterminadas que siempre deben estar disponibles
const DEFAULT_CATEGORY = "materia prima";
const OTHERS_CATEGORY = "otros";

// Componente para mostrar y gestionar las categorías
export const CategoriaSelector = ({
  selectedCategory,
  onCategoryChange,
  formData,
  setFormData,
  onAddCategory, // Prop para manejar "Agregar categoría"
  onCategoryTypeChange, // Nueva prop para informar si la categoría es recurrente
  onLoadingChange, // Añadimos esta prop explícitamente
  onShowCustomInputs, // Nueva prop para mostrar/ocultar inputs personalizados
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecurringItems, setSelectedRecurringItems] = useState([]);
  const [showRecurringItems, setShowRecurringItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // Añadido para búsqueda
  const [filteredCategories, setFilteredCategories] = useState([]); // Añadido para búsqueda

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

          // Creamos una copia para no modificar directamente el array original
          let updatedCategories = [...categoriesFromDB];

          // Asegurarnos de que ambas categorías predeterminadas estén siempre incluidas
          if (
            !updatedCategories.includes(OTHERS_CATEGORY) &&
            !updatedCategories.some(
              (cat) =>
                typeof cat === "object" &&
                Object.keys(cat)[0] === OTHERS_CATEGORY
            )
          ) {
            updatedCategories.push(OTHERS_CATEGORY);
            console.log(`Categoría "${OTHERS_CATEGORY}" añadida localmente`);
          }

          if (
            !updatedCategories.includes(DEFAULT_CATEGORY) &&
            !updatedCategories.some(
              (cat) =>
                typeof cat === "object" &&
                Object.keys(cat)[0] === DEFAULT_CATEGORY
            )
          ) {
            updatedCategories.unshift(DEFAULT_CATEGORY);
            console.log(`Categoría "${DEFAULT_CATEGORY}" añadida localmente`);
          }

          setCategories(updatedCategories);

          // Si la categoría seleccionada no está en la lista, seleccionamos la primera
          if (
            updatedCategories.length > 0 &&
            !isCategoryInArray(formData.category, updatedCategories)
          ) {
            const firstCategory = updatedCategories[0];
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
              if (onShowCustomInputs) {
                onShowCustomInputs(false);
              }
            } else {
              if (onCategoryTypeChange) {
                onCategoryTypeChange(false);
              }
              // Si es "otros", mostrar inputs personalizados
              if (categoryValue === OTHERS_CATEGORY && onShowCustomInputs) {
                onShowCustomInputs(true);
              } else if (onShowCustomInputs) {
                onShowCustomInputs(false);
              }
            }
          } else {
            // Verificar si la categoría seleccionada es recurrente
            checkAndSetRecurringType(formData.category, updatedCategories);

            // Verificar si la categoría seleccionada es "otros"
            if (formData.category === OTHERS_CATEGORY && onShowCustomInputs) {
              onShowCustomInputs(true);
            } else if (onShowCustomInputs) {
              onShowCustomInputs(false);
            }
          }
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
        // En caso de error, al menos asegurarnos de que las categorías predeterminadas estén disponibles
        setCategories([DEFAULT_CATEGORY, OTHERS_CATEGORY]);
        if (onCategoryTypeChange) {
          onCategoryTypeChange(false);
        }
        // Si la categoría seleccionada es "otros", mostrar inputs personalizados
        if (formData.category === OTHERS_CATEGORY && onShowCustomInputs) {
          onShowCustomInputs(true);
        } else if (onShowCustomInputs) {
          onShowCustomInputs(false);
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
      // Si no hay empresaId, al menos ponemos las categorías predeterminadas
      setCategories([DEFAULT_CATEGORY, OTHERS_CATEGORY]);
      setLoading(false);
      // Notificar al componente padre que la carga ha terminado
      if (onLoadingChange) {
        onLoadingChange(false);
      }
      if (onCategoryTypeChange) {
        onCategoryTypeChange(false);
      }
      // Si la categoría seleccionada es "otros", mostrar inputs personalizados
      if (formData.category === OTHERS_CATEGORY && onShowCustomInputs) {
        onShowCustomInputs(true);
      } else if (onShowCustomInputs) {
        onShowCustomInputs(false);
      }
    }
  }, [empresaId, isAnhelo]);

  // Filtrar categorías basadas en término de búsqueda
  useEffect(() => {
    // Ordenar categorías antes de filtrar
    const sortedCats = [...categories].sort((a, b) => {
      // "materia prima" siempre va primero
      if (typeof a === "string" && a === DEFAULT_CATEGORY) return -1;
      if (typeof b === "string" && b === DEFAULT_CATEGORY) return 1;

      // "otros" va después de "materia prima" pero antes que otras categorías regulares
      if (typeof a === "string" && a === OTHERS_CATEGORY) {
        return typeof b === "string" && b === DEFAULT_CATEGORY ? 1 : -1;
      }
      if (typeof b === "string" && b === OTHERS_CATEGORY) {
        return typeof a === "string" && a === DEFAULT_CATEGORY ? 1 : 1;
      }

      // Categorías recurrentes (objetos) van después de categorías predeterminadas pero antes que otras
      if (
        typeof a === "object" &&
        typeof b === "string" &&
        b !== DEFAULT_CATEGORY &&
        b !== OTHERS_CATEGORY
      )
        return -1;
      if (
        typeof b === "object" &&
        typeof a === "string" &&
        a !== DEFAULT_CATEGORY &&
        a !== OTHERS_CATEGORY
      )
        return 1;

      // Para el resto, mantener el orden original
      return 0;
    });

    if (!searchTerm) {
      // Si no hay término de búsqueda, mostramos todas las categorías ordenadas
      setFilteredCategories(sortedCats);
    } else {
      // Filtrar por término de búsqueda
      const filtered = sortedCats.filter((category) => {
        const categoryName =
          typeof category === "object" ? Object.keys(category)[0] : category;
        return categoryName.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredCategories(filtered);
    }
  }, [categories, searchTerm]);

  // Función para verificar si la categoría seleccionada es recurrente
  const checkAndSetRecurringType = (categoryName, categoryArray) => {
    // Para la categoría "otros", siempre mostrar inputs personalizados
    if (categoryName === OTHERS_CATEGORY) {
      setShowRecurringItems(false);
      if (onCategoryTypeChange) {
        onCategoryTypeChange(false);
      }
      if (onShowCustomInputs) {
        onShowCustomInputs(true);
      }
      return;
    }

    for (const category of categoryArray) {
      if (typeof category === "object") {
        const key = Object.keys(category)[0];
        if (key === categoryName) {
          setSelectedRecurringItems(category[key]);
          setShowRecurringItems(true);
          if (onCategoryTypeChange) {
            onCategoryTypeChange(true);
          }
          if (onShowCustomInputs) {
            onShowCustomInputs(false);
          }
          return;
        }
      }
    }

    // Si llegamos aquí, no es una categoría recurrente ni "otros"
    setShowRecurringItems(false);
    if (onCategoryTypeChange) {
      onCategoryTypeChange(false);
    }
    if (onShowCustomInputs) {
      onShowCustomInputs(false);
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

  // Función para guardar una categoría predeterminada en la base de datos si no existe
  const saveDefaultCategoryIfNeeded = async (categoryName) => {
    if (!empresaId) return;

    // Solo ejecutamos esto si están usando una categoría predeterminada y no está en la BD
    if (
      (categoryName === DEFAULT_CATEGORY || categoryName === OTHERS_CATEGORY) &&
      !isCategoryInArray(categoryName, categories)
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
        if (!isCategoryInArray(categoryName, existingCategories)) {
          const updatedCategories = [categoryName, ...existingCategories];

          // Actualizar en Firestore
          await updateDoc(docRef, {
            "config.gastosCategories": updatedCategories,
          });

          console.log(
            `Categoría "${categoryName}" guardada en la base de datos`
          );
        }
      } catch (error) {
        console.error(`Error al guardar categoría ${categoryName}:`, error);
      }
    }
  };

  // Llamamos a esta función cada vez que la categoría seleccionada cambia a una predeterminada
  useEffect(() => {
    if (
      (formData.category === DEFAULT_CATEGORY ||
        formData.category === OTHERS_CATEGORY) &&
      empresaId
    ) {
      saveDefaultCategoryIfNeeded(formData.category);
    }
  }, [formData.category, empresaId]);

  // Manejar selección de categoría
  const handleCategorySelect = (category) => {
    // Determinar si es una categoría simple o recurrente
    let categoryName;
    let items = [];
    let isRecurring = false;
    let isOthers = false;

    if (typeof category === "string") {
      categoryName = category;
      isOthers = categoryName === OTHERS_CATEGORY;
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

    // Notificar al componente padre si debe mostrar inputs personalizados
    if (onShowCustomInputs) {
      onShowCustomInputs(isOthers);
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

  // Para debuggear - imprimir las categorías en consola
  console.log("Categorías disponibles:", categories);
  console.log("Categorías filtradas:", filteredCategories);

  return (
    <div className="section w-full relative mb-4 z-0">
      <p className="text-xl my-2 px-4 ">Categoría</p>

      {categories.length === 0 ? (
        // Mensaje cuando no hay categorías (aunque siempre debería haber al menos las predeterminadas)
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
          {/* Buscador de categorías */}
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
                placeholder="Buscar categoría"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent outline-none"
              />
            </div>
          </div>

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

            {filteredCategories.map((category, index) => {
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
                </div>
              );
            })}
          </div>

          {/* Mostrar ítems recurrentes si la categoría seleccionada tiene ítems */}
          {showRecurringItems && selectedRecurringItems.length > 0 && (
            <div className="mt-4">
              <p className="text-xl my-2 px-4">Selecciona un ítem</p>
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
