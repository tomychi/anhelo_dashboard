import {
  MapView,
  SearchBar,
  ListOrderAddress,
  // RoutesOptimization,
} from '../components/map';
import { PedidoProps } from '../types/types';
import { RootState } from '../redux/configureStore';
import { useSelector } from 'react-redux';

//
interface HomeScreenProps {
  orders: PedidoProps[];
}

export const HomeScreen = ({ orders }: HomeScreenProps) => {
  const user = useSelector((state: RootState) => state.auth.user);

  const userAdmin = 'tomas.arcostanzo5@gmail.com';

  return (
    <div className="relative overflow-hidden">
      <MapView />
      {/* Posicionamiento arriba a la derecha */}
      {user.email === userAdmin && (
        <div className="absolute top-2 right-2">
          <SearchBar />
        </div>
      )}

      {/* Posicionamiento abajo a la derecha */}
      <div className="absolute bottom-4 right-2">{/* <ReactLogo /> */}</div>
      {/* Posicionamiento abajo a la izquierda */}
      <div className="absolute bottom-2 left-2 w-full md:w-auto md:bottom-4">
        <ListOrderAddress orders={orders} />
      </div>
    </div>
  );
};
