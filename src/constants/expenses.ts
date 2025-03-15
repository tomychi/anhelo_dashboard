// constants/expenses.ts
export const UNIDADES_BASICAS = [
  "unidad",
  "kg", // kilogramo
  "g", // gramo
  "l", // litro (reemplaza "lts")
  "ml", // mililitro
  "m", // metro (reemplaza "mts")
  "cm", // centímetro
  "hora", // hora (singular)
] as const;

// Para mantener compatibilidad con código existente
export const UNIDADES = [...UNIDADES_BASICAS] as const;

export const ESTADOS = ["pendiente", "pagado"] as const;

// Tipos originales
export type UnidadBasicaType = (typeof UNIDADES_BASICAS)[number];
export type UnidadType = UnidadBasicaType | string; // Ahora acepta cualquier string para unidades personalizadas
export type EstadoType = (typeof ESTADOS)[number];

// Tipo para categorías
export type CategoriaType = string;

// Interface para gastos
export interface ExpenseProps {
  // Campos requeridos
  name: string;
  quantity: number;
  unit: UnidadType;
  total: number;
  fecha: string;
  estado: EstadoType;
  category: CategoriaType;

  // Campo opcional
  description?: string;

  // Campo generado automáticamente
  id: string;
}
