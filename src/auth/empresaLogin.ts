import { useState } from "react";
import {
  verificarCredenciales,
  EmpresaProps,
} from "../firebase/ClientesAbsolute";

const empresaLogin = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (telefono: string, contraseña: string) => {
    setError(null);
    setLoading(true);

    try {
      const empresa = await verificarCredenciales(telefono, contraseña);
      setLoading(false);

      if (!empresa) {
        setError("Datos inválidos. Por favor, inténtalo de nuevo.");
        return null;
      }

      return empresa;
    } catch (err) {
      setLoading(false);
      if (typeof err === "object" && err !== null && "message" in err) {
        setError((err as Error).message);
      } else {
        setError("Error desconocido al iniciar sesión");
      }
      console.error(error);
      return null;
    }
  };

  return { error, loading, login };
};

export default empresaLogin;
