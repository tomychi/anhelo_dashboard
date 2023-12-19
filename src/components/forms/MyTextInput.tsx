import { ErrorMessage, useField } from "formik";

interface Props {
	label: string;
	name: string;
	type?: "email" | "text" | "password";
	[x: string]: any; //cualquier cantidad de propiedadesde tipo string
}

export const MyTextInput = ({ label, ...props }: Props) => {
	const [field] = useField(props);
	// en el field se encuentra el valor del input, el name, el onChange, onBlur, etc
	//en el meta los errores

	return (
		<div className="relative z-0 w-full mb-2 group mt-10 ml-2">
			<input
				id="floating_first_name"
				className="block py-2.5 px-0 w-full text-sm texk-black 900 bg-transparent border-0 border-b-2 border-black appearance-none text-black focus:outline-none focus:ring-0 peer"
				placeholder=" "
				required
				{...field}
				{...props}
			/>
			<label
				htmlFor={props.id || props.name}
				className="peer-focus:font-medium uppercase absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
			>
				{label}
			</label>
			<ErrorMessage
				name={props.name}
				component="span"
				className="mt-2 text-sm  font-thin text-white"
			/>
			{/* se puede pasar el className en el ErrorMessage */}
		</div>
	);
};
