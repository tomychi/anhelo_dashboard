import {
	collection,
	getDocs,
	getFirestore,
	setDoc,
	doc,
	updateDoc,
	arrayUnion,
	arrayRemove,
} from "firebase/firestore";

export interface Investment {
	monto: number;
	deadline: Date;
	moneda: string;
}

export interface Investor {
	id: string;
	investments: Investment[];
}

export interface NewInvestment {
	nombreInversor: string;
	investment: Investment;
}

export interface UpdateInvestment {
	investorId: string;
	oldInvestment?: Investment;
	newInvestment: Investment;
}

export const getInversiones = async (): Promise<Investor[]> => {
	const firestore = getFirestore();

	try {
		const inversionesCollection = collection(firestore, "inversion");
		const inversionesSnapshot = await getDocs(inversionesCollection);

		const inversores = inversionesSnapshot.docs.map((doc) => ({
			id: doc.id,
			investments: (doc.data().investments || []).map((inv: any) => ({
				...inv,
				deadline: inv.deadline?.toDate(),
			})),
		})) as Investor[];

		return inversores;
	} catch (error) {
		console.error("Error al obtener las inversiones:", error);
		throw error;
	}
};

export const createInversion = async (
	inversion: NewInvestment
): Promise<void> => {
	const firestore = getFirestore();
	const inversionesCollection = collection(firestore, "inversion");

	try {
		await setDoc(doc(inversionesCollection, inversion.nombreInversor), {
			investments: [inversion.investment],
		});
	} catch (error) {
		console.error("Error al crear la inversión:", error);
		throw error;
	}
};

export const updateInversion = async (
	params: UpdateInvestment
): Promise<void> => {
	const firestore = getFirestore();
	const inversionDoc = doc(firestore, "inversion", params.investorId);

	try {
		if (params.oldInvestment) {
			// Replace old investment with new one
			await updateDoc(inversionDoc, {
				investments: arrayRemove(params.oldInvestment),
			});
		}

		await updateDoc(inversionDoc, {
			investments: arrayUnion(params.newInvestment),
		});
	} catch (error) {
		console.error("Error al actualizar la inversión:", error);
		throw error;
	}
};
