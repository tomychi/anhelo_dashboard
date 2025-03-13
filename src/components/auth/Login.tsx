import { useState, useEffect } from "react";
import useUnifiedLogin from "../auth/unifiedLogin";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../redux/auth/authAction";
import Sticker from "../../assets/anheloTMblack.png";
import absoluteLogo from "../../assets/absoluteIsologo.avif";
import LoadingPoints from "../LoadingPoints";

export const Login = () => {
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [showError, setShowError] = useState(false);
  const [telefonoFocused, setTelefonoFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const from = location.state?.from?.pathname || "/dashboard";

  const { error, loading, login } = useUnifiedLogin();

  // Limpiar inputs cuando el componente se monta
  useEffect(() => {
    // Reset input values on component mount
    setTelefono("");
    setPassword("");
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setShowError(false);

    const resultado = await login(telefono, password);

    if (!error && resultado) {
      dispatch(loginSuccess(resultado.usuario, resultado.tipoUsuario));
      navigate(from, { replace: true });
      setTelefono("");
      setPassword("");
      return;
    } else {
      setErrorMessage(
        error || "Datos inválidos. Por favor, inténtalo de nuevo."
      );
      setShowError(true);
    }
  };

  const inputStyle = {
    backgroundColor: "#f3f4f6",
    color: "black",
    transition: "opacity 300ms ease",
  };

  const getInputClass = (isFocused) => `
    px-4 h-10 w-full rounded-lg  
    appearance-none focus:outline-none focus:ring-0 peer
    text-xs 
    bg-gray-100 text-black font-light 
    autofill:bg-gray-100 autofill:text-black
    focus:bg-gray-100 focus:text-black
    hover:bg-gray-100 hover:text-black
    ${isFocused ? "opacity-100" : "opacity-50"}
    transition-opacity duration-300
  `;

  return (
    <div className="bg-black w-full h-full flex items-center">
      <form
        className="font-coolvetica w-full p-4 md:p-0 md:w-1/3 mx-auto flex flex-col text-gray-100"
        onSubmit={handleLogin}
        autoComplete="new-password" // Este valor evita el autocompletado
        spellCheck="false"
      >
        {/* Logo */}
        <div className="flex flex-col mx-auto w-3/4">
          <img
            src={Sticker}
            className="w-full mb-4 mx-auto"
            alt="Anhelo Logo"
            style={{ filter: "invert(100%)", WebkitFilter: "invert(100%)" }}
          />
          <div className="flex flex-row justify-end mt-[-13px]">
            <p className="text-gray-100 text-xs mr-[-5px]">impulsado por</p>
            <div className="flex flex-row gap-1 items-center">
              <img
                src={absoluteLogo}
                className="h-10 brightness-0 invert-[0.92] saturate-0 contrast-[0.92]"
                alt=""
              />
              <p className="text-gray-100 font-bold">Absolute</p>
            </div>
          </div>
        </div>

        {/* Input del teléfono (antes era correo) */}
        <div className="mb-2 w-full mt-6">
          <input
            className={getInputClass(telefonoFocused || telefono.length > 0)}
            style={inputStyle}
            required
            placeholder="Ingresa tu número de teléfono"
            type="tel"
            name="phone" // Nombre único
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            onFocus={() => setTelefonoFocused(true)}
            onBlur={() => setTelefonoFocused(false)}
            autoComplete="new-password" // Valor no estándar para evitar autocompletado
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>

        {/* Input de la contraseña */}
        <div className="w-full">
          <input
            className={getInputClass(passwordFocused || password.length > 0)}
            style={inputStyle}
            required
            type="password"
            name="new-password" // Nombre único
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            autoComplete="new-password" // Valor no estándar para evitar autocompletado
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>

        {/* Ingresar */}
        <button
          type="submit"
          className="text-gray-100 bg-indigo-600 w-full mt-4 h-20 rounded-3xl bg-gray-100 font-bold outline-none"
          disabled={loading}
        >
          {loading ? (
            <LoadingPoints color="text-gray-100" />
          ) : (
            <p className="text-3xl">Ingresar</p>
          )}
        </button>

        {/* Enlace para crear una empresa */}
        <div className="mt-8 text-center mx-auto flex flex-row gap-2">
          <p className="text-gray-400 text-xs">No tenes una cuenta?</p>
          <button
            type="button"
            onClick={() => navigate("/crearEmpresa")}
            className="text-gray-100 text-xs underline"
          >
            Registra tu empresa
          </button>
        </div>

        {/* Mensaje de error */}
        {showError && (
          <div className="text-red-main h-10 text-xs mt-8 border-l-4 border-red-main items-center flex px-2">
            <p>{errorMessage}</p>
          </div>
        )}
      </form>
    </div>
  );
};
