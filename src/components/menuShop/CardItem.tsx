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
		<div className="">
			<div
				onClick={() => setShowModal(true)}
				className="cursor-pointer h-full font-antonio font-black bg-custom-red"
			>
				<div className="p-4">
					<img
						className="mx-auto h-20"
						src={`/menu/${img}`}
						alt="product image"
					/>
				</div>

				<div className="p-4">
					<div className="text-center">
						<h5 className="text-sm font-semibold tracking-tight text-black uppercase">
							{name}
						</h5>
						<div className="flex items-center justify-center ">
							<span className="text-sm font-bold text-black">
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
			</div>
		</div>
	);
};
