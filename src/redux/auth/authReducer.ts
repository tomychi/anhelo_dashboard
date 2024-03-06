export interface UserState {
  uid?: string;
  email?: string | null | undefined;
}
interface AuthAction {
  type: string;
  payload?: UserState;
  // Otros campos específicos de tu acción, si los hay
}

const initialState = {
  user: null,
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
