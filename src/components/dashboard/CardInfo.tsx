import { NavLink } from "react-router-dom";

interface CardInfoProps {
	info: string | number;
	title: string;
	link?: string;
	cuadrito?: number | string;
	svgComponent?: JSX.Element;
}

export const CardInfo = ({
	info,
	title,
	link,
	cuadrito,
	svgComponent,
}: CardInfoProps) => {
	return (
		<NavLink
			to={link ? `/${link}` : ""}
			className={`flex-1 bg-custom-red h-40 flex flex-col items-start text-black font-coolvetica font-black p-4 relative ${
				!link && "cursor-default"
			}`}
		>
			{/* Recuadro chiquito arriba a la derecha */}
			{!isNaN(cuadrito as number) && cuadrito && (
				<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
					{`${Math.ceil(
						typeof cuadrito === "number"
							? cuadrito
							: parseFloat(cuadrito as string)
					)}%`}
				</div>
			)}

			<div className="absolute top-4 left-4 text-black ">
				{/* Contenido principal */}
				<div className="flex flex-col">{svgComponent}</div>
				{/* Puedes cambiar el ícono según tus necesidades */}
			</div>
			<p className="text-4xl pt-8 pb-4 font-bold mt-auto">{info}</p>
			<p className="text-sm mt-auto uppercase">{title}</p>
		</NavLink>
	);
};
