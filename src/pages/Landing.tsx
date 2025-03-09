export const Landing: React.FC = () => {
  return (
    <div className="font-coolvetica pb-4">
      {/* titulo */}
      <div className=" py-20 bg-black">
        <p className="text-4xl text-gray-100 text-center  mb-6 text-black font-bold">
          Facturacion y mucho <br /> mas.
        </p>
        <div className="bg-gray-100 text-black mx-4 h-20  flex items-center text-center justify-center text-2xl rounded-full ">
          PROBAR GRATIS
        </div>
        <p className="text-center text-gray-100 text-xs  mt-4 mx-12">
          Software a medida con todo lo que necesitas para manejar tu empresa.
          En cualquier momento, desde cualquier lugar.
        </p>
      </div>

      {/* productos */}
      <p className="px-4 text-3xl pb-4 pt-10">Productos</p>

      {/* card */}
      <div className="bg-gray-300 mx-4 px-4 gap-4 flex justify-between flex items-center rounded-2xl py-4">
        {/* info */}
        <div className="flex  flex-col ">
          <p className=" text-xl text-left ">Facturacion automatica</p>
          <p className="text-xs pt-2 ">
            Altamente personalizable. En su version con menos intervenciones,
            podes que cada vez que entre una venta se genere la factura.
          </p>
        </div>

        {/* imagen */}
        <div className="w-30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-full"
          >
            <path
              fill-rule="evenodd"
              d="M7.502 6h7.128A3.375 3.375 0 0 1 18 9.375v9.375a3 3 0 0 0 3-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 0 0-.673-.05A3 3 0 0 0 15 1.5h-1.5a3 3 0 0 0-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6ZM13.5 3A1.5 1.5 0 0 0 12 4.5h4.5A1.5 1.5 0 0 0 15 3h-1.5Z"
              clip-rule="evenodd"
            />
            <path
              fill-rule="evenodd"
              d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V9.375ZM6 12a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75V12Zm2.25 0a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75ZM6 15a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75V15Zm2.25 0a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75ZM6 18a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75V18Zm2.25 0a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Landing;
