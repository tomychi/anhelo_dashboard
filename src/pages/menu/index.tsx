import logo from '../../assets/anheloTMwhite.png';
import advisory from '../../assets/advisory.png';
import { useLocation } from 'react-router-dom';
import 'animate.css/animate.min.css';
import { useEffect, useState } from 'react';
import Items from './Items';

export const items = {
  burgers: 'burgers',
  combos: 'combos',
  papas: 'papas',
  bebidas: 'bebidas',
};
const MenuPage = () => {
  const { pathname } = useLocation();

  const [selectedItem, setSelectedItem] = useState('');
  const [locationMenu, setLocationMenu] = useState(true);

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  useEffect(() => {
    const pathParts = pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    setSelectedItem(lastPart);
    setLocationMenu(pathname.startsWith('/menu/'));
  }, [pathname]);

  return (
    <div
      className={`bg-gradient-to-b from-red-900 to-zinc-900 p-7 flex justify-center transition-all duration-1000 ${
        locationMenu
          ? 'min-h-0'
          : 'min-h-screen flex-col overflow-hidden items-center'
      }`}
    >
      {pathname.startsWith('/menu/') ? null : (
        <>
          <div className="absolute bottom-4 animate__animated animate__fadeIn animate__slower left-4 font-antonio text-white  font-medium text-xs">
            <img src={logo} className="h-5" />
            VAS A PEDIR MÁS.
          </div>
          <img
            src={advisory}
            className="h-9 absolute right-4 bottom-4 animate__animated animate__fadeIn animate__slower "
          />
          <a className="animate__animated animate__fadeIn animate__slower font-kotch text-white font-medium text-lg mb-8  origin-top-left rotate-3">
            elegi
          </a>
        </>
      )}

      <nav>
        <ul
          className={`animate__animated animate__fadeIn animate__slower ${
            locationMenu
              ? 'flex flex-wrap justify-center gap-4'
              : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4'
          }`}
        >
          <Items
            selectedItem={selectedItem}
            img={'/menu/baconCheeseburger.png'}
            name={items.burgers}
            handleItemClick={handleItemClick}
          />

          <Items
            selectedItem={selectedItem}
            img={'/menu/coca.png'}
            name={items.bebidas}
            handleItemClick={handleItemClick}
          />

          <Items
            selectedItem={selectedItem}
            img={'/menu/papas.png'}
            name={items.papas}
            handleItemClick={handleItemClick}
          />
          {/* <Items
            selectedItem={selectedItem}
            img={combos}
            name={items.combos}
            handleItemClick={handleItemClick}
          /> */}
        </ul>
      </nav>
    </div>
  );
};

export default MenuPage;
