import React, { useEffect, useState } from "react";
import { ReadDataForDateRange } from "../firebase/ReadData";
import { ExpenseProps } from "../firebase/UploadGasto";
import LineChart from "../components/LineChart"; // Asegúrate de importar el componente LineChart desde su ubicación correcta

export const Seguidores = () => {
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		setLoading(true);

		ReadDataForDateRange<ExpenseProps>(
			"gastos",
			"2024",
			"2",
			"1",
			"2024",
			"2",
			"3",
			(gastos) => {
				console.log("Gastos por rango:", gastos);
				setExpenseData(gastos);
			}
		);

		setLoading(false);
	}, []);

	const fakeDatabase = {
		"2024-01-01": {
			Anhelo: {
				followers: 4992,
				likes: 1500,
				comentarios: 50,
			},
			Burgerfan: {
				followers: 19186,
				likes: 1400,
				comentarios: 45,
			},
			"Santa Burger": {
				followers: 15969,
				likes: 200,
				comentarios: 10,
			},
			"Desperta con esta burger": {
				followers: 10579,
				likes: 800,
				comentarios: 5,
			},
			"Burger Pig": {
				followers: 5781,
				likes: 100,
				comentarios: 3,
			},
		},
		"2024-01-02": {
			Anhelo: {
				followers: 4992,
				likes: 1500,
				comentarios: 50,
			},
			Burgerfan: {
				followers: 19186,
				likes: 1400,
				comentarios: 45,
			},
			"Santa Burger": {
				followers: 15969,
				likes: 200,
				comentarios: 10,
			},
			"Desperta con esta burger": {
				followers: 10579,
				likes: 800,
				comentarios: 5,
			},
			"Burger Pig": {
				followers: 5781,
				likes: 100,
				comentarios: 3,
			},
		},
		"2024-01-03": {
			Anhelo: {
				followers: 4992,
				likes: 1500,
				comentarios: 50,
			},
			Burgerfan: {
				followers: 19186,
				likes: 1400,
				comentarios: 45,
			},
			"Santa Burger": {
				followers: 15969,
				likes: 200,
				comentarios: 10,
			},
			"Desperta con esta burger": {
				followers: 10579,
				likes: 800,
				comentarios: 5,
			},
			"Burger Pig": {
				followers: 5781,
				likes: 100,
				comentarios: 3,
			},
		},
	};

	const creativos = {
		"Presentacion de las satisfyer": {
			inversion: 1666,
			costoPorLead: 13.66,
			followersGanados: 352,
		},
	};

	const competencia = {
		"Burger Fan": {
			followers: 19186,
			promedioDeLikesUltimasDosSemanas: 64,
			promedioDeComentariosUltimasDosSemanas: 0,
		},
		"Santa Burger": {
			followers: 15969,
			promedioDeLikesUltimasDosSemanas: 0,
			promedioDeComentariosUltimasDosSemanas: 0,
		},
		"Desperta con esta burger": {
			followers: 10579,
			promedioDeLikesUltimasDosSemanas: 753,
			promedioDeComentariosUltimasDosSemanas: 0.33,
		},
		"Burger Pig": {
			followers: 5781,
			promedioDeLikesUltimasDosSemanas: 0,
			promedioDeComentariosUltimasDosSemanas: 0,
		},
		Anhelo: {
			followers: 4992,
			promedioDeLikesUltimasDosSemanas: 119,
			promedioDeComentariosUltimasDosSemanas: 1.5,
		},
	};

	return (
		<div className="flex p-4 gap-4 justify-between flex-col w-full">
			<div className="w-full">
				<LineChart data={fakeDatabase} />
			</div>
			<div className="flex items-center text-4xl">
				<h1 className="text-custom-red uppercase font-black font-antonio">
					COMPETENCIA TRACKING MOMENTANEO
				</h1>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth="5"
					stroke="currentColor"
					className="font-black w-4 ml-2 mt-5 text-custom-red"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="m4.5 4.5 15 15m0 0V8.25m0 11.25H8.25"
					/>
				</svg>
			</div>
			<div className="w-full flex flex-col gap-4">
				<div className="w-full flex flex-col gap-4">
					<table className="w-full border-collapse font-antonio text-sm text-left rtl:text-right text-black">
						<thead className="text-xs uppercase text-black bg-custom-red">
							<tr>
								<th scope="col" className="px-6 py-3">
									Ranking
								</th>
								<th scope="col" className="px-6 py-3">
									Competidor
								</th>
								<th scope="col" className="px-6 py-3">
									Followers
								</th>
								<th scope="col" className="px-6 py-3">
									P/Likes últimas dos semanas
								</th>
								<th scope="col" className="px-6 py-3">
									Ratio
								</th>
								<th scope="col" className="px-6 py-3">
									P/Comentarios últimas dos semanas
								</th>
							</tr>
						</thead>
						<tbody>
							{Object.entries(competencia)
								.sort(
									([, datosA], [, datosB]) =>
										datosB.followers - datosA.followers
								)
								.map(([competencia, datos], index) => (
									<tr
										key={competencia}
										className="bg-black text-custom-red uppercase font-black border border-red-main"
									>
										<td className="px-6 py-4">{index + 1}</td>
										<td className="px-6 py-4">{competencia}</td>
										<td className="px-6 py-4">{datos.followers}</td>
										<td className="px-6 py-4">
											{datos.promedioDeLikesUltimasDosSemanas}
										</td>
										<td className="px-6 py-4">
											{(
												(datos.promedioDeLikesUltimasDosSemanas * 100) /
												datos.followers
											).toFixed(1)}
											%
										</td>
										<td className="px-6 py-4">
											{datos.promedioDeComentariosUltimasDosSemanas}
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</div>
			</div>

			<div className="flex items-center text-4xl">
				<h1 className="text-custom-red uppercase font-black font-antonio">
					FOLLOWME ADS
				</h1>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth="5"
					stroke="currentColor"
					className="font-black w-4 ml-2 mt-5 text-custom-red"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="m4.5 4.5 15 15m0 0V8.25m0 11.25H8.25"
					/>
				</svg>
			</div>

			<div className="w-full flex flex-col gap-4">
				<table className="h-min w-full font-antonio text-sm text-left rtl:text-right text-black">
					<thead className="text-xs uppercase text-black border border-red-main bg-custom-red">
						<tr>
							<th scope="col" className="px-6 py-3">
								CREATIVOS
							</th>
							<th scope="col" className="px-6 py-3">
								INVERSION
							</th>
							<th scope="col" className="px-6 py-3">
								$/LEAD
							</th>
							<th scope="col" className="px-6 py-3">
								FOLLOWERS GANADOS
							</th>
						</tr>
					</thead>
					<tbody>
						{Object.entries(creativos).map(([creativo, datos]) => (
							<tr
								key={creativo}
								className="bg-black text-custom-red uppercase font-black border border-red-main"
							>
								<th
									scope="row"
									className="px-6 py-4 font-black text-custom-red whitespace-nowrap"
								>
									{creativo}
								</th>
								<td className="px-6 py-4">${datos.inversion}</td>
								<td className="px-6 py-4">${datos.costoPorLead}</td>
								<td className="px-6 py-4">{datos.followersGanados}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default Seguidores;
