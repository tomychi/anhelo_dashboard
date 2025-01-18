export const CATEGORIAS = [
    'ingredientes',
    'packaging',
    'cocina',
    'bebidas',
    'limpieza',
    'flete',
  ] as const;
  
  export const UNIDADES = [
    'unidad',
    'kg',
    'lts',
    'mts',
    'x100',
    'bolsas',
    'envio',
  ] as const;
  
  export type CategoriaType = typeof CATEGORIAS[number];
  export type UnidadType = typeof UNIDADES[number];