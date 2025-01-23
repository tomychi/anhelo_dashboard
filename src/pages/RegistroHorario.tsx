import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { collection, getFirestore, query, where, getDocs, updateDoc } from "firebase/firestore";
import { marcarEntrada, marcarSalida } from '../firebase/registroEmpleados';
import { RootState } from '../redux/configureStore';

export const RegistroHorario: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const currentUserEmail = useSelector((state: RootState) => state.auth?.user?.email);

    useEffect(() => {
        const registrarAsistencia = async () => {
            try {
                if (!currentUserEmail) {
                    throw new Error('Usuario no autenticado');
                }

                const firestore = getFirestore();
                const empleadosRef = collection(firestore, 'empleados');
                const q = query(empleadosRef, where('correo', '==', currentUserEmail));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    throw new Error('Empleado no encontrado');
                }

                const employeeDoc = querySnapshot.docs[0];
                const employeeData = employeeDoc.data();
                const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });

                if (employeeData.isWorking) {
                    await updateDoc(employeeDoc.ref, {
                        isWorking: false,
                        endTime: currentTime
                    });
                    await marcarSalida(employeeData.name);
                } else {
                    await updateDoc(employeeDoc.ref, {
                        isWorking: true,
                        startTime: currentTime,
                        endTime: null
                    });
                    await marcarEntrada(employeeData.name);
                }

                alert('Registro exitoso');
                navigate('/');
            } catch (error) {
                console.error('Error:', error);
                alert(error instanceof Error ? error.message : 'Error al procesar el registro');
                navigate('/');
            }
        };

        registrarAsistencia();
    }, [currentUserEmail, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Procesando registro...</p>
        </div>
    );
};

export default RegistroHorario;
