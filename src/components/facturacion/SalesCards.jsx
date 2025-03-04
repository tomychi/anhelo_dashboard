import currencyFormat from "../../helpers/currencyFormat";


const SalesCards = ({ ventas, onToggleFacturar }) => {

    const totalVentas = Math.round(
        ventas
            .filter(venta => venta.quiereFacturarla)
            .reduce((total, venta) => total + parseFloat(venta.importeTotal), 0)
    );

    return (
        <div className="w-full  font-coolvetica">
            {/* title */}
            <div className='flex px-4 flex-row items-baseline  mb-2'>
                <h2 className="font-bold  text-xs">
                    Total a facturar:
                </h2>
                <p className=' font-bold ml-2'>
                    {currencyFormat(totalVentas)}
                </p>
            </div>
            {/* cards */}
            <div className="flex flex-row px-4 gap-2 overflow-x-auto">
                {ventas.map((venta) => (
                    <button
                        key={venta.id}
                        onClick={() => onToggleFacturar(venta.id)}
                        className={`b  w-25 border border-gray-300 flex-shrink-0 rounded-xl 
                            flex flex-col items-center cursor-pointer transition-colors
                            `}
                    >


                        <div className={`text-center flex flex-row gap-0.5 w-full bg-gray-300 items-center flex justify-center ${venta.quiereFacturarla ? 'text-green-500' : 'text-red-500'}  rounded-t-xl text-xs py-1 font-bold`}>

                            {venta.quiereFacturarla ? (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3">
                                <path fill-rule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clip-rule="evenodd" />
                            </svg>
                            ) : (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3">
                                <path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                            </svg>
                            )}


                            {venta.quiereFacturarla ? 'Facturar' : 'No facturar'}
                        </div>
                        <p className="text-xl py-2 font-bold my-auto px-4">
                            {currencyFormat(Math.round(parseFloat(venta.importeTotal)))}

                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SalesCards;