import { EmpresaProps, EmpleadoProps } from "../../firebase/ClientesAbsolute";

export const loginSuccess = (
  usuario: EmpresaProps | EmpleadoProps,
  tipoUsuario: "empresa" | "empleado"
) => {
  return {
    type: "LOGIN_SUCCESS",
    payload: usuario,
    tipoUsuario: tipoUsuario,
  };
};

export const logoutSuccess = () => {
  return {
    type: "LOGOUT_SUCCESS",
  };
};
