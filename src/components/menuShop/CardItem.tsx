import { useState } from "react";
import currencyFormat from "../../helpers/currencyFormat";
import { ModalItem } from "./ModalItem";

interface Props {
	img: string;
	name: string;
	price: number;
	category?: string;
	type: string;
	description?: string;
	handleFormBurger: (value: any) => void;
}

export const CardItem = ({
	img,
	name,
	price,
	type,
	handleFormBurger,
}: Props) => {
	const [showModal, setShowModal] = useState(false);

	const handleCloseModal = () => {
		setShowModal(false);
	};

	return (
		<>
			<div
				onClick={() => setShowModal(true)}
				className="cursor-pointer w-full max-w-sm  -lg shadow bg-custom-red"
			>
				<img className="-t-lg h-20" src={`/menu/${img}`} alt="product image" />
				<div className="">
					<h5 className="text-sm font-semibold tracking-tight text-gray-900 text-black">
						{name}
					</h5>
					<div className="flex items-center"></div>
					<div className="flex items-center justify-between">
						<span className="text-sm font-bold text-gray-900 text-black">
							{currencyFormat(price)}
						</span>
					</div>
				</div>
			</div>
			{showModal && (
				<ModalItem
					setShowModal={setShowModal}
					name={name}
					price={price}
					type={type}
					handleFormBurger={handleFormBurger}
				/>
			)}
		</>
	);
};
