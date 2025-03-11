import { EmpresaProps } from "../../firebase/ClientesAbsolute";

export const loginSuccess = (empresa: EmpresaProps) => {
  return {
    type: "LOGIN_SUCCESS",
    payload: empresa,
  };
};

export const logoutSuccess = () => {
  return {
    type: "LOGOUT_SUCCESS",
  };
};
