import { FormGasto } from "../components/gastos";

export const NuevaCompra = () => {
	return (
		<div className="flex flex-col ">
			<div className="flex flex-row justify-center items-center mt-8 mx-4">
				<p className="text-black font-medium text-2xl ">Nueva compra</p>
			</div>
			<div className="">
				<FormGasto />
			</div>
		</div>
	);
};
