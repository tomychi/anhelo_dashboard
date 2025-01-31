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
    arrayUnion,
    getDoc
} from 'firebase/firestore';
import { startOfDay, endOfDay } from 'date-fns';
import { CadetData, RecorridoData } from '../types/comandera2025types';

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
    const updatedRecorrido = {
        ...recorridoData,
        salio: new Date()
    };

    await updateDoc(cadetRef, {
        recorridos: arrayUnion(updatedRecorrido)
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
                name: doc.data().name,
                available: doc.data().available,
                recorridos: doc.data().recorridos,
                lastSession: doc.data().lastSession.toDate(),
            }));
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
    return cadetesSnapshot.empty ? null : cadetesSnapshot.docs[0].id;
};

export const updateCadetAvailability = async (
    phoneNumber: string,
    available: boolean
): Promise<void> => {
    const firestore = getFirestore();
    const cadetRef = doc(firestore, 'riders2025', phoneNumber);
    const cadetDoc = await getDoc(cadetRef);
    const cadetData = cadetDoc.data() as CadetData;

    if (!cadetData) return;

    const updatedData: Partial<CadetData> = {
        available,
        lastSession: new Date()
    };

    if (cadetData.recorridos?.length > 0) {
        const recorridos = [...cadetData.recorridos];

        if (!available) {
            const recorridoToUpdate = recorridos.find(r => !r.salio);
            if (recorridoToUpdate) {
                recorridoToUpdate.salio = new Date();
                updatedData.recorridos = recorridos;
            }
        } else {
            const recorridoToUpdate = recorridos.reverse().find(r => r.salio && !r.regreso);
            if (recorridoToUpdate) {
                recorridoToUpdate.regreso = new Date();
                updatedData.recorridos = recorridos;
            }
        }
    }

    await updateDoc(cadetRef, updatedData);
};