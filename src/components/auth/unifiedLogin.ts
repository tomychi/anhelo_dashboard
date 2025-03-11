import { useState } from "react";
import {
  verificarCredenciales,
  verificarCredencialesEmpleado,
  EmpresaProps,
  EmpleadoProps,
} from "../../firebase/ClientesAbsolute";

const useUnifiedLogin = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState<"empresa" | "empleado" | null>(
    null
  );

  const login = async (telefono: string, contraseña: string) => {
    setError(null);
    setLoading(true);
    setTipoUsuario(null);

    try {
      // Primero intenta login como empresa
      const empresa = await verificarCredenciales(telefono, contraseña);

      if (empresa) {
        setLoading(false);
        setTipoUsuario("empresa");
        return { usuario: empresa, tipoUsuario: "empresa" as const };
      }

      // Si falla, intenta como empleado
      const empleado = await verificarCredencialesEmpleado(
        telefono,
        contraseña
      );

      if (empleado) {
        setLoading(false);
        setTipoUsuario("empleado");
        return { usuario: empleado, tipoUsuario: "empleado" as const };
      }

      // Si ambos fallan, muestra error
      setLoading(false);
      setError("Datos inválidos. Por favor, inténtalo de nuevo.");
      return null;
    } catch (err) {
      setLoading(false);
      if (typeof err === "object" && err !== null && "message" in err) {
        setError((err as Error).message);
      } else {
        setError("Error desconocido al iniciar sesión");
      }
      console.error(err);
      return null;
    }
  };

  return { error, loading, login, tipoUsuario };
};

export default useUnifiedLogin;
