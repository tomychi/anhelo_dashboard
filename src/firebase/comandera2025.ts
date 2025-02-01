// firebase/comandera2025.ts
import { getFirestore, doc, setDoc } from 'firebase/firestore';

interface CadetData {
    name: string;
    available: boolean;
    recorridos: any[];
}

export const createCadet = async (phoneNumber: string, name: string): Promise<void> => {
    console.log('1. Iniciando createCadet con:', { phoneNumber, name });

    try {
        const firestore = getFirestore();
        console.log('2. Firestore inicializado:', !!firestore);

        // Formato de los datos del cadete
        const cadetData: CadetData = {
            name,
            available: true,
            recorridos: []
        };
        console.log('3. Datos del cadete preparados:', cadetData);

        const cadetDocRef = doc(firestore, 'riders2025', phoneNumber);
        console.log('4. Referencia del documento creada:', cadetDocRef.path);

        console.log('5. Intentando escribir en Firestore...');
        await setDoc(cadetDocRef, cadetData);
        console.log('6. Cadete creado exitosamente');

    } catch (error) {
        console.error('Error en createCadet:', error);
        console.error('Stack trace:', new Error().stack);
        throw error;
    }
};