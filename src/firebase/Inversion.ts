// Inversion.ts
import {
	collection,
	getDocs,
	getFirestore,
	setDoc,
	doc,
} from "firebase/firestore";

export interface Inversion {
	Deadline: Date;
	Monto: number;
	id: string;
}

export interface NewInversion {
	nombreInversor: string;
	monto: number;
	deadline: Date;
}

export const getInversiones = async (): Promise<Inversion[]> => {
	const firestore = getFirestore();

	try {
		const inversionesCollection = collection(firestore, "inversion");
		const inversionesSnapshot = await getDocs(inversionesCollection);

		const inversiones = inversionesSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
			Deadline: doc.data().Deadline?.toDate(),
		})) as Inversion[];

		return inversiones;
	} catch (error) {
		console.error("Error al obtener las inversiones:", error);
		throw error;
	}
};

export const createInversion = async (
	inversion: NewInversion
): Promise<void> => {
	const firestore = getFirestore();
	const inversionesCollection = collection(firestore, "inversion");

	try {
		await setDoc(doc(inversionesCollection, inversion.nombreInversor), {
			Monto: inversion.monto,
			Deadline: inversion.deadline,
		});
	} catch (error) {
		console.error("Error al crear la inversión:", error);
		throw error;
	}
};
