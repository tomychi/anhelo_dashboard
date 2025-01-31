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

interface PedidoDetalle {
    burger: string;
    costoBurger: number;
    priceBurger: number;
    priceToppings: number;
    quantity: number;
    subTotal: number;
    toppings: any[];
}

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
    salio?: Date;
    regreso?: Date;
    detallesPedidos: Array<{
        id: string;
        direccion: string;
        distancia: number;
        tiempoEspera: number;
        tiempoPercibido: number;
        estadoCocina: string;
        fecha: string;
        hora: string;
        telefono: string;
        metodoPago: string;
        total: number;
        subTotal: number;
        envio: number;
        envioExpress: number;
        map: number[];
        detallePedido: PedidoDetalle[];
        aclaraciones: string;
        referencias: string;
        ubicacion: string;
        cerca: boolean;
        elaborado: boolean;
        paid: boolean;
        pendingOfBeingAccepted: boolean;
        deliveryMethod: string;
        couponCodes: string[];
    }>;
}

interface CadetData {
    name: string;
    available: boolean;
    recorridos: RecorridoData[];
    lastSession: Date;
}

export const createCadet = async (phoneNumber: string, name: string): Promise<void> => {
    console.log('Creating new cadet:', { phoneNumber, name });
    const firestore = getFirestore();
    const cadetData: CadetData = {
        name,
        available: true,
        recorridos: [],
        lastSession: new Date(),
    };
    await setDoc(doc(firestore, 'riders2025', phoneNumber), cadetData);
    console.log('Cadet created successfully');
};

export const updateCadetRecorridos = async (
    name: string,
    recorridoData: RecorridoData
): Promise<void> => {
    console.log('Updating cadet recorridos for:', name);
    console.log('Recorrido data:', recorridoData);

    const phoneNumber = await findCadetPhoneByName(name);
    if (!phoneNumber) {
        console.error('Cadet not found:', name);
        throw new Error(`No se encontró un cadete con el nombre: ${name}`);
    }

    const firestore = getFirestore();
    const cadetRef = doc(firestore, 'riders2025', phoneNumber);
    const updatedRecorrido = {
        ...recorridoData,
        salio: new Date()
    };

    console.log('Adding new recorrido with salio timestamp:', updatedRecorrido);
    await updateDoc(cadetRef, {
        recorridos: arrayUnion(updatedRecorrido)
    });
    console.log('Recorrido updated successfully');
};

export const listenToActiveCadetes = (
    onCadetesChange: (cadetes: CadetData[]) => void
) => {
    console.log('Setting up active cadetes listener');
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
            console.log('Active cadetes updated:', updatedCadetes);
            onCadetesChange(updatedCadetes);
        }
    );
};

export const findCadetPhoneByName = async (name: string): Promise<string | null> => {
    console.log('Searching for cadet phone number by name:', name);
    const firestore = getFirestore();
    const cadetesQuery = query(
        collection(firestore, 'riders2025'),
        where('name', '==', name)
    );
    const cadetesSnapshot = await getDocs(cadetesQuery);

    if (cadetesSnapshot.empty) {
        console.log('No cadet found with name:', name);
        return null;
    }

    const phoneNumber = cadetesSnapshot.docs[0].id;
    console.log('Found phone number:', phoneNumber);
    return phoneNumber;
};

export const updateCadetAvailability = async (
    phoneNumber: string,
    available: boolean
): Promise<void> => {
    console.log('Updating cadet availability:', { phoneNumber, available });
    const firestore = getFirestore();
    const cadetRef = doc(firestore, 'riders2025', phoneNumber);

    // Obtener datos actuales del cadete
    const cadetDoc = await getDoc(cadetRef);
    const cadetData = cadetDoc.data() as CadetData;

    if (!cadetData) {
        console.error('Cadet data not found');
        return;
    }

    const updatedData: Partial<CadetData> = {
        available: available,
        lastSession: new Date()
    };

    if (cadetData.recorridos && cadetData.recorridos.length > 0) {
        const recorridos = [...cadetData.recorridos];
        const lastIndex = recorridos.length - 1;
        const lastRecorrido = recorridos[lastIndex];

        if (!available) { // Cuando el cadete sale (Salio)
            // Buscar el primer recorrido sin salio y actualizarlo
            const recorridoToUpdate = recorridos.find(r => !r.salio);
            if (recorridoToUpdate) {
                recorridoToUpdate.salio = new Date();
                updatedData.recorridos = recorridos;
            }
        } else { // Cuando el cadete regresa (Regreso)
            // Buscar el último recorrido con salio pero sin regreso
            const recorridoToUpdate = recorridos.reverse().find(r => r.salio && !r.regreso);
            if (recorridoToUpdate) {
                recorridoToUpdate.regreso = new Date();
                updatedData.recorridos = recorridos;
            }
        }
    }

    await updateDoc(cadetRef, updatedData);
    console.log('Availability updated successfully');
};