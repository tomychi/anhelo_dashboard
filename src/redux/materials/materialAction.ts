import { ProductoMaterial } from '../../types/types';

export const readMaterialsAll = (materials: ProductoMaterial[]) => {
  return {
    type: 'READ_MATERIALS',
    payload: materials,
  };
};
