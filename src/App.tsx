import React, { useState, useEffect } from "react";
import { Navigation } from "./routes/Navigation";
import SplashScreen from "./components/SplashScreen"; // Asegúrate de que la ruta sea correcta

function App() {
	const [showSplash, setShowSplash] = useState(true);

	useEffect(() => {
		// Simulamos una carga de datos o inicialización
		const timer = setTimeout(() => {
			setShowSplash(false);
		}, 3000); // 3 segundos de duración del splash screen

		return () => clearTimeout(timer);
	}, []);

	if (showSplash) {
		return <SplashScreen onFinish={() => setShowSplash(false)} />;
	}

	return (
		<>
			<Navigation />
		</>
	);
}

export default App;
