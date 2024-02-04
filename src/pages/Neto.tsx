import { useEffect, useState } from 'react';
import { ReadDataForDateRange } from '../firebase/ReadData';
import { ExpenseProps } from '../firebase/UploadGasto';

export const Neto = () => {
  const [expenseData, setExpenseData] = useState<ExpenseProps[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    ReadDataForDateRange<ExpenseProps>(
      'gastos',
      '2024',
      '2',
      '1',
      '2024',
      '2',
      '3',
      (gastos) => {
        console.log('Gastos por rango:', gastos);
        setExpenseData(gastos);
      }
    );

    setLoading(false);
  }, []);

<<<<<<< HEAD
	const productos = {
		originals: [
			{
				nombre: "Simple",
				costo: 1497.62,
				precioVenta: 3444.53,
				ganancia: 1942.38,
			},
			{
				nombre: "Doble",
				costo: 1801.25,
				precioVenta: 4142.87,
				ganancia: 2338.75,
			},
			{
				nombre: "Triple",
				costo: 2104.87,
				precioVenta: 4841.2,
				ganancia: 2735.13,
			},
			{
				nombre: "Cuadruple",
				costo: 2408.49,
				precioVenta: 5539.54,
				ganancia: 3131.51,
			},
		],
		masterpieces: [
			{
				nombre: "ANHELO Classic",
				costo: 1971.25,
				precioVenta: 4533.87,
				ganancia: 2558.75,
			},
			{
				nombre: "BBQ BCN Cheeseburger",
				costo: 2070.61,
				precioVenta: 4762.4,
				ganancia: 2689.39,
			},
			{
				nombre: "BCN Cheeseburger",
				costo: 2060.61,
				precioVenta: 4739.4,
				ganancia: 2679.39,
			},
			{
				nombre: "Mario Inspired",
				costo: 2171.25,
				precioVenta: 4993.87,
				ganancia: 2818.75,
			},
			{
				nombre: "Easter Egg",
				costo: 1931.25,
				precioVenta: 4441.87,
				ganancia: 2508.75,
			},
			{
				nombre: "Crispy BCN",
				costo: 2080.61,
				precioVenta: 4785.4,
				ganancia: 2709.39,
			},
		],
		papas: [
			{
				nombre: "Papas cheddar (2 bolsas)",
				costo: 1376.13,
				precioVenta: 3165.09,
				ganancia: 1793.87,
			},
			{
				nombre: "Papas ANHELO (2 bolsas)",
				costo: 1034.0,
				precioVenta: 2378.2,
				ganancia: 1346.0,
			},
		],
		satifyers: [
			{
				nombre: "ANHELO Classic",
				costo: 1002.72,
				precioVenta: 2005.44,
				ganancia: 1007.28,
			},
			{
				nombre: "BCN Cheeseburger",
				costo: 1062.08,
				precioVenta: 2124.16,
				ganancia: 1057.92,
			},
			{
				nombre: "Easter Egg",
				costo: 1162.08,
				precioVenta: 2324.16,
				ganancia: 1157.92,
			},
		],
	};

	return (
		<div className="flex p-4 gap-4 justify-between flex-row">
			<table className="w-1/2 font-antonio text-sm text-left rtl:text-right text-black">
				<thead className="text-xs  uppercase text-black border border-red-main bg-custom-red ">
					<tr>
						<th scope="col" className="px-6 py-3">
							Product name
						</th>
						<th scope="col" className="px-6 py-3">
							Category
						</th>
						<th scope="col" className="px-6 py-3">
							costo
						</th>
						<th scope="col" className="px-6 py-3">
							precio venta
						</th>
						<th scope="col" className="px-6 py-3">
							Ganancia
						</th>
					</tr>
				</thead>
				<tbody>
					{/* Mapeo de datos de productos */}
					{Object.keys(productos).map((categoria) =>
						productos[categoria].map((producto, index) => (
							<tr
								key={index}
								className="bg-black text-custom-red uppercase font-black border border-red-main"
							>
								<th
									scope="row"
									className="px-6 py-4 font-black text-custom-red whitespace-nowrap"
								>
									{producto.nombre}
								</th>
								<td className="px-6 py-4">{categoria}</td>
								<td className="px-6 py-4">{currencyFormat(producto.costo)}</td>
								<td className="px-6 py-4">
									{currencyFormat(producto.precioVenta)}
								</td>
								<td className="px-6 py-4">
									{currencyFormat(producto.ganancia)}
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
			<table className="w-1/2 font-antonio text-sm text-left rtl:text-right text-black">
				<thead className="text-xs  uppercase text-black border border-red-main bg-custom-red ">
					{/* Encabezados de la tabla */}
					<tr>
						<th scope="col" className="px-6 py-3">
							Product name
						</th>
						<th scope="col" className="px-6 py-3">
							Category
						</th>
						<th scope="col" className="px-6 py-3">
							Fecha
						</th>
						<th scope="col" className="px-6 py-3">
							Descripcion
						</th>
						<th scope="col" className="px-6 py-3">
							Cantidad
						</th>
						<th scope="col" className="px-6 py-3">
							Unidad
						</th>
						<th scope="col" className="px-6 py-3">
							Total
						</th>
						<th scope="col" className="px-6 py-3">
							<span className="sr-only">Edit</span>
						</th>
					</tr>
				</thead>
				<tbody>
					{/* Mapeo de datos de burgers */}
					{expenseData.map(
						({
							quantity,
							fecha,
							category,
							name,
							total,
							unit,
							description,
							id,
						}) => (
							<tr
								key={id}
								className="bg-black text-custom-red uppercase font-black border border-red-main"
							>
								<th
									scope="row"
									className="px-6 py-4 font-black text-custom-red whitespace-nowrap "
								>
									{name}
								</th>
								<td className="px-6 py-4">{category}</td>
								<td className="px-6 py-4">{fecha}</td>
								<td className="px-6 py-4 ">{description}</td>
								<td className="px-6 py-4 ">{quantity}</td>
								<td className="px-6 py-4 ">{unit}</td>
								<td className="px-6 py-4">{currencyFormat(total)}</td>
								<td className="px-6 py-4 text-center">
									<div className="font-black border border-red-main text-custom-red hover:underline">
										Borrar
									</div>
								</td>
							</tr>
						)
					)}
				</tbody>
			</table>
		</div>
	);
