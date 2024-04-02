import {
  MapView,
  ReactLogo,
  SearchBar,
  ListOrderAddress,
} from '../components/map';

export const HomeScreen = () => {
  return (
    <div className="relative overflow-hidden">
      <MapView />
      {/* Posicionamiento arriba a la derecha */}
      <div className="absolute top-2 right-2">
        {/* <BtnMyLocation /> */}
        <SearchBar />
      </div>
      {/* Posicionamiento arriba al medio */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2"></div>
      {/* Posicionamiento abajo a la derecha */}
      <div className="absolute bottom-4 right-2">
        <ReactLogo />
      </div>
      {/* Posicionamiento arriba a la izquierda */}
      <div className="absolute top-2 left-1">
        <ListOrderAddress />
      </div>
    </div>
  );
};
