import React, { useState, useEffect } from "react";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/configureStore";

// Categorías predeterminadas que siempre deben estar disponibles
const DEFAULT_CATEGORIES = [
  {
    nombre: "materia prima",
    periodicidad: 1,
    items: [],
  },
  {
    nombre: "otros",
    periodicidad: 1,
    items: [],
  },
];

// Componente para mostrar y gestionar las categorías
export const CategoriaSelector = ({
  selectedCategory,
  onCategoryChange,
  formData,
  setFormData,
  onAddCategory, // Prop para manejar "Agregar categoría"
  onCategoryTypeChange, // Prop para informar si la categoría es recurrente
  onLoadingChange, // Prop para informar estado de carga
  onShowCustomInputs, // Prop para mostrar/ocultar inputs personalizados
  onAddItemToCategory, // Prop para manejar agregar ítems a una categoría
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecurringItems, setSelectedRecurringItems] = useState([]);
  const [showRecurringItems, setShowRecurringItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [showAddItemInput, setShowAddItemInput] = useState(false);

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
        setLoading(true);
        const firestore = getFirestore();
        let docRef = doc(firestore, "absoluteClientes", empresaId);

        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          let categoriesFromDB = [];

          // Primero verificamos si hay un formato nuevo
          if (data.config && data.config.gastosCategories) {
            // Asegurarse de que todas las categorías tengan la estructura correcta
            categoriesFromDB = data.config.gastosCategories.map((cat) => {
              // Si ya tiene la estructura correcta
              if (cat && typeof cat === "object" && "nombre" in cat) {
                return {
                  nombre: cat.nombre || "",
                  periodicidad: cat.periodicidad || 1,
                  items: Array.isArray(cat.items) ? cat.items : [],
                };
              }
              // Si es una string (formato antiguo)
              else if (typeof cat === "string") {
                return {
                  nombre: cat,
                  periodicidad: 1,
                  items: [],
                };
              }
              // Si es un objeto con otro formato antiguo {key: [items]}
              else if (cat && typeof cat === "object") {
                const key = Object.keys(cat)[0];
                return {
                  nombre: key || "",
                  periodicidad: 1,
                  items: Array.isArray(cat[key]) ? cat[key] : [],
                };
              }

              // En caso de formato no reconocido, devolver un objeto válido
              console.warn("Formato de categoría no reconocido:", cat);
              return {
                nombre: "",
                periodicidad: 1,
                items: [],
              };
            });
          } else if (data.gastosCategory && data.gastosCategory.length > 0) {
            // Convertir formato antiguo al nuevo formato si es necesario
            categoriesFromDB = data.gastosCategory.map((cat) => {
              if (typeof cat === "string") {
                return {
                  nombre: cat,
                  periodicidad: 1,
                  items: [],
                };
              } else if (cat && typeof cat === "object") {
                const key = Object.keys(cat)[0];
                return {
                  nombre: key || "",
                  periodicidad: 1,
                  items: Array.isArray(cat[key]) ? cat[key] : [],
                };
              }

              // En caso de formato no reconocido
              console.warn("Formato de categoría no reconocido:", cat);
              return {
                nombre: "",
                periodicidad: 1,
                items: [],
              };
            });
          } else {
            categoriesFromDB = [];
          }

          // Asegurar que las categorías predeterminadas estén incluidas
          let updatedCategories = [...categoriesFromDB];

          // Verificar y añadir categorías predeterminadas si no existen
          DEFAULT_CATEGORIES.forEach((defaultCat) => {
            if (
              !updatedCategories.some((cat) => cat.nombre === defaultCat.nombre)
            ) {
              updatedCategories.push(defaultCat);
              console.log(
                `Categoría "${defaultCat.nombre}" añadida localmente`
              );
            }
          });

          console.log("[DEBUG] Categorías cargadas:", updatedCategories);
          setCategories(updatedCategories);

          // Si la categoría seleccionada no está en la lista, seleccionamos la primera
          if (
            updatedCategories.length > 0 &&
            !isCategoryInArray(formData.category, updatedCategories)
          ) {
            const firstCategory = updatedCategories[0];

            console.log(
              "[DEBUG] Seleccionando primera categoría:",
              firstCategory.nombre
            );

            setFormData((prev) => ({
              ...prev,
              category: firstCategory.nombre,
            }));

            // Si es una categoría recurrente, configuramos el array de items
            if (firstCategory.items && firstCategory.items.length > 0) {
              setSelectedRecurringItems(firstCategory.items);
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
              if (firstCategory.nombre === "otros" && onShowCustomInputs) {
                console.log(
                  "[DEBUG] Activando inputs personalizados al cargar 'otros'"
                );
                onShowCustomInputs(true);
              } else if (onShowCustomInputs) {
                onShowCustomInputs(false);
              }
            }
          } else {
            // Verificar si la categoría seleccionada es recurrente
            checkAndSetRecurringType(formData.category, updatedCategories);

            // Verificar si la categoría seleccionada es "otros"
            if (formData.category === "otros" && onShowCustomInputs) {
              console.log(
                "[DEBUG] Activando inputs personalizados porque ya tenía seleccionado 'otros'"
              );
              onShowCustomInputs(true);
            } else if (onShowCustomInputs) {
              onShowCustomInputs(false);
            }
          }
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
        // En caso de error, asegurar las categorías predeterminadas
        setCategories(DEFAULT_CATEGORIES);
        if (onCategoryTypeChange) {
          onCategoryTypeChange(false);
        }
        // Si la categoría seleccionada es "otros", mostrar inputs personalizados
        if (formData.category === "otros" && onShowCustomInputs) {
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
      setCategories(DEFAULT_CATEGORIES);
      setLoading(false);
      // Notificar al componente padre que la carga ha terminado
      if (onLoadingChange) {
        onLoadingChange(false);
      }
      if (onCategoryTypeChange) {
        onCategoryTypeChange(false);
      }
      // Si la categoría seleccionada es "otros", mostrar inputs personalizados
      if (formData.category === "otros" && onShowCustomInputs) {
        onShowCustomInputs(true);
      } else if (onShowCustomInputs) {
        onShowCustomInputs(false);
      }
    }
  }, [empresaId, isAnhelo]); // Filtrar categorías basadas en término de búsqueda
  useEffect(() => {
    // Ordenar categorías antes de filtrar
    const sortedCats = [...categories].sort((a, b) => {
      // "materia prima" siempre va primero
      if (a.nombre === "materia prima") return -1;
      if (b.nombre === "materia prima") return 1;

      // "otros" va después de "materia prima" pero antes que otras categorías
      if (a.nombre === "otros") {
        return b.nombre === "materia prima" ? 1 : -1;
      }
      if (b.nombre === "otros") {
        return a.nombre === "materia prima" ? 1 : 1;
      }

      // Categorías con items van después de categorías predeterminadas pero antes que otras
      const aHasItems = a.items && a.items.length > 0;
      const bHasItems = b.items && b.items.length > 0;

      if (
        aHasItems &&
        !bHasItems &&
        b.nombre !== "materia prima" &&
        b.nombre !== "otros"
      )
        return -1;
      if (
        bHasItems &&
        !aHasItems &&
        a.nombre !== "materia prima" &&
        a.nombre !== "otros"
      )
        return 1;

      // Para el resto, orden alfabético
      return a.nombre.localeCompare(b.nombre);
    });

    if (!searchTerm) {
      // Si no hay término de búsqueda, mostramos todas las categorías ordenadas
      setFilteredCategories(sortedCats);
    } else {
      // Filtrar por término de búsqueda
      const filtered = sortedCats.filter((category) => {
        return category.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredCategories(filtered);
    }
  }, [categories, searchTerm]);

  // Función para verificar si la categoría seleccionada es recurrente
  const checkAndSetRecurringType = (categoryName, categoryArray) => {
    // Para la categoría "otros", siempre mostrar inputs personalizados
    if (categoryName === "otros") {
      console.log("[DEBUG] checkAndSetRecurringType: Es categoría 'otros'");
      setShowRecurringItems(false);
      if (onCategoryTypeChange) {
        onCategoryTypeChange(false);
      }
      if (onShowCustomInputs) {
        console.log(
          "[DEBUG] checkAndSetRecurringType: Activando inputs personalizados"
        );
        onShowCustomInputs(true);
      }
      return;
    }

    const category = categoryArray.find((cat) => cat.nombre === categoryName);

    if (category && category.items && category.items.length > 0) {
      setSelectedRecurringItems(category.items);
      setShowRecurringItems(true);
      if (onCategoryTypeChange) {
        onCategoryTypeChange(true);
      }
      if (onShowCustomInputs) {
        onShowCustomInputs(false);
      }
      return;
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

  // Verificar si una categoría existe en el array
  const isCategoryInArray = (categoryName, categoryArray) => {
    return categoryArray.some((item) => item.nombre === categoryName);
  };

  // Guardar una categoría predeterminada en la base de datos si no existe
  const saveDefaultCategoryIfNeeded = async (categoryName) => {
    if (!empresaId) return;

    // Solo ejecutamos esto si están usando una categoría predeterminada y no está en la BD
    const isDefault = DEFAULT_CATEGORIES.some(
      (cat) => cat.nombre === categoryName
    );

    if (isDefault && !isCategoryInArray(categoryName, categories)) {
      try {
        console.log("[DEBUG] Intentando guardar categoría:", categoryName);
        const firestore = getFirestore();
        const docRef = doc(firestore, "absoluteClientes", empresaId);

        // Obtener las categorías actuales
        const docSnap = await getDoc(docRef);
        let existingCategories = [];

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.config && data.config.gastosCategories) {
            existingCategories = data.config.gastosCategories;
          }
        }

        // Añadir la categoría predeterminada si no existe
        if (!isCategoryInArray(categoryName, existingCategories)) {
          const defaultCategory = DEFAULT_CATEGORIES.find(
            (cat) => cat.nombre === categoryName
          );
          const updatedCategories = [defaultCategory, ...existingCategories];

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

  // Manejar selección de categoría
  const handleCategorySelect = (category) => {
    // Ocultar el input de agregar ítem al cambiar de categoría
    setShowAddItemInput(false);

    const categoryName = category.nombre;
    const items = category.items || [];
    const isRecurring = items.length > 0;
    const isOthers = categoryName === "otros";

    console.log("[DEBUG] Categoría seleccionada:", categoryName);
    console.log("[DEBUG] Es categoría 'otros':", isOthers);

    // Actualizar formData
    setFormData((prev) => ({
      ...prev,
      category: categoryName,
    }));

    // Si es recurrente y hay items, seleccionamos el primero
    if (isRecurring) {
      setSelectedRecurringItems(items);
      setShowRecurringItems(true);

      if (items.length > 0) {
        setFormData((prev) => ({
          ...prev,
          name: items[0], // Seleccionar el primer item por defecto
        }));
      }
    } else {
      // Si no es recurrente, limpiar el nombre
      setShowRecurringItems(false);
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
      console.log("[DEBUG] ShowCustomInputs se estableció a:", isOthers);
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

  // Mostrar/ocultar el input para agregar ítem
  const toggleAddItemInput = () => {
    setShowAddItemInput(!showAddItemInput);
    setNewItemName("");
  };

  // Agregar un nuevo ítem a la categoría actual
  const handleAddItemToCategory = async () => {
    if (!newItemName.trim() || !empresaId || !formData.category) return;

    try {
      // Encontrar la categoría actual
      const currentCategoryIndex = categories.findIndex(
        (cat) => cat.nombre === formData.category
      );

      if (currentCategoryIndex === -1) {
        console.error("No se encontró la categoría actual");
        return;
      }

      const currentCategory = categories[currentCategoryIndex];

      // Verificar si el ítem ya existe
      if (currentCategory.items.includes(newItemName.trim().toLowerCase())) {
        console.log("El ítem ya existe en esta categoría");
        return;
      }

      // Agregar el nuevo ítem al principio de la lista
      const updatedItems = [
        newItemName.trim().toLowerCase(),
        ...currentCategory.items,
      ];

      // Crear categoría actualizada
      const updatedCategory = {
        ...currentCategory,
        items: updatedItems,
      };

      // Actualizar el estado local
      const updatedCategories = [...categories];
      updatedCategories[currentCategoryIndex] = updatedCategory;

      setCategories(updatedCategories);
      setSelectedRecurringItems(updatedItems);

      // Actualizar en Firestore
      const firestore = getFirestore();
      const docRef = doc(firestore, "absoluteClientes", empresaId);

      await updateDoc(docRef, {
        "config.gastosCategories": updatedCategories,
      });

      console.log(
        `Ítem "${newItemName}" agregado a la categoría "${formData.category}"`
      );

      // Limpiar el input y ocultarlo
      setNewItemName("");
      setShowAddItemInput(false);

      // Seleccionar automáticamente el nuevo ítem
      handleRecurringItemSelect(newItemName.trim().toLowerCase());
    } catch (error) {
      console.error("Error al agregar ítem a la categoría:", error);
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
      <p className="text-xl my-2 px-4 ">Categoría</p>

      {categories.length === 0 ? (
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
              const isSelected = formData.category === category.nombre;
              // Verificar que category.nombre no sea undefined o null
              if (!category || !category.nombre) return null;

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
                  {typeof category.nombre === "string" &&
                  category.nombre.length > 0
                    ? category.nombre.charAt(0).toUpperCase() +
                      category.nombre.slice(1).toLowerCase()
                    : "Categoría"}
                </div>
              );
            })}
          </div>

          {/* Mostrar ítems recurrentes si la categoría seleccionada tiene ítems */}
          {showRecurringItems && (
            <div className="mt-4">
              <p className="text-xl my-2 px-4">Selecciona un ítem</p>

              {/* Input para agregar nuevo ítem */}
              {showAddItemInput && (
                <div className="flex flex-row px-4 gap-2 mb-3">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Nombre del nuevo ítem"
                    className="w-full h-10 px-4 text-xs font-light text-black bg-gray-200 border-gray-300 rounded-lg focus:outline-none focus:ring-0"
                    autoFocus
                  />
                  <button
                    onClick={handleAddItemToCategory}
                    disabled={!newItemName.trim()}
                    className={`px-3 py-2 rounded-lg text-xs flex items-center justify-center whitespace-nowrap ${
                      !newItemName.trim()
                        ? "bg-gray-300 text-gray-500"
                        : "bg-black text-white"
                    }`}
                  >
                    Agregar
                  </button>
                  <button
                    onClick={toggleAddItemInput}
                    className="px-3 py-2 rounded-lg text-xs flex items-center justify-center whitespace-nowrap bg-gray-300 text-black"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              <div className="flex flex-row px-4 gap-2 overflow-x-auto">
                {/* Botón para agregar nuevo ítem */}
                {!showAddItemInput && (
                  <div
                    onClick={toggleAddItemInput}
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
                )}

                {selectedRecurringItems.map((item, index) => {
                  // Asegurarse de que item no es undefined o null
                  if (!item && item !== "") return null;

                  return (
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
                        <path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z" />
                        <path
                          fillRule="evenodd"
                          d="M2 7.5h16l-.811 7.71a2 2 0 0 1-1.99 1.79H4.802a2 2 0 0 1-1.99-1.79L2 7.5ZM7 11a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2H8a1 1 0 0 1-1-1Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {typeof item === "string" && item.length > 0
                        ? item.charAt(0).toUpperCase() +
                          item.slice(1).toLowerCase()
                        : item}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoriaSelector;
