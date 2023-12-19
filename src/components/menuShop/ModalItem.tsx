import { Formik, Form, Field } from "formik";
import toppingsJson from "../../assets/toppings.json";

interface Props {
	setShowModal: (value: boolean) => void;
	name: string;
	price?: number;
	type: string;
	handleFormBurger: (value: any) => any;
}

export const ModalItem = ({
	setShowModal,
	name,
	price,
	type,
	handleFormBurger,
}: Props) => {
	return (
		<>
			<div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
				<div className="relative w-full my-6 mx-auto max-w-3xl">
					{/*content*/}
					<div className="border-0 -lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
						{/*header*/}
						<div className="flex items-start justify-between p-5 border-b border-solid border-blueGray-200 -t">
							<h3 className="text-3xl font-semibold">{name}</h3>
							<button
								className=" p-1 ml-auto bg-transparent border-0 text-black  float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
								onClick={() => setShowModal(false)}
							>
								<span className=" text-black  h-6 w-6 text-2xl block outline-none focus:outline-none">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth="1.5"
										stroke="currentColor"
										className="border border-red-500 w-8 h-8"
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
											const selectedTopping = toppingsJson.find(
												(t) => t.name === topping
											);
											return (
												total + (selectedTopping ? selectedTopping.price : 0)
											);
										},
										0
									);

									// Agrega el precio total al objeto de valores antes de enviarlo
									const updatedValues = {
										...values,
										priceToppings: priceToppings,
									};

									handleFormBurger(updatedValues);
									setShowModal(false);
								}}
							>
								{(formik) => (
									<Form noValidate className="">
										<div className="grid grid-cols-2 md:grid-cols-2 gap-6">
											{toppingsJson.map(({ name, price }) => {
												if (type === "originals") {
													return (
														<div
															role="group"
															aria-labelledby="checkbox-group"
															key={name}
															className=" flex items-center pl-4 border border-red-200  border-red-700"
														>
															<label className="cursor-pointer w-full py-4 ml-2 text-3xl font-medium text-red-900 text-red-300">
																<Field
																	className="w-8 h-8 text-red-600 bg-red-100 border-red-300  focus:ring-red-500 focus:ring-red-600 ring-offset-red-800 focus:ring-2 bg-red-700 border-red-600"
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
										<div className=" w-full p-6 border-t border-solid border-blueGray-200 -b">
											<div className="flex justify-around w-full">
												<div className="flex items-center">
													<button
														className="w-24 h-24 border border-red-500 -full text-red-500 p-2 text-8xl"
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
														className="w-24 h-24 text-center border border-gray-400  p-2 text-8xl"
													/>
													<button
														className="w-24 h-24 border border-emerald-500 -full text-emerald-500 p-2 text-8xl"
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
						<button
							className="h-16 text-4xl hover:bg-red-500 hover:text-black text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 border border-red-500"
							type="button"
							onClick={() => setShowModal(false)}
						>
							Cancelar
						</button>
					</div>
				</div>
			</div>
			<div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
		</>
	);
};
