import {
  BtnMyLocation,
  MapView,
  ReactLogo,
  SearchBar,
} from '../components/map';

export const HomeScreen = () => {
  return (
    <div>
      <MapView />
      <BtnMyLocation />
      <ReactLogo />
      <SearchBar />
    </div>
  );
};
