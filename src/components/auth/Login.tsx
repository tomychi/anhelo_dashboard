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

	const from = location.state?.from?.pathname || "/";

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

	const inputStyle = {
		backgroundColor: "#f3f4f6",
		color: "black",
	};

	const inputClass = `
		 px-4 h-10 w-full  rounded-lg  
		appearance-none focus:outline-none focus:ring-0 peer
		
		bg-gray-100 text-black font-light 
		autofill:bg-gray-100 autofill:text-black
		focus:bg-gray-100 focus:text-black
		hover:bg-gray-100 hover:text-black
	`;

	return (
		<form
			className="font-coolvetica w-full p-4 md:p-0 md:w-1/3 mx-auto flex flex-col items-center text-gray-100 "
			onSubmit={(e: React.FormEvent<HTMLFormElement>) => handleLogin(e)}
		>
			{/* Logo */}
			<div className="flex flex-col w-3/4 ">
				<img
					src={Sticker}
					className="w-full mb-4 mx-auto"
					alt="Anhelo Logo"
					style={{ filter: "invert(100%)", WebkitFilter: "invert(100%)" }}
				/>
				<div className="flex flex-row justify-end mt-[-13px]">
					<p className="text-gray-100 text-xs font-bold">powered by</p>
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
			{/* Input del correo */}
			<div className="mb-2 w-full  mt-12">
				<input
					className={inputClass}
					style={inputStyle}
					required
					placeholder="Bienvenido, por favor tu correo"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>
			</div>
			{/* Input de la contraseña */}
			<div className=" w-full">
				<input
					className={inputClass}
					style={inputStyle}
					required
					type="password"
					placeholder="Y tu contraseña"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
			</div>
			{error && <p>{errorMessage}</p>}
			{/* Ingresar */}
			<button
				type="submit"
				className="text-black w-full  mt-4 h-20 rounded-lg bg-gray-100 font-bold   outline-none"
			>
				<p className=" text-3xl">Ingresar</p>
			</button>
		</form>
	);
};
