import React, { useState, useEffect } from "react";
import { Navigation } from "./routes/Navigation";
import SplashScreen from "./components/SplashScreen"; // Asegúrate de que la ruta sea correcta

function App() {
	const [showSplash, setShowSplash] = useState(true);
	const [backendStatus, setBackendStatus] = useState('');


	useEffect(() => {
		// Simulamos una carga de datos o inicialización
		const timer = setTimeout(() => {
			setShowSplash(false);
		}, 3000); // 3 segundos de duración del splash screen

		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		fetch('http://localhost:3000/api/test')
			.then(res => res.json())
			.then(data => setBackendStatus(data.message))
			.catch(err => setBackendStatus('Error al conectar con el backend'));
	}, []);

	if (showSplash) {
		return <SplashScreen onFinish={() => setShowSplash(false)} />;
	}

	return (
		<>
			<Navigation backendStatus={backendStatus} />
		</>
	);
}

export default App;
