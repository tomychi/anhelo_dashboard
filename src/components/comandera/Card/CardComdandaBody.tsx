import { DetallePedidoItem } from '../../../types/types';

interface CardComdandaBodyProps {
  aclaraciones: string;
  detallePedido: DetallePedidoItem[];
}

export const CardComdandaBody = ({
  aclaraciones,
  detallePedido,
}: CardComdandaBodyProps) => {
  return (
    <div className=" mt-8">
      {aclaraciones && (
        <p className="w-full mt-8 bg-black  pr-1 pl-1 pb-1 text-4xl text-center text-green-500 font-black">
          {aclaraciones}
        </p>
      )}
      {detallePedido.map(
        (
          {
            burger,
            toppings,
            quantity,
          }: { burger: string; toppings: string[]; quantity: number },
          i: number
        ) => (
          <div key={i} className="flex mt-4 items-center flex-col">
            <p className="text-black text-4xl font-black border-4 w-full text-center border-black pr-1 pl-1 pb-1">
              {quantity}X {burger}
            </p>
            <div>
              <div className="flex flex-col items-center ">
                {toppings.map((topping: string, toppingIndex: number) => (
                  <span
                    key={`${topping}-${toppingIndex}`}
                    className={`text-2xl flex  text-black font-black ${
                      topping.toLowerCase() === 'huevo' ||
                      topping.toLowerCase() === 'carne'
                        ? 'bg-black mt-4  text-2xl text-center text-green-500'
                        : ''
                    }`}
                  >
                    {topping}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
