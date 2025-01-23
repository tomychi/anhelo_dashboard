import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/configureStore';
import { handleQRScan } from '../firebase/registroEmpleados';

export const ScanPage: React.FC = () => {
    const navigate = useNavigate();
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const currentUserEmail = useSelector(
        (state: RootState) => state.auth?.user?.email
    );

    React.useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const scanData = searchParams.get('data');

        if (scanData) {
            // First, parse and log the raw data
            try {
                const parsedData = JSON.parse(decodeURIComponent(scanData));
                alert(`Datos recibidos: ${JSON.stringify(parsedData)}`);
                console.log('Parsed QR Data:', parsedData);
            } catch (parseError) {
                alert(`Error al parsear datos: ${scanData}`);
                console.error('Parse Error:', parseError);
                return;
            }

            setScanning(true);
            handleQRScan(scanData, currentUserEmail)
                .then(() => {
                    alert('Registro exitoso');
                    navigate('/equipo');
                })
                .catch((error) => {
                    console.error('Error:', error);
                    setError(error instanceof Error ? error.message : 'Error al procesar el escaneo');
                })
                .finally(() => {
                    setScanning(false);
                });
        }
    }, [navigate, currentUserEmail]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-red-100">
                <div className="text-center">
                    <p className="text-red-600 font-bold mb-4">Error de Verificación</p>
                    <p className="text-red-500">{error}</p>
                    <button
                        onClick={() => navigate('/equipo')}
                        className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

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