// Función para convertir entre diferentes unidades de medida
export const convertirUnidades = (valor, unidadOrigen, unidadDestino) => {
  // Normalizar unidades a minúsculas para evitar problemas de coincidencia
  unidadOrigen = unidadOrigen.toLowerCase();
  unidadDestino = unidadDestino.toLowerCase();

  // Si las unidades son iguales, no se necesita conversión
  if (unidadOrigen === unidadDestino) {
    return valor;
  }

  // Tabla de conversiones a unidades base (gramos o mililitros)
  const factoresDeConversion = {
    // Unidades de masa
    kg: 1000, // 1 kg = 1000 g
    g: 1, // Unidad base para masa
    mg: 0.001, // 1 mg = 0.001 g

    // Unidades de volumen
    l: 1000, // 1 l = 1000 ml
    ml: 1, // Unidad base para volumen
    cl: 10, // 1 cl = 10 ml

    // Unidades individuales
    unidad: 1, // No hay conversión para unidades individuales
  };

  // Verificar que las unidades existan en nuestra tabla
  if (
    !factoresDeConversion[unidadOrigen] ||
    !factoresDeConversion[unidadDestino]
  ) {
    throw new Error(
      `Conversión de ${unidadOrigen} a ${unidadDestino} no soportada`
    );
  }

  // Verificar que las unidades sean del mismo tipo (masa o volumen)
  const tipoOrigen = getTipoUnidad(unidadOrigen);
  const tipoDestino = getTipoUnidad(unidadDestino);

  if (tipoOrigen !== tipoDestino) {
    throw new Error(
      `No se puede convertir entre diferentes tipos de unidades: ${tipoOrigen} a ${tipoDestino}`
    );
  }

  // Convertir a la unidad base y luego a la unidad de destino
  const valorEnUnidadBase = valor * factoresDeConversion[unidadOrigen];
  const resultado = valorEnUnidadBase / factoresDeConversion[unidadDestino];

  return resultado;
};

// Función para determinar el tipo de unidad (masa, volumen o unidad)
const getTipoUnidad = (unidad) => {
  unidad = unidad.toLowerCase();

  if (["kg", "g", "mg"].includes(unidad)) {
    return "masa";
  } else if (["l", "ml", "cl"].includes(unidad)) {
    return "volumen";
  } else if (unidad === "unidad") {
    return "unidad";
  }

  throw new Error(`Unidad desconocida: ${unidad}`);
};

// Función para calcular el costo actualizado de un material derivado
export const calcularCostoMaterialDerivado = (
  costoTotal, // Costo total de la compra
  cantidadCompra, // Cantidad comprada (ej: 10)
  unidadCompra, // Unidad de la compra (ej: "kg")
  medidaMaterial, // Medida del material derivado (ej: 80)
  unidadMaterial // Unidad del material derivado (ej: "g")
) => {
  try {
    // Obtener la cantidad total en la unidad del material derivado
    const cantidadTotalEnUnidadMaterial = convertirUnidades(
      cantidadCompra,
      unidadCompra,
      unidadMaterial
    );

    // Calcular cuántas unidades del material derivado se pueden hacer
    const unidadesMaterialDerivado =
      cantidadTotalEnUnidadMaterial / medidaMaterial;

    // Calcular el costo por unidad del material derivado
    const costoPorUnidad = costoTotal / unidadesMaterialDerivado;

    return {
      costoPorUnidad: Math.round(costoPorUnidad * 100) / 100, // Redondear a 2 decimales
      unidadesMaterialDerivado: Math.floor(unidadesMaterialDerivado), // Cantidad entera de unidades
      cantidadTotalConvertida: cantidadTotalEnUnidadMaterial,
    };
  } catch (error) {
    console.error("Error al calcular costo de material derivado:", error);
    throw error;
  }
};
