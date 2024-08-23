import { useState } from "react";
import userLogin from "../../auth/userLogin";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../redux/auth/authAction";
import Sticker from "../../assets/anheloTMblack.png";
import absoluteLogo from "../../assets/absoluteIsologo.avif";

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
			<div className="flex flex-col ">
				<img
					src={Sticker}
					className="w-3/4 mb-4 mx-auto"
					alt="Anhelo Logo"
					style={{ filter: "invert(100%)", WebkitFilter: "invert(100%)" }}
				/>
				<div className="flex flex-row justify-center mt-[-13px]">
					<p className="text-gray-100 text-xs">powered by</p>
					<div className="flex flex-row gap-1 items-center">
						<img
							src={absoluteLogo}
							className="h-10 brightness-0 invert-[0.92] saturate-0 contrast-[0.92]"
							alt=""
						/>
						<p className="text-gray-100">Absolute</p>
					</div>
				</div>
			</div>
			<div className="mb-4 mt-8">
				<label className="block mb-2 text-gray-100 text-sm ">
					Bienvenido, por favor tu correo
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
				<label className="block mb-2 text-sm text-gray-100 ">
					Y tu contraseña
				</label>

				<input
					className="block py-2.5  w-full  texk-black  bg-transparent border-0 border-b-2 border-black appearance-none bg-gray-100 text-black focus:outline-none focus:ring-0 peer"
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
				className=" text-black w-full p-4 bg-gray-100 font-black uppercase  outline-none"
			>
				INGRESAR
			</button>
		</form>
	);
};
