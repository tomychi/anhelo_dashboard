import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleQRScan } from '../firebase/registroEmpleados';

export const ScanPage: React.FC = () => {
    const navigate = useNavigate();
    const [scanning, setScanning] = useState(false);

    React.useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const scanData = searchParams.get('data');

        if (scanData && !scanning) {
            setScanning(true);
            handleQRScan(scanData)
                .then(() => {
                    alert('Registro exitoso');
                    navigate('/equipo');
                })
                .catch((error) => {
                    console.error('Error:', error);
                    alert('Error al procesar el escaneo');
                })
                .finally(() => {
                    setScanning(false);
                });
        }
    }, [navigate, scanning]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            {scanning ? (
                <p>Procesando...</p>
            ) : (
                <p>Esperando escaneo...</p>
            )}
        </div>
    );
};

export default ScanPage;