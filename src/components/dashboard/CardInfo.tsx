import React from "react";
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
}

const LoadingElement = ({ className }) => (
	<div className={`bg-gray-200 rounded overflow-hidden ${className}`}>
		<motion.div
			className="h-full w-full bg-gradient-to-r from-gray-200 via-white to-gray-200"
			animate={{ x: ["100%", "-100%"] }}
			transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
		/>
	</div>
);

export const CardInfo = ({
	info,
	title,
	link,
	cuadrito,
	className = "",
	isLoading = false,
}: CardInfoProps) => {
	const displayPercentage = !isNaN(cuadrito as number) && cuadrito;

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
						<LoadingElement className="h-4 w-44" />
					) : (
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
					)}
					<img src={arrow} className="h-2 w-1.5" alt="" />
				</div>
				{isLoading ? (
					<LoadingElement className="h-8 w-44" />
				) : (
					<p className="text-4xl font-medium">{info}</p>
				)}
			</div>
		</NavLink>
	);
};
