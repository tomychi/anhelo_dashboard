import {
	MapView,
	ReactLogo,
	SearchBar,
	ListOrderAddress,
	// RoutesOptimization,
} from "../components/map";
import { PedidoProps } from "../types/types";
//
interface HomeScreenProps {
	orders: PedidoProps[];
}

export const HomeScreen = ({ orders }: HomeScreenProps) => {
	return (
		<div className="relative overflow-hidden">
			<MapView />
			{/* Posicionamiento arriba a la derecha */}
			<div className="absolute top-2 right-2">
				<SearchBar />
			</div>
			{/* Posicionamiento abajo a la derecha */}
			<div className="absolute bottom-4 right-2">{/* <ReactLogo /> */}</div>
			{/* Posicionamiento abajo a la izquierda */}
			<div className="absolute bottom-2 left-2 w-full md:w-auto md:bottom-4">
				<ListOrderAddress orders={orders} />
			</div>
		</div>
	);
};
