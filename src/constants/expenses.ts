export const CATEGORIAS = [
  'materia prima',
  'cocina y produccion',
  'limpieza',
  'flete',
  'cadeteria',
  'infraestructura',
  'marketing'
] as const;

export const UNIDADES = [
  'unidad',
  'kg',
  'lts',
  'mts',
  'x100',
  'bolsas',
  'envio',
  "horas"
] as const;

export const ESTADOS = ['pendiente', 'pagado'] as const;

export type CategoriaType = typeof CATEGORIAS[number];
export type UnidadType = typeof UNIDADES[number];
export type EstadoType = typeof ESTADOS[number];

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