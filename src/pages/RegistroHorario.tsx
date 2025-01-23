import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { collection, getFirestore, query, where, getDocs, updateDoc, arrayUnion } from "firebase/firestore";
import { marcarEntrada, marcarSalida } from '../firebase/registroEmpleados';
import { RootState } from '../redux/configureStore';

interface RegistroDiario {
    fecha: string;
    turnos: Array<{
        entrada: string;
        salida: string | null;
    }>;
}

export const RegistroHorario: React.FC = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [action, setAction] = useState<'entrada' | 'salida' | null>(null);
    const currentUserEmail = useSelector((state: RootState) => state.auth?.user?.email);

    useEffect(() => {
        const registrarAsistencia = async () => {
            try {
                if (!currentUserEmail) throw new Error('Usuario no autenticado');

                const firestore = getFirestore();
                const empleadosRef = collection(firestore, 'empleados');
                const q = query(empleadosRef, where('correo', '==', currentUserEmail));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) throw new Error('Empleado no encontrado');

                const employeeDoc = querySnapshot.docs[0];
                const employeeData = employeeDoc.data();
                const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
                const currentDate = new Date().toISOString().split('T')[0];

                const registros = employeeData.registroHorario || [];
                const registroHoy = registros.find(r => r.fecha === currentDate);

                if (employeeData.isWorking) {
                    if (registroHoy) {
                        const lastTurno = registroHoy.turnos[registroHoy.turnos.length - 1];
                        lastTurno.salida = currentTime;
                    }

                    await updateDoc(employeeDoc.ref, {
                        isWorking: false,
                        registroHorario: registroHoy ?
                            registros.map(r => r.fecha === currentDate ? registroHoy : r) :
                            [...registros, { fecha: currentDate, turnos: [{ entrada: employeeData.startTime, salida: currentTime }] }]
                    });
                    await marcarSalida(employeeData.name);
                    setAction('salida');
                } else {
                    const nuevoTurno = { entrada: currentTime, salida: null };

                    await updateDoc(employeeDoc.ref, {
                        isWorking: true,
                        registroHorario: registroHoy ?
                            registros.map(r => r.fecha === currentDate ?
                                { ...r, turnos: [...r.turnos, nuevoTurno] } : r) :
                            [...registros, { fecha: currentDate, turnos: [nuevoTurno] }]
                    });
                    await marcarEntrada(employeeData.name);
                    setAction('entrada');
                }

                setStatus('success');
                setMessage(`${employeeData.name}, tu ${action === 'entrada' ? 'entrada' : 'salida'} ha sido registrada a las ${currentTime}`);
            } catch (error) {
                setStatus('error');
                setMessage(error instanceof Error ? error.message : 'Error al procesar el registro');
            }
        };

        registrarAsistencia();
    }, [currentUserEmail, navigate]);

    useEffect(() => {
        if (status === 'success' || status === 'error') {
            const timer = setTimeout(() => {
                navigate('/');
            }, 3500); // 3000ms for animation + 500ms buffer
            return () => clearTimeout(timer);
        }
    }, [status, navigate]);

    return (
        <div className={`h-full ${status === 'success' ? 'bg-green-500' :
            status === 'error' ? 'bg-red-500' :
                'bg-gray-100'
            } bg-opacity-10 font-coolvetica flex flex-col items-center justify-center p-4`}>
            <style>
                {`
                @keyframes scaleIn {
                    0% { transform: scale(0.8); opacity: 0; }
                    70% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes fadeInUp {
                    0% { transform: translateY(10px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                .scale-in {
                    animation: scaleIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                }
                .fade-up {
                    animation: fadeInUp 0.4s ease forwards;
                    animation-delay: 0.2s;
                    opacity: 0;
                }
                `}
            </style>

            <div className="w-full max-w-md ">
                {status === 'loading' && (
                    <div className="flex flex-col items-center space-y-2">
                        <div className="w-4 h-4 border-4 border-t-black border-r-black border-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {status === 'success' && (
                    <>
                        <div className="border-2 flex-col flex justify-center items-center rounded-lg p-4 scale-in">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                className="text-green-500 size-6 scale-in">
                                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                            </svg>
                            <h3 className="text-green-500 font-bold text-lg fade-up">¡Registro exitoso!</h3>
                            <p className="text-green-500 text-center fade-up">{message} hs</p>
                        </div>
                        <div className="mt-8 text-center text-black text-sm fade-up">
                            Serás redirigido automáticamente...
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>

                        <div className="border border-red-500 bg-red-500 bg-opacity-10 rounded-lg p-4 relative scale-in">
                            <div className="flex items-start space-x-3">
                                <svg className="w-6 h-6 text-red-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="fade-up">
                                    <h3 className="text-red-500 font-bold text-lg">Error en el registro</h3>
                                    <p className="text-red-400">{message}</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 text-center text-black text-sm fade-up">
                            Serás redirigido automáticamente...
                        </div>
                    </>
                )}


            </div>
        </div>
    );
};

export default RegistroHorario;