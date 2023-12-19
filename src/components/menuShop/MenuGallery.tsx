import items from '../../assets/menu.json';
import { CardItem } from './CardItem';

interface Props {
  handleFormBurger: (value: any) => void;
}

export const MenuGallery = ({ handleFormBurger }: Props) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map(({ name, img, id, price, type }) => {
        return (
          <CardItem
            key={id}
            img={img}
            name={name}
            price={price}
            type={type}
            handleFormBurger={handleFormBurger}
          />
        );
      })}
    </div>
  );
};
