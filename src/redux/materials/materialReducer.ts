import { ProductoMaterial } from '../../types/types';

interface MaterialAction {
  type: string;
  payload?: ProductoMaterial[];
  // Otros campos específicos de tu acción, si los hay
}

export interface MaterialState {
  materiales: ProductoMaterial[];
}

const initialState: MaterialState = {
  materiales: [],
};

const materialsReducer = (state = initialState, action: MaterialAction) => {
  switch (action.type) {
    case 'READ_MATERIALS': {
      const materiales = action.payload;

      return {
        ...state,
        materiales,
      };
    }
    default:
      return state;
  }
};

export default materialsReducer;
