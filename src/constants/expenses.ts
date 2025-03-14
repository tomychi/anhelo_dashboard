// constants/expenses.ts

// Mantenemos los arrays originales por compatibilidad
export const CATEGORIAS = [
  "materia prima",
  "cocina y produccion",
  "extra",
  "legalidad",
  "cadeteria",
  "infraestructura",
  "marketing",
] as const;

export const UNIDADES = [
  "unidad",
  "kg",
  "lts",
  "mts",
  "x100",
  "bolsas",
  "envio",
  "horas",
] as const;

export const ESTADOS = ["pendiente", "pagado"] as const;

// Tipos originales
export type OriginalCategoriaType = (typeof CATEGORIAS)[number];
export type UnidadType = (typeof UNIDADES)[number];
export type EstadoType = (typeof ESTADOS)[number];

// Nuevo tipo que extiende el tipo original para permitir strings (categorías personalizadas)
export type CategoriaType = OriginalCategoriaType | string;

// Interface actualizada
export interface ExpenseProps {
  // Campos requeridos
  name: string;
  quantity: number;
  unit: UnidadType;
  total: number;
  fecha: string;
  estado: EstadoType;
  category: CategoriaType; // Ahora acepta cualquier string

  // Campo opcional
  description?: string;

  // Campo generado automáticamente
  id: string;
}
