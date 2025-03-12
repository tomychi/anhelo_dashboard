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

// Nueva acción para actualizar datos de empresa
export const updateEmpresa = (empresa: EmpresaProps) => {
  return {
    type: "UPDATE_EMPRESA",
    payload: empresa,
    // No es necesario incluir tipoUsuario porque ya está establecido en el estado
  };
};
