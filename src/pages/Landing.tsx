const products = [
  {
    title: "Facturación automática",
    description:
      "Altamente personalizable. En su versión con menos intervecion humana, cada vez que entre una venta se genera la factura.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-full text-black"
      >
        <path
          fillRule="evenodd"
          d="M7.502 6h7.128A3.375 3.375 0 0 1 18 9.375v9.375a3 3 0 0 0 3-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 0 0-.673-.05A3 3 0 0 0 15 1.5h-1.5a3 3 0 0 0-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6ZM13.5 3A1.5 1.5 0 0 0 12 4.5h4.5A1.5 1.5 0 0 0 15 3h-1.5Z"
          clipRule="evenodd"
        />
        <path
          fillRule="evenodd"
          d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V9.375ZM6 12a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75V12Zm2.25 0a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75ZM6 15a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75V15Zm2.25 0a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75ZM6 18a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75V18Zm2.25 0a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    title: "Metricas",
    description:
      "Desde que empezas a trabajar con Absolute, recolecta tus datos y automaticamente crea reportes en tiempo real.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-full text-black"
      >
        <path
          fill-rule="evenodd"
          d="M2.25 2.25a.75.75 0 0 0 0 1.5H3v10.5a3 3 0 0 0 3 3h1.21l-1.172 3.513a.75.75 0 0 0 1.424.474l.329-.987h8.418l.33.987a.75.75 0 0 0 1.422-.474l-1.17-3.513H18a3 3 0 0 0 3-3V3.75h.75a.75.75 0 0 0 0-1.5H2.25Zm6.54 15h6.42l.5 1.5H8.29l.5-1.5Zm8.085-8.995a.75.75 0 1 0-.75-1.299 12.81 12.81 0 0 0-3.558 3.05L11.03 8.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l2.47-2.47 1.617 1.618a.75.75 0 0 0 1.146-.102 11.312 11.312 0 0 1 3.612-3.321Z"
          clip-rule="evenodd"
        />
      </svg>
    ),
  },
];

export const Landing: React.FC = () => {
  return (
    <div className="font-coolvetica pb-4">
      {/* titulo */}
      <div className="py-20 bg-black">
        <p className="text-4xl text-gray-100 text-center mb-6 text-black font-bold">
          Facturación y mucho <br /> más.
        </p>
        <div className="bg-gray-100 text-black mx-4 h-20 flex items-center text-center justify-center text-2xl rounded-full">
          PROBAR GRATIS
        </div>
        <p className="text-center text-gray-100 text-xs mt-4 mx-12">
          Software a medida con todo lo que necesitas para manejar tu empresa.
          En cualquier momento, desde cualquier lugar.
        </p>
      </div>

      {/* productos */}
      <p className="px-4 text-3xl pb-4 pt-10 text-black font-bold">Productos</p>
      {/* cards */}
      <div className="flex flex-col mx-4 gap-2">
        {products.map((product, index) => (
          <div
            key={index}
            className="bg-gray-200 px-4 gap-4 flex justify-between items-center rounded-2xl py-4"
          >
            {/* info */}
            <div className="flex flex-col">
              <p className="text-xl font-medium text-left whitespace-nowrap">
                {product.title}
              </p>
              <p className="text-xs font-light pr-2">{product.description}</p>

              {/* demostración */}
              <div className="bg-gray-100 gap-2 text-black rounded-full mt-4 h-10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="font-medium">Ver demostración</p>
              </div>
            </div>
            {/* imagen */}
            <div className="w-30">{product.icon}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Landing;
