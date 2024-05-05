export interface User {
  uid: string;
  email: string;
}

export interface UserState {
  user: User;
  isAuth: boolean;
}
interface AuthAction {
  type: string;
  payload?: UserState;
  // Otros campos específicos de tu acción, si los hay
}

const initialState = {
  user: {
    uid: '',
    email: '',
  },
  isAuth: false,
  // Otros campos relacionados con la autenticación
};

const authReducer = (state = initialState, action: AuthAction) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuth: true,
        user: action.payload,
      };
    // Otros casos para manejar acciones adicionales, como cierre de sesión, etc.
    default:
      return state;
  }
};

export default authReducer;
