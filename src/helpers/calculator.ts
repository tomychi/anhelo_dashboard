import { ExpenseProps } from "../firebase/UploadGasto";
import { PedidoProps, ProductoMaterial } from "../types/types";

export interface BurgersPedidas {
  burger: string;
  quantity: number;
  hora: string;
}

export const calcularTotales = (
  ordersData: (PedidoProps | ExpenseProps)[],
): {
  facturacionTotal: number;
  totalProductosVendidos: number;
  productosPedidos: BurgersPedidas[];
} => {
  if (ordersData.length === 0) {
    return {
      facturacionTotal: 0,
      totalProductosVendidos: 0,
      productosPedidos: [],
    };
  }

  // Objeto temporal para realizar el seguimiento de las hamburguesas y sus cantidades acumuladas
  const hamburguesasMap: {
    [burger: string]: { quantity: number; hora: string };
  } = {};

  // Función para sumar las cantidades de hamburguesas
  const sumarCantidades = (burger: string, quantity: number, hora: string) => {
    if (hamburguesasMap[burger]) {
      hamburguesasMap[burger].quantity += quantity;
      hamburguesasMap[burger].hora = hora;
    } else {
      hamburguesasMap[burger] = { quantity, hora };
    }
  };

  // Iterar sobre los pedidos y gastos para calcular los totales y las hamburguesas pedidas
  const { facturacionTotal, totalProductosVendidos } = ordersData.reduce(
    (totals, order) => {
      if ("detallePedido" in order) {
        // Solo procesar si el pedido no está cancelado
        if (!order.canceled) {
          // Si es un PedidoProps, suma el total de facturación y la cantidad de productos vendidos
          totals.facturacionTotal += order.total || 0;
          totals.totalProductosVendidos += order.detallePedido.reduce(
            (accumulator, detail) => {
              // Acumula la cantidad de productos vendidos y agrega cada hamburguesa al objeto hamburguesasMap
              sumarCantidades(detail.burger, detail.quantity, order.hora);
              // Si es una hamburguesa 2x1, suma una cantidad adicional
              const additionalQuantity = detail.burger.includes("2x1")
                ? detail.quantity
                : 0;
              return accumulator + detail.quantity + additionalQuantity;
            },
            0,
          );
        }
      } else {
        // Si es un ExpenseProps, suma el total de facturación y la cantidad directamente
        totals.facturacionTotal += order.total || 0;
        totals.totalProductosVendidos += order.quantity || 0;
      }
      return totals;
    },
    { facturacionTotal: 0, totalProductosVendidos: 0 },
  );

  // Crear un arreglo con los objetos de hamburguesas y cantidades acumuladas
  const productosPedidos = Object.entries(hamburguesasMap).map(
    ([burger, { quantity, hora }]) => ({
      burger,
      quantity,
      hora,
    }),
  );

  return { facturacionTotal, totalProductosVendidos, productosPedidos };
};
































export const calculateUnitCost = (
  total: number,
  quantity: number,
  unidadPorPrecio: number,
  unit: string,
  name: string,
): number => {
  if (name === "tomate") {
    // Para el caso del tomate, simplemente dividimos el total por la cantidad de fetas
    return Math.ceil((total / (quantity * unidadPorPrecio)) * 2);
  }

  // Si la unidad es 'kg', convertimos la cantidad a gramos
  if (unit === "kg") {
    quantity *= 1000; // Convertimos kg a gramos
    // Calculamos la cantidad de hamburguesas que se pueden hacer con la cantidad de ingrediente proporcionada
    const hamburguesasPorCantidad = quantity / unidadPorPrecio;

    // Calculamos el costo unitario dividiendo el total pagado por la cantidad de hamburguesas que se pueden hacer
    const costoUnitario = total / hamburguesasPorCantidad;

    // Redondeamos hacia arriba y devolvemos el costo unitario
    return Math.ceil(costoUnitario);
  }

  return Math.ceil(total / quantity / unidadPorPrecio);
};

export const calcularCostoHamburguesa = (
  materiales: ProductoMaterial[],
  ingredientes: Record<string, number>,
): number => {
  if (!ingredientes) {
    console.error("El objeto 'ingredientes' es null o undefined.");
    return 0;
  }

  let costoTotal = 0;

  // Iterar sobre las entradas del objeto ingredientes
  for (const [nombre, cantidad] of Object.entries(ingredientes)) {
    // Buscar el ingrediente en la lista de materiales
    const ingrediente = materiales.find((item) => item.nombre === nombre);
    if (ingrediente) {
      // Calcular el costo del ingrediente y sumarlo al costo total
      const costoIngrediente = ingrediente.costo * cantidad;
      costoTotal += costoIngrediente;
    } else {
      console.error(
        `No se encontró el ingrediente ${nombre} en la lista de materiales.`,
      );
    }
  }

  return costoTotal;
};
