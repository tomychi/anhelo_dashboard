import { useState } from "react";
import userLogin from "../../auth/userLogin";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../redux/auth/authAction";
import Sticker from "../../assets/anheloTMblack.png";

export const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useDispatch();

	const from = location.state?.from?.pathname || "/dashboard";

	const { error, login } = userLogin();

	const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const res = await login(email, password);

		if (!error && res) {
			dispatch(
				loginSuccess({
					uid: res?.user?.uid || "",
					email: res?.user?.email || "",
				})
			);

			navigate(from, { replace: true });
			setEmail("");
			setPassword("");
			return;
		} else {
			setErrorMessage(error);
		}
	};

	return (
		<form
			className="font-antonio  w-full p-4 md:p-0 md:w-1/3 mx-auto text-black font-black"
			onSubmit={(e: React.FormEvent<HTMLFormElement>) => handleLogin(e)}
		>
			<img
				src={Sticker}
				className=" md:w-full w-full mb-4  mx-auto"
				alt="anhelo Logo"
			/>
			<div className="mb-4">
				<label className="block mb-2 text-sm ">
					BIENVENIDO, POR FAVOR TU CORREO
				</label>

				<input
					className="block py-2.5  w-full  texk-black  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
					required
					placeholder="name@gmail.com"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>
			</div>
			<div className="mb-5">
				<label className="block mb-2 text-sm  ">TU CONTRASEÑA</label>

				<input
					className="block py-2.5  w-full  texk-black  bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
					required
					type="password"
					placeholder="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
			</div>
			{error && <p>{errorMessage}</p>}

			<button
				type="submit"
				className=" text-custom-red w-full p-4 bg-black font-black uppercase  outline-none"
			>
				INGRESAR
			</button>
		</form>
	);
};
