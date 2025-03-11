import { EmpresaProps, EmpleadoProps } from "../../firebase/ClientesAbsolute";

export interface UserState {
  usuario: EmpresaProps | EmpleadoProps | null;
  isAuth: boolean;
  tipoUsuario: "empresa" | "empleado" | null;
}

interface AuthAction {
  type: string;
  payload?: any;
  tipoUsuario?: "empresa" | "empleado";
}

const initialState: UserState = {
  usuario: null,
  isAuth: false,
  tipoUsuario: null,
};

const authReducer = (state = initialState, action: AuthAction) => {
  switch (action.type) {
    case "LOGIN_SUCCESS":
      console.log("🔵 Login Success - Estado anterior:", state);
      console.log("🔵 Login Success - Payload recibido:", action.payload);
      console.log("🔵 Login Success - Tipo usuario:", action.tipoUsuario);
      const loginState = {
        ...state,
        isAuth: true,
        usuario: action.payload,
        tipoUsuario: action.tipoUsuario,
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
