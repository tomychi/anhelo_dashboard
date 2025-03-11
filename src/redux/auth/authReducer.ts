import { EmpresaProps } from "../../firebase/ClientesAbsolute";

export interface UserState {
  empresa: EmpresaProps | null;
  isAuth: boolean;
}

interface AuthAction {
  type: string;
  payload?: EmpresaProps;
}

const initialState: UserState = {
  empresa: null,
  isAuth: false,
};

const authReducer = (state = initialState, action: AuthAction) => {
  switch (action.type) {
    case "LOGIN_SUCCESS":
      console.log("🔵 Login Success - Estado anterior:", state);
      console.log("🔵 Login Success - Payload recibido:", action.payload);
      const loginState = {
        ...state,
        isAuth: true,
        empresa: action.payload,
      };
      console.log("🔵 Login Success - Nuevo estado:", loginState);
      return loginState;

    case "LOGOUT_SUCCESS":
      console.log("🔴 Logout Success - Estado anterior:", state);
      console.log("🔴 Logout Success - Volviendo a estado inicial");
      return {
        ...initialState,
      };

    default:
      return state;
  }
};

export default authReducer;
