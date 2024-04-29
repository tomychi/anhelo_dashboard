import { useEffect, useRef, ReactNode } from "react";

interface ScrollContainerProps {
	children: ReactNode;
}

const ScrollContainer = ({ children }: ScrollContainerProps) => {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = containerRef.current;

		if (container) {
			const scrollRight = () => {
				container.scrollLeft += 1; // Cambia la velocidad de desplazamiento ajustando este valor
			};

			const intervalId = setInterval(scrollRight, 50); // Cambia la frecuencia del desplazamiento ajustando este valor

			return () => clearInterval(intervalId);
		}
	}, []);

	return (
		<div
			ref={containerRef}
			className="flex items-center flex-row overflow-x-auto"
		>
			{children}
		</div>
	);
};

export default ScrollContainer;
