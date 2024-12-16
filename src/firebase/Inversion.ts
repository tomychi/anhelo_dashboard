import { collection, getDocs, getFirestore } from "firebase/firestore";

export interface Inversion {
	Deadline: Date;
	Monto: number;
	id: string;
}

export const getInversiones = async (): Promise<Inversion[]> => {
	const firestore = getFirestore();

	try {
		const inversionesCollection = collection(firestore, "inversion");
		const inversionesSnapshot = await getDocs(inversionesCollection);

		return inversionesSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
			Deadline: doc.data().Deadline?.toDate(), // Convertir Timestamp a Date
		})) as Inversion[];
	} catch (error) {
		console.error("Error al obtener las inversiones:", error);
		throw error;
	}
};
