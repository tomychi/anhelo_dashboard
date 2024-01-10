import { items } from '../../../pages/menu';
import { MyTextChange } from '../../text';
import Card from '../card';

interface ProductoProps {
  description?: string;
  id: string;
  img?: string;
  name: string;
  price: number;
  type?: string;
}

interface SectionProps {
  products: ProductoProps[];
  path: string;
}

const Section = ({ products = [], path }: SectionProps) => {
  let originalsBurgers: ProductoProps[] = [];
  let ourCollection: ProductoProps[] = [];

  if (items.burgers === path) {
    originalsBurgers = products.filter((product) => {
      return product.type!.includes('originals');
    });
    ourCollection = products.filter((product) => {
      return product.type!.includes('our');
    });
  } else {
    ourCollection = products;
  }

  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 10);

  return (
    <>
      {items.burgers === path ? (
        <div className="mt-8 mb-4 mr-4 ml-4 ">
          {originalsBurgers.length > 0 && (
            <div className="section">
              <div className="flex flex-row justify-end gap-1 items-end mb-2">
                <MyTextChange
                  nameOne={'BEST SELLER'}
                  nameTwo={'DOBLE CHEESBURGER'}
                  position={'items-end'}
                />
                <p className="text-right font-bold text-5xl font-antonio text-black mb-1">
                  ORIGINALS.
                </p>
              </div>
              <div className=" grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center ">
                {originalsBurgers.map(
                  ({ name, description, price, id, img }, i) => (
                    <Card
                      key={i}
                      img={img || ''}
                      name={name || ''}
                      description={description || ''}
                      price={price || 0}
                      path={path || ''}
                      id={id || ''}
                    />
                  )
                )}
              </div>
            </div>
          )}
          {ourCollection.length > 0 && (
            <div className="section">
              <div className="flex flex-col mt-8 items-start  mb-2 ">
                <p className="font-bold text-5xl text-black font-antonio">
                  MASTERPIECES
                </p>

                <MyTextChange
                  nameOne={'BEST SELLER'}
                  nameTwo={'BBQ BCN CHEESBURGER'}
                  position={'items-start'}
                />
              </div>
              <div className=" grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center">
                {ourCollection.map(
                  ({ name, description, price, id, img }, i) => (
                    <Card
                      key={i}
                      img={img || ''}
                      name={name || ''}
                      description={description || ''}
                      price={price || 0}
                      path={path || ''}
                      id={id || ''}
                    />
                  )
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 mb-4 mr-4 ml-4 grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center">
          {products.length > 0 ? (
            products.map(({ name, description, price, id, img }, i) => (
              <Card
                key={i}
                img={img || ''}
                name={name || ''}
                description={description || ''}
                price={price || 0}
                path={path || ''}
                id={id || ''}
              />
            ))
          ) : (
            <span>No hay nada xd</span>
          )}
        </div>
      )}
    </>
  );
};

export default Section;
{
  /* <div className="mt-4 mb-4 mr-4 ml-4 grid grid-cols-5 sm:grid-cols-2 gap-4 justify-items-center min-h-screen">
          {originalsBurgers.length > 0 && (
            <div>
              <h2>Originals Burgers</h2>
              {originalsBurgers.map(({ name, description, price, id }, i) => (
                <Card
                  key={i}
                  name={name}
                  description={description}
                  price={price}
                  path={path}
                  id={id}
                />
              ))}
            </div>
          )}
          {ourCollection.length > 0 && (
            <div>
              <h2>Our Collection</h2>
              {ourCollection.map(({ name, description, price, id }, i) => (
                <Card
                  key={i}
                  name={name}
                  description={description}
                  price={price}
                  path={path}
                  id={id}
                />
              ))}
            </div>
          )}
        </div> */
}
