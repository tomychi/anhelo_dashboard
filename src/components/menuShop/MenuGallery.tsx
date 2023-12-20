import items from "../../assets/menu.json";
import { CardItem } from "./CardItem";

interface Props {
	handleFormBurger: (value: any) => void;
}

export const MenuGallery = ({ handleFormBurger }: Props) => {
	const originals = items.filter((item) => item.type === "originals");
	const ourItems = items.filter((item) => item.type === "our");
	const gaseosas = items.filter((item) => item.type === "gaseosas");
	const papas = items.filter((item) => item.type === "papas");

	return (
		<div className="flex flex-col">
			<h1 className="text-custom-red font-antonio text-2xl font-black mb-4 ">
				ORIGINALS
			</h1>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
				{/* Render all items side by side */}
				{originals.map(({ name, img, id, price, type }) => (
					<CardItem
						key={id}
						img={img}
						name={name}
						price={price}
						type={type}
						handleFormBurger={handleFormBurger}
					/>
				))}
			</div>
			<h1 className="text-custom-red font-antonio text-2xl mb-4 font-black">
				MASTERPIECES
			</h1>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
				{ourItems.map(({ name, img, id, price, type }) => (
					<CardItem
						key={id}
						img={img}
						name={name}
						price={price}
						type={type}
						handleFormBurger={handleFormBurger}
					/>
				))}
			</div>
			<h1 className="text-custom-red font-antonio text-2xl mb-4 font-black">
				PAPAS
			</h1>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
				{papas.map(({ name, img, id, price, type }) => (
					<CardItem
						key={id}
						img={img}
						name={name}
						price={price}
						type={type}
						handleFormBurger={handleFormBurger}
					/>
				))}
			</div>
			<h1 className="text-custom-red font-antonio text-2xl mb-4 font-black">
				GASEOSAS
			</h1>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{gaseosas.map(({ name, img, id, price, type }) => (
					<CardItem
						key={id}
						img={img}
						name={name}
						price={price}
						type={type}
						handleFormBurger={handleFormBurger}
					/>
				))}
			</div>
		</div>
	);
};
