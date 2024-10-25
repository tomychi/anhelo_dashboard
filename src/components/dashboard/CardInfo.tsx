import React, { useRef, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import arrow from "../../assets/arrowIcon.png";

interface CardInfoProps {
	info: string | number;
	title: string;
	link?: string;
	cuadrito?: number | string;
	className?: string;
	isLoading?: boolean;
	showAsRatings?: boolean; // Nuevo prop para diferenciar si es rating o porcentaje
}

interface LoadingElementProps {
	className: string;
	width?: number | string;
}

const LoadingElement: React.FC<LoadingElementProps> = ({
	className,
	width,
}) => (
	<div
		className={`bg-gray-200 rounded overflow-hidden ${className}`}
		style={{ width }}
	>
		<motion.div
			className="h-full w-full bg-gradient-to-r from-gray-200 via-white to-gray-200"
			animate={{ x: ["100%", "-100%"] }}
			transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
		/>
	</div>
);

export const CardInfo: React.FC<CardInfoProps> = ({
	info,
	title,
	link,
	cuadrito,
	className = "",
	isLoading = false,
	showAsRatings = false, // Por defecto muestra como porcentaje
}) => {
	const displayPercentage = !isNaN(cuadrito as number) && cuadrito;
	const titleRef = useRef<HTMLParagraphElement>(null);
	const infoRef = useRef<HTMLParagraphElement>(null);
	const [titleWidth, setTitleWidth] = useState<number | undefined>(undefined);
	const [infoWidth, setInfoWidth] = useState<number | undefined>(undefined);

	useEffect(() => {
		if (titleRef.current) {
			setTitleWidth(titleRef.current.offsetWidth);
		}
		if (infoRef.current) {
			setInfoWidth(infoRef.current.offsetWidth);
		}
	}, [info, title, cuadrito]);

	return (
		<NavLink
			to={link ? `/${link}` : ""}
			className={`flex-1 bg-gray-100 text-black font-coolvetica border-[0.5px] border-opacity-10 border-black px-4 pt-2 pb-3 ${
				!link && "cursor-default"
			} ${className}`}
		>
			<div className="flex flex-row items-center justify-between w-full">
				<div className="flex flex-col gap-1">
					{isLoading ? (
						<LoadingElement className="h-4" width={titleWidth} />
					) : (
						<p ref={titleRef} className="text-sm font-medium">
							{title}
							{displayPercentage && (
								<>
									{" "}
									{showAsRatings
										? `(${cuadrito} ratings)`
										: `(${Math.ceil(
												typeof cuadrito === "number"
													? cuadrito
													: parseFloat(cuadrito as string)
										  )}%)`}
								</>
							)}
						</p>
					)}
					{isLoading ? (
						<LoadingElement className="h-2 w-1.5" />
					) : (
						<img src={arrow} className="h-2 w-1.5" alt="" />
					)}
				</div>
				{isLoading ? (
					<LoadingElement className="h-8" width={infoWidth} />
				) : (
					<p ref={infoRef} className="text-4xl font-medium">
						{info}
					</p>
				)}
			</div>
		</NavLink>
	);
};
