import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Logo from "../assets/isologoAbsolte.png";

type SplashScreenProps = {
	onFinish: () => void;
};
const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
	const [isVisible, setIsVisible] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsVisible(false);
			onFinish();
		}, 3000); // La animación durará 3 segundos

		return () => clearTimeout(timer);
	}, [onFinish]);

	return (
		<motion.div
			initial={{ opacity: 1 }}
			animate={{ opacity: isVisible ? 1 : 0 }}
			transition={{ duration: 0.5 }}
			className="fixed inset-0 flex items-center justify-center bg-black z-50"
		>
			<motion.img
				src={Logo}
				alt="Anhelo Logo"
				className="w-1/2 max-w-xs"
				initial={{ scale: 0.5, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{
					duration: 1,
					ease: "easeOut",
					times: [0, 0.2, 0.5, 0.8, 1],
					repeatDelay: 1,
				}}
				style={{}}
			/>
		</motion.div>
	);
};

export default SplashScreen;
