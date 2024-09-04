import { CardItem } from "./CardItem";
import { DetallePedidoProps } from "../../pages/DynamicForm";
import { RootState } from "../../redux/configureStore";
import { useSelector } from "react-redux";

interface Props {
	handleFormBurger: (value: DetallePedidoProps) => void;
}

export const MenuGallery = ({ handleFormBurger }: Props) => {
	const { burgers, drinks, fries } = useSelector(
		(state: RootState) => state.product
	);
	const data = [...burgers, ...drinks, ...fries];

	return (
		<div className="flex flex-col">
			<div>
				{[
					"promo",
					"satisfyer",
					"originals",
					"masterpieces",
					"papas",
					"drink",
				].map((sectionName) => (
					<div key={sectionName}>
						<h1 className="text-black font-coolvetica text-2xl font-medium mb-2">
							{(() => {
								switch (sectionName.toLowerCase()) {
									case "satisfyer":
										return "Satisfyers";
									case "promo":
										return "Promos";
									case "drink":
										return "Gaseosas";
									default:
										return (
											sectionName.charAt(0).toUpperCase() + sectionName.slice(1)
										);
								}
							})()}
						</h1>
						<div className="grid md:grid-cols-3 grid-cols-2 lg:grid-cols-6 gap-4 mb-2">
							{/* Renderizar items de la sección correspondiente */}
							{data
								.filter((item) => item.data.type === sectionName)
								.map(({ id, data }) => (
									<CardItem
										key={id}
										img={data.img}
										name={data.name}
										price={data.price}
										type={data.type}
										handleFormBurger={handleFormBurger}
									/>
								))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
