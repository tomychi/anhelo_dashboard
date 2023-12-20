import { ErrorMessage, useField } from "formik";

interface Props {
	label: string;
	name: string;
	placeholder?: string;
	[x: string]: any; //cualquier cantidad de propiedadesde tipo string
}

export const MySelect = ({ label, ...props }: Props) => {
	const [field] = useField(props);
	// en el field se encuentra el valor del input, el name, el onChange, onBlur, etc

	return (
		<>
			<label
				className="peer-focus:font-medium absolute text-sm texk-black 500 texk-black 400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
				htmlFor={props.id || props.name}
			>
				{/* {label} */}
			</label>

			<select
				{...field}
				{...props}
				className="h-12 bg-red-300 hover:bg-red-700"
			/>
			<ErrorMessage
				name={props.name}
				className="mt-2 text-sm text-red-600 text-red-500"
				component="span"
			/>
		</>
	);
};
