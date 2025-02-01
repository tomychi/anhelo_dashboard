import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    setDoc,
    updateDoc,
    getFirestore,
    getDocs,
    arrayUnion
} from 'firebase/firestore';
import { startOfDay, endOfDay } from 'date-fns';

interface RecorridoData {
    date: Date;
    totalDistance: number;
    totalTime: number;
    costoPorEntrega: number;
    horaRegreso: string;
    peorEntrega: {
        tiempo: number;
        direccion: string;
    };
    detallesPedidos: Array<{
        direccion: string;
        distancia: number;
        tiempoEspera: number;
        tiempoPercibido: number;
        estadoCocina: string;
    }>;
}

interface CadetData {
    name: string;
    available: boolean;
    recorridos: RecorridoData[];
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

export const updateCadetRecorridos = async (
    name: string,
    recorridoData: RecorridoData
): Promise<void> => {
    const phoneNumber = await findCadetPhoneByName(name);

    if (!phoneNumber) {
        throw new Error(`No se encontró un cadete con el nombre: ${name}`);
    }

    const firestore = getFirestore();
    const cadetRef = doc(firestore, 'riders2025', phoneNumber);

    await updateDoc(cadetRef, {
        recorridos: arrayUnion(recorridoData)
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
            const updatedCadetes = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name,
                    available: data.available,
                    recorridos: data.recorridos,
                    lastSession: data.lastSession.toDate(),
                } as CadetData;
            });
            onCadetesChange(updatedCadetes);
        }
    );
};

export const findCadetPhoneByName = async (name: string): Promise<string | null> => {
    const firestore = getFirestore();
    const cadetesQuery = query(
        collection(firestore, 'riders2025'),
        where('name', '==', name)
    );

    const cadetesSnapshot = await getDocs(cadetesQuery);

    if (cadetesSnapshot.empty) {
        return null;
    }

    return cadetesSnapshot.docs[0].id;
};

export const updateCadetAvailability = async (
    phoneNumber: string,
    available: boolean
): Promise<void> => {
    const firestore = getFirestore();
    const cadetRef = doc(firestore, 'riders2025', phoneNumber);

    await updateDoc(cadetRef, {
        available: available,
        lastSession: new Date()
    });
};