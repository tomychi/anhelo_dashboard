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

		// Log del snapshot completo
		console.log("Snapshot completo:", inversionesSnapshot);

		const inversiones = inversionesSnapshot.docs.map((doc) => {
			// Log de cada documento individual
			console.log("Documento raw:", doc.data());

			const data = {
				id: doc.id,
				...doc.data(),
				Deadline: doc.data().Deadline?.toDate(),
			};

			// Log del documento procesado
			console.log("Documento procesado:", data);

			return data;
		}) as Inversion[];

		// Log del array final de inversiones
		console.log("Array final de inversiones:", inversiones);

		return inversiones;
	} catch (error) {
		console.error("Error detallado al obtener las inversiones:", error);
		throw error;
	}
};
