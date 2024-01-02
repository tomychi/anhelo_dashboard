// reducers/authReducer.js

const initialState = {
  user: null,
  isAuth: false,
  // Otros campos relacionados con la autenticación
};

const authReducer = (state = initialState, action) => {
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
