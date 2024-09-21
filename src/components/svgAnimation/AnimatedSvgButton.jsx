import React, { useState } from "react";

const AnimatedSvgButton = ({ onToggleSidebar }) => {
	const [isAnimating, setIsAnimating] = useState(false);

	const handleClick = () => {
		setIsAnimating(true);
		setTimeout(() => setIsAnimating(false), 1000); // La animación dura 1 segundo
		onToggleSidebar(); // Llamamos a la función para abrir/cerrar el sidebar
	};

	const getTransform = (direction) => {
		if (!isAnimating) return "translateX(0)";
		return direction === "right" ? "translateX(13.5px)" : "translateX(-13.5px)";
	};

	return (
		<div className="relative">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				className="w-9 h-9 cursor-pointer"
				onClick={handleClick}
			>
				{/* Líneas horizontales continuas */}
				<path
					d="M3 6h18M3 12h18M3 18h18"
					stroke="currentColor"
					strokeWidth="1.5"
					fill="none"
				/>

				{/* Círculos con trazo blanco */}
				<circle
					cx="5.25"
					cy="6"
					r="2.25"
					stroke="white"
					strokeWidth="1"
					style={{
						transition: "transform 1s",
						transform: getTransform("right"),
					}}
				/>
				<circle
					cx="18.75"
					cy="12"
					r="2.25"
					stroke="white"
					strokeWidth="1"
					style={{
						transition: "transform 1s",
						transform: getTransform("left"),
					}}
				/>
				<circle
					cx="5.25"
					cy="18"
					r="2.25"
					stroke="white"
					strokeWidth="1"
					style={{
						transition: "transform 1s",
						transform: getTransform("right"),
					}}
				/>
			</svg>
		</div>
	);
};

export default AnimatedSvgButton;
