import { Field, Formik, Form } from "formik";
// import toppingsJson from '../../assets/toppings.json';
import { DetallePedidoProps } from "../../pages/DynamicForm";
import { DataStateProps } from "../../pages/DynamicForm";

interface Props {
	closeModal: () => void;
	name: string;
	price?: number;
	type: string;
	toppings: DataStateProps[];
	handleFormBurger: (value: DetallePedidoProps) => void;
}

export const ModalItem = ({
	closeModal,
	name,
	price,
	type,
	toppings,
	handleFormBurger,
}: Props) => {
	return (
		<>
			<div className=" flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
				<div className=" p-4 mx-auto">
					<div className=" bg-custom-red flex flex-col font-antonio p-4">
						{/*header*/}
						<div className=" flex flex-col">
							<h3 className="text-4xl p-4 flex justify-center uppercase font-black">
								{name}
							</h3>
							<button className="pb-4" onClick={closeModal}>
								<span className=" flex justify-center">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth="1.5"
										stroke="currentColor"
										className=" border  border-black w-6 h-6"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</span>
							</button>
						</div>
						{/*body*/}
						<div>
							<Formik
								initialValues={{
									burger: name,
									toppings: [],
									quantity: 1, // Valor inicial de cantidad
									priceBurger: price,
								}}
								onSubmit={(values) => {
									// Calcula el precio de los toppings seleccionados
									const priceToppings = values.toppings.reduce(
										(total, topping) => {
											const selectedTopping = toppings.find(
												({ data }) => data.name === topping
											);
											return (
												total +
												(selectedTopping ? selectedTopping.data.price : 0)
											);
										},
										0
									);

									const totalOrderPrice = values.priceBurger
										? values.priceBurger + priceToppings
										: 0;

									const subTotal = totalOrderPrice * values.quantity;

									// Agrega el precio total al objeto de valores antes de enviarlo
									const updatedValues = {
										...values,
										subTotal: subTotal, // Agrega el subtotal calculado
										priceToppings: priceToppings,
									};

									handleFormBurger(updatedValues);
									closeModal();
								}}
							>
								{(formik) => (
									<Form noValidate className="">
										<div className="grid grid-cols-2 md:grid-cols-2 gap-6">
											{toppings.map(({ data }) => {
												const { price, name } = data;
												if (type === "originals") {
													return (
														<div
															role="group"
															aria-labelledby="checkbox-group"
															key={name}
															className=" flex uppercase  items-center  border border-black"
														>
															<label className="cursor-pointer w-full p-4  text-2xl font-medium flex items-center gap-4 text-black">
																<Field
																	className=" h-4 w-4 "
																	type="checkbox"
																	name="toppings"
																	value={name}
																/>
																{`${name} $${price}`}
															</label>
														</div>
													);
												}
											})}
										</div>
										<div className="pt-4">
											<div className="flex justify-between w-full">
												<div className="flex items-center">
													<button
														className="w-24 h-24 border border-black text-black text-8xl"
														type="button"
														onClick={() =>
															formik.setFieldValue(
																"quantity",
																Math.max(formik.values.quantity - 1, 1)
															)
														}
													>
														-
													</button>
													<Field
														type="number"
														name="quantity"
														min="1"
														className="w-24 h-24 border border-black text-black text-8xl "
													/>
													<button
														className="w-24 h-24 border border-black text-black text-8xl"
														type="button"
														onClick={() =>
															formik.setFieldValue(
																"quantity",
																formik.values.quantity + 1
															)
														}
													>
														+
													</button>
												</div>
												<button
													className="text-4xl hover:bg-emerald-700 w-34 h-24 bg-emerald-400 text-black active:bg-emerald-600 font-bold uppercase text-sm px-4 py-2  shadow-lg hover:shadow-xl outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
													type="submit"
												>
													Guardar
												</button>
											</div>
										</div>
									</Form>
								)}
							</Formik>
							<p className="my-4 text-blueGray-500 text-lg leading-relaxed"></p>
						</div>
					</div>
				</div>
			</div>
			<div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
		</>
	);
};
