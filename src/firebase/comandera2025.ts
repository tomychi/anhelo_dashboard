import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    setDoc,
    updateDoc,
    getFirestore,
} from 'firebase/firestore';
import { startOfDay, endOfDay } from 'date-fns';

interface CadetData {
    name: string;
    available: boolean;
    recorridos: any[];
    lastSession: Date;
}

export const createCadet = async (phoneNumber: string, name: string): Promise<void> => {
    const firestore = getFirestore();

    const cadetData: CadetData = {
        name,
        available: true,
        recorridos: [],
        lastSession: new Date(),
    };

    await setDoc(doc(firestore, 'riders2025', phoneNumber), cadetData);
};

export const updateCadetSession = async (phoneNumber: string): Promise<void> => {
    const firestore = getFirestore();
    const cadetRef = doc(firestore, 'riders2025', phoneNumber);

    await updateDoc(cadetRef, {
        lastSession: new Date(),
    });
};

export const listenToActiveCadetes = (
    onCadetesChange: (cadetes: CadetData[]) => void
) => {
    const firestore = getFirestore();

    return onSnapshot(
        query(
            collection(firestore, 'riders2025'),
            where('lastSession', '>=', startOfDay(new Date())),
            where('lastSession', '<=', endOfDay(new Date()))
        ),
        (snapshot) => {
            const updatedCadetes = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as CadetData[];
            onCadetesChange(updatedCadetes);
        }
    );
};