import React, { useRef, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { projectAuth } from "../../firebase/config";
import arrow from "../../assets/arrowIcon.png";

interface CardInfoProps {
	info: string | number;
	title: string;
	link?: string;
	cuadrito?: number | string;
	className?: string;
	isLoading?: boolean;
	showAsRatings?: boolean;
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
	showAsRatings = false,
}) => {
	const titleRef = useRef<HTMLParagraphElement>(null);
	const infoRef = useRef<HTMLParagraphElement>(null);
	const [titleWidth, setTitleWidth] = useState<number | undefined>(undefined);
	const [infoWidth, setInfoWidth] = useState<number | undefined>(undefined);
	const [isMarketingUser, setIsMarketingUser] = useState(false);

	useEffect(() => {
		// Verificar si el usuario es de marketing
		const currentUserEmail = projectAuth.currentUser?.email;
		setIsMarketingUser(currentUserEmail === "marketing@anhelo.com");
	}, []);

	useEffect(() => {
		if (titleRef.current) {
			setTitleWidth(titleRef.current.offsetWidth);
		}
		if (infoRef.current) {
			setInfoWidth(infoRef.current.offsetWidth);
		}
	}, [info, title, cuadrito]);

	const shouldShowAdditionalInfo = (): boolean => {
		if (cuadrito === undefined) return false;
		if (typeof cuadrito === "number") return cuadrito > 0;
		if (typeof cuadrito === "string") {
			const numValue = parseFloat(cuadrito);
			return !isNaN(numValue) && numValue > 0;
		}
		return false;
	};

	const formatAdditionalInfo = () => {
		if (!shouldShowAdditionalInfo()) return "";

		const value =
			typeof cuadrito === "number"
				? Math.ceil(cuadrito)
				: Math.ceil(parseFloat(cuadrito as string));
		return showAsRatings ? `(${value} ratings)` : `(${value}%)`;
	};

	const CardContent = () => (
		<div className="flex flex-row items-center justify-between w-full">
			<div className="flex flex-col gap-1">
				{isLoading ? (
					<LoadingElement className="h-4" width={titleWidth} />
				) : (
					<p ref={titleRef} className="text-sm font-medium">
						{title}
						{shouldShowAdditionalInfo() && ` ${formatAdditionalInfo()}`}
					</p>
				)}
				{!isMarketingUser &&
					link &&
					(isLoading ? (
						<LoadingElement className="h-2 w-1.5" />
					) : (
						<img src={arrow} className="h-2 w-1.5" alt="" />
					))}
			</div>
			{isLoading ? (
				<LoadingElement className="h-8" width={infoWidth} />
			) : (
				<p ref={infoRef} className="text-4xl font-medium">
					{info}
				</p>
			)}
		</div>
	);

	// Si es usuario de marketing o no hay link, renderizar un div
	if (isMarketingUser || !link) {
		return (
			<div
				className={`flex-1 bg-gray-100 text-black font-coolvetica border-[0.5px] border-opacity-10 border-black px-4 pt-2 pb-3 cursor-default ${className}`}
			>
				<CardContent />
			</div>
		);
	}

	// Si no es usuario de marketing y hay link, renderizar NavLink
	return (
		<NavLink
			to={`/${link}`}
			className={`flex-1 bg-gray-100 text-black font-coolvetica border-[0.5px] border-opacity-10 border-black px-4 pt-2 pb-3 ${className}`}
		>
			<CardContent />
		</NavLink>
	);
};

export default CardInfo;
