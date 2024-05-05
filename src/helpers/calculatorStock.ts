import { updateMaterialStock } from '../firebase/Materiales';
import { ProductStateProps } from '../redux/products/productReducer';
import { ProductoMaterial } from '../types/types';
import { BurgersPedidas } from './calculator';

interface ToppingCounts {
  [topping: string]: number;
}

interface ToppingsProp {
  name: string;
  quantity: number;
}

interface ProductUsadosProps {
  toppingsData: ToppingsProp[];
  productosPedidos: BurgersPedidas[];
  burgers: ProductStateProps[];
  materiales: ProductoMaterial[];
}

export const prdocutosUsados = ({
  toppingsData,
  productosPedidos,
  burgers,
  materiales,
}: ProductUsadosProps) => {
  const totalToppingsQuantity = toppingsData.reduce(
    (totals: ToppingCounts, topping: ToppingsProp) => {
      // Verificar si ya existe una entrada para este tipo de topping
      if (topping.name in totals) {
        // Si existe, aumentar la cantidad
        totals[topping.name] += topping.quantity;
      } else {
        // Si no existe, crear una nueva entrada con la cantidad de este tipo de topping
        totals[topping.name] = topping.quantity;
      }
      return totals;
    },
    {}
  );

  // Definir una interfaz para el tipo de datos de los productos pedidos

  interface ProductData {
    burger: string;
    quantity: number;
  }

  interface TotalProps {
    [ingredient: string]: number;
  }

  const totalIngredientesUtilizados = productosPedidos.reduce(
    (total: TotalProps, producto: ProductData) => {
      // Verificar si el producto es una hamburguesa
      const hamburguesa = burgers.find(
        (burger: ProductStateProps) => burger.data.name === producto.burger
      );
      if (hamburguesa) {
        // Obtener los ingredientes de la hamburguesa
        const ingredientes = hamburguesa.data.ingredients;

        // Sumar la cantidad de cada ingrediente multiplicado por la cantidad de hamburguesas pedidas
        for (const ingrediente in ingredientes) {
          if (Object.prototype.hasOwnProperty.call(ingredientes, ingrediente)) {
            total[ingrediente] =
              (total[ingrediente] || 0) +
              ingredientes[ingrediente] * producto.quantity;
          }
        }
      }
      return total;
    },
    {} as { [ingredient: string]: number }
  );

  // Combinar los objetos totalToppingsQuantity y totalIngredientesUtilizados
  const totalToppingsAndIngredients: { [key: string]: number } = {
    ...totalToppingsQuantity,
  };

  // Iterar sobre los ingredientes utilizados y agregarlos al objeto combinado
  for (const ingrediente in totalIngredientesUtilizados) {
    if (ingrediente in totalIngredientesUtilizados) {
      if (ingrediente in totalToppingsAndIngredients) {
        // Si el ingrediente ya existe en totalToppingsAndIngredients, sumar las cantidades
        totalToppingsAndIngredients[ingrediente] +=
          totalIngredientesUtilizados[ingrediente];
      } else {
        // Si el ingrediente no existe, simplemente agregarlo al objeto combinado
        totalToppingsAndIngredients[ingrediente] =
          totalIngredientesUtilizados[ingrediente];
      }
    }
  }

  // Llamar a la función para actualizar el stock de ingredientes
  const ingredientesUtilizados = Object.keys(totalToppingsAndIngredients);

  for (const ingrediente of ingredientesUtilizados) {
    const cantidadUtilizada = totalToppingsAndIngredients[ingrediente];
    let nombreFiltrado = ingrediente
      .replace(/\b(salsa|caramelizada)\b/gi, '')
      .trim();

    // Manejar el caso específico de "salsa anhelo" que debe convertirse en "alioli"
    if (ingrediente.toLowerCase().includes('salsa anhelo')) {
      nombreFiltrado = 'alioli';
    }
    try {
      // Buscar el ID del ingrediente por su nombre
      const ingredienteId = materiales.find(
        (m) => m.nombre === nombreFiltrado
      )?.id;

      let ingredienteUnit = materiales.find(
        (m) => m.nombre === nombreFiltrado
      )?.unit;

      if (ingredienteUnit === undefined) {
        ingredienteUnit = '';
      }

      if (ingredienteId) {
        // Llamar a la función para actualizar el stock de ingredientes
        updateMaterialStock(ingredienteId, cantidadUtilizada, ingredienteUnit);
      } else {
        console.error(
          `No se encontró el ID del ingrediente con nombre ${ingrediente}`
        );
      }
    } catch (error) {
      console.error('Error actualizando el stock del ingrediente:', error);
    }
  }
};
