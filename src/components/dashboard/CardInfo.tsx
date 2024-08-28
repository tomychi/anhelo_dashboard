import { NavLink } from "react-router-dom";
import arrow from "../../assets/arrowIcon.png";

interface CardInfoProps {
	info: string | number;
	title: string;
	link?: string;
	cuadrito?: number | string;
	svgComponent?: JSX.Element;
	className?: string; // Nueva prop
}

export const CardInfo = ({
	info,
	title,
	link,
	cuadrito,
	className = "",
}: CardInfoProps) => {
	const displayPercentage = !isNaN(cuadrito as number) && cuadrito;

	return (
		<NavLink
			to={link ? `/${link}` : ""}
			className={`flex-1 bg-gray-100 text-black font-coolvetica border-[0.5px] border-opacity-10 border-black px-4 pt-2 pb-3 ${
				!link && "cursor-default"
			} ${className}`} // Agregamos la nueva className aquí
		>
			<div className="flex flex-row items-center justify-between w-full">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-medium">
						{title}
						{displayPercentage && (
							<>
								{" "}
								(
								{`${Math.ceil(
									typeof cuadrito === "number"
										? cuadrito
										: parseFloat(cuadrito as string)
								)}%`}
								)
							</>
						)}
					</p>
					<img src={arrow} className="h-2 w-1.5" alt="" />
				</div>
				<p className="text-4xl font-medium">{info}</p>
			</div>
		</NavLink>
	);
};
