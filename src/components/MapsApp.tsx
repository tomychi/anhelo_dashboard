import { MapProvider, PlacesProvider } from "../context";
import { HomeScreen } from "../screens";
import { PedidoProps } from "../types/types";

interface MapsAppProps {
	orders: PedidoProps[];
}

export const MapsApp = ({ orders }: MapsAppProps) => {
	return (
		<PlacesProvider>
			<MapProvider>
				<HomeScreen orders={orders} />
			</MapProvider>
		</PlacesProvider>
	);
};