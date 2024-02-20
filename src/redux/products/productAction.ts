import { ProductStateProps } from './productReducer';

export const readProductsAll = (products: ProductStateProps[]) => {
  return {
    type: 'READ_PRODUCTS',
    payload: products,
  };
};
