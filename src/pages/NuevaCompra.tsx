import { FormGasto } from "../components/gastos";

export const NuevaCompra = () => {
	return (
		<div className="flex flex-col">
			<div className="flex flex-row justify-between items-center mt-8 mx-4">
				<p className="text-black font-medium text-5xl ">Nueva compra</p>
			</div>
			<div className="bg-gray-300 p-4 mt-4">
				<FormGasto />
			</div>
		</div>
	);
};
