import { DocumentData } from 'firebase/firestore';

export interface ProductStateProps {
  data: DocumentData;
  id: string;
  collectionName: string;
}

interface ProductAction {
  type: string;
  payload?: ProductStateProps[];
  // Otros campos específicos de tu acción, si los hay
}

export interface ProductState {
  burgers: ProductStateProps[];
  drinks: ProductStateProps[];
  toppings: ProductStateProps[];
  fries: ProductStateProps[];
}

const initialState: ProductState = {
  burgers: [],
  drinks: [],
  toppings: [],
  fries: [],
};

const productReducer = (state = initialState, action: ProductAction) => {
  switch (action.type) {
    case 'READ_PRODUCTS': {
      const burgers = action.payload?.filter(
        (p) => p.collectionName === 'burgers'
      );
      const drinks = action.payload?.filter(
        (p) => p.collectionName === 'drinks'
      );
      const toppings = action.payload?.filter(
        (p) => p.collectionName === 'toppings'
      );

      const fries = action.payload?.filter((p) => p.collectionName === 'fries');

      return {
        ...state,
        burgers,
        drinks,
        toppings,
        fries,
      };
    }
    default:
      return state;
  }
};

export default productReducer;
