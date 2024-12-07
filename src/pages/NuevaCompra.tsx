import { FormGasto } from "../components/gastos";

export const NuevaCompra = () => {
	return (
		<div className="flex flex-col ">
			<div className="mt-11">
				<div className="w-1/5 bg-black h-[0.5px] "></div>
				<p className="text-black font-bold text-2xl px-4  mt-2">Nueva compra</p>
			</div>

			<FormGasto />
		</div>
	);
};
