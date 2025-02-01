// firebase/comandera2025.ts
import { getFirestore, doc, setDoc, updateDoc } from 'firebase/firestore';

interface CadetData {
    name: string;
    available: boolean;
    recorridos: any[];
    lastSession: Date;  // Ya no es null por defecto
}

export const createCadet = async (phoneNumber: string, name: string): Promise<void> => {
    const firestore = getFirestore();

    const cadetData: CadetData = {
        name,
        available: true,
        recorridos: [],
        lastSession: new Date()  // Guardamos la fecha y hora de creación
    };

    await setDoc(doc(firestore, 'riders2025', phoneNumber), cadetData);
};

export const updateCadetSession = async (phoneNumber: string): Promise<void> => {
    const firestore = getFirestore();
    const cadetRef = doc(firestore, 'riders2025', phoneNumber);

    await updateDoc(cadetRef, {
        lastSession: new Date()
    });
};