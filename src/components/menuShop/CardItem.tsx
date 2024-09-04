import { useState } from "react";
import currencyFormat from "../../helpers/currencyFormat";
import { ModalItem } from "./ModalItem";
import { DetallePedidoProps } from "../../pages/DynamicForm";

interface Props {
	img: string;
	name: string;
	price: number;
	category?: string;
	type: string;
	description?: string;
	handleFormBurger: (value: DetallePedidoProps) => void;
}

export const CardItem = ({
	img,
	name,
	price,
	type,
	handleFormBurger,
}: Props) => {
	const [showModal, setShowModal] = useState(false);

	const closeModal: () => void = () => {
		setShowModal(false);
	};
	return (
		<>
			<div
				onClick={() => setShowModal(true)}
				className=" h-full font-coolvetica font-black bg-gray-300 shadow-lg rounded-lg  flex flex-col justify-between"
			>
				<div className="pt-4">
					<img
						className="mx-auto h-16"
						src={`/menu/${img}`}
						alt="product image"
					/>
				</div>

				<div className="cursor-pointer">
					<div className="text-center">
						<h5 className=" p-4 font-medium text-black">
							{name
								.split(" ")
								.map((word) =>
									word.toLowerCase() === "2x1"
										? word
										: word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
								)
								.join(" ")}
						</h5>
						<hr className=" border-t-1 opacity-20 w-full border-black" />
						<div className="flex items-center p-4 justify-center">
							<span className=" font-medium text-black">
								{currencyFormat(price)}
							</span>
						</div>
					</div>
				</div>
			</div>
			{showModal && (
				<ModalItem
					closeModal={closeModal}
					name={name}
					price={price}
					type={type}
					handleFormBurger={handleFormBurger}
				/>
			)}
		</>
	);
};
