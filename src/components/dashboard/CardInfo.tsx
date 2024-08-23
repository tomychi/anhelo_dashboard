import { NavLink } from "react-router-dom";
import arrow from "../../assets/arrowIcon.png";

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
			className={`flex-1 bg-gray-100 text-black font-coolvetica border-[0.5px] border-opacity-50 border-black px-4 pt-2 pb-3  ${
				!link && "cursor-default"
			} ${title === "Facturación bruta" ? "rounded-t-md" : " "}`}
		>
			{/* Recuadro chiquito arriba a la derecha */}
			{/* {!isNaN(cuadrito as number) && cuadrito && (
				<div className="absolute top-4 right-4 bg-black text-custom-red p-4">
					{`${Math.ceil(
						typeof cuadrito === "number"
							? cuadrito
							: parseFloat(cuadrito as string)
					)}%`}
				</div>
			)} */}

			<div className="flex flex-row items-center justify-between w-full">
				{/* El titulo */}
				<div className=" flex flex-col gap-1">
					<p className="text-sm font-medium ">{title}</p>
					<img src={arrow} className="h-2 w-1.5" alt="" />
				</div>
				{/* El numero */}
				<p className="text-4xl font-medium ">{info}</p>
			</div>
		</NavLink>
	);
};
