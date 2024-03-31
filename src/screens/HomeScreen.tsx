import {
  BtnMyLocation,
  MapView,
  ReactLogo,
  // SearchBar,
  ListOrderAddress,
} from '../components/map';

export const HomeScreen = () => {
  return (
    <div>
      <MapView />
      <BtnMyLocation />
      <ReactLogo />
      <ListOrderAddress />
      {/* <SearchBar /> */}
    </div>
  );
};
