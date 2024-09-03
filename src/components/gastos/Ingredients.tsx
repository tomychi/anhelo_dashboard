import { useState } from 'react';
import { ProductoMaterial } from '../../types/types';
import { addIngredientsToBurger } from '../../firebase/ReadData';
import Swal from 'sweetalert2';
import { DocumentData } from 'firebase/firestore';

interface IngredientsProps {
  selectedProduct: DocumentData;
  setModalOpen: (value: boolean) => void;
  materiales: ProductoMaterial[];
}

export const Ingredients = ({
  selectedProduct,
  setModalOpen,
  materiales,
}: IngredientsProps) => {
  // Crear un mapa para inicializar el estado local
  const mapa = new Map<string, number>();
  if (materiales) {
    materiales.forEach((m) => {
      if (
        selectedProduct.ingredients &&
        selectedProduct.ingredients[m.nombre]
      ) {
        mapa.set(m.nombre, selectedProduct.ingredients[m.nombre]);
      } else {
        mapa.set(m.nombre, 0);
      }
    });
  }

  // Usar useState con el mapa inicializado
  const [selectMaterial, setSelectMaterial] =
    useState<Map<string, number>>(mapa);

  // Si selectedProduct.ingredients o materiales no están definidos, mostrar un mensaje de error
  if (!selectedProduct.ingredients) {
    return (
      <div>
        Error: No se encontraron ingredientes para el producto seleccionado.
      </div>
    );
  }

  if (!materiales || materiales.length === 0) {
    return <div>Error: No se encontraron materiales disponibles.</div>;
  }

  // Función para manejar cambios en los inputs
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    materialName: string
  ) => {
    const newValue = event.target.value.trim(); // Eliminamos espacios en blanco alrededor
    const intValue = newValue === '' ? 0 : parseInt(newValue); // Convertimos a entero o establecemos 0 si está vacío
    setSelectMaterial((prevMaterial) => {
      const newMaterial = new Map(prevMaterial);
      newMaterial.set(materialName, intValue >= 0 ? intValue : 0); // Solo establecemos el valor si es un número válido
      return newMaterial;
    });
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black z-50">
      <div className="bg-white p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">{selectedProduct.name}</h2>
        <p>Ingredientes:</p>
        <ul>
          {Object.entries(selectedProduct.ingredients).map(
            ([ingredient, quantity]) => (
              <li key={ingredient}>{`${ingredient}: ${quantity}`}</li>
            )
          )}
        </ul>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded-md mt-4 cursor-pointer"
          onClick={() => setModalOpen(false)}
        >
          Cerrar
        </button>
        <div className="fixed inset-y-0 left-0 flex justify-end items-center">
          <div className="bg-white p-8 rounded-lg">
            {materiales.map((m: ProductoMaterial) => (
              <ul key={m.id}>
                <div className="relative z-0">
                  <input
                    className="text-black bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 w-6"
                    type="number"
                    id={m.nombre}
                    name={m.nombre}
                    value={Number(selectMaterial.get(m.nombre)).toString()}
                    onChange={(e) => handleInputChange(e, m.nombre)}
                  />
                  <label htmlFor={m.nombre} className="">
                    {m.nombre}
                  </label>
                </div>
              </ul>
            ))}
          </div>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-md mt-4 cursor-pointer"
            onClick={() => {
              const ingredientesSeleccionados = new Map(
                [...selectMaterial].filter(([, cantidad]) => cantidad > 0)
              );

              addIngredientsToBurger(
                selectedProduct.id,
                ingredientesSeleccionados
              )
                .then((result) => {
                  const ingredientesText = Object.entries(result)
                    .map(
                      ([ingrediente, cantidad]) => `${ingrediente}: ${cantidad}`
                    )
                    .join('\n');

                  Swal.fire({
                    icon: 'success',
                    title: `Ingredientes actualizados`,
                    text: `Los ingredientes se cargaron correctamente:\n${ingredientesText}`,
                  });
                })
                .catch((error) => {
                  Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: `Hubo un error al cargar los ingredientes: ${error}`,
                  });
                });
              setModalOpen(false);
            }}
          >
            Actualizar
          </button>
        </div>
      </div>
    </div>
  );
};
