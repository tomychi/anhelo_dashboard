// reducers/authReducer.js

const initialState = {
  user: null,
  isAuth: false,
  // Otros campos relacionados con la autenticación
};

export interface UserAuth {
  uid?: string;
  displayName?: string | null | undefined;
}
interface AuthAction {
  type: string;
  payload?: UserAuth;
  // Otros campos específicos de tu acción, si los hay
}

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
