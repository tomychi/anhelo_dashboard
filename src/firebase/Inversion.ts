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
import currencyFormat from "../helpers/currencyFormat";

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
		console.log("🔵 Iniciando fetch de inversiones...");
		const inversionesCollection = collection(firestore, "inversion");
		const inversionesSnapshot = await getDocs(inversionesCollection);

		console.log("📄 Documentos encontrados:", inversionesSnapshot.size);

		const inversores = inversionesSnapshot.docs.map((doc) => {
			const data = doc.data();
			console.log(`\n🔍 Analizando inversor: ${doc.id}`);
			console.log("📋 Data cruda del documento:", data);

			const investments = (data.investments || []).map((inv: any) => {
				const investment = {
					...inv,
					deadline: inv.deadline?.toDate(),
				};
				console.log("💰 Inversión procesada:", {
					monto: investment.monto,
					moneda: investment.moneda,
					deadline: investment.deadline,
				});
				return investment;
			});

			return {
				id: doc.id,
				investments,
			};
		}) as Investor[];

		console.log("\n📊 Resumen de inversores:");
		inversores.forEach((inversor) => {
			console.log(`\n👤 ${inversor.id}:`);
			console.log(`   Total de inversiones: ${inversor.investments.length}`);
			console.log(
				"   Inversiones:",
				inversor.investments.map((inv) => ({
					monto: currencyFormat(inv.monto),
					moneda: inv.moneda,
					deadline: inv.deadline.toLocaleDateString("es-AR"),
				}))
			);
		});

		return inversores;
	} catch (error) {
		console.error("❌ Error al obtener las inversiones:", error);
		throw error;
	}
};

export const createInversion = async (
	inversion: NewInvestment
): Promise<void> => {
	const firestore = getFirestore();
	const inversionesCollection = collection(firestore, "inversion");

	try {
		console.log("🟢 Creando nueva inversión:", {
			nombreInversor: inversion.nombreInversor,
			investment: {
				monto: currencyFormat(inversion.investment.monto),
				moneda: inversion.investment.moneda,
				deadline: inversion.investment.deadline.toLocaleDateString("es-AR"),
			},
		});

		await setDoc(doc(inversionesCollection, inversion.nombreInversor), {
			investments: [inversion.investment],
		});

		console.log("✅ Inversión creada exitosamente");
	} catch (error) {
		console.error("❌ Error al crear la inversión:", error);
		throw error;
	}
};

export const updateInversion = async (
	params: UpdateInvestment
): Promise<void> => {
	const firestore = getFirestore();
	const inversionDoc = doc(firestore, "inversion", params.investorId);

	try {
		console.log("🔄 Actualizando inversión para:", params.investorId);

		if (params.oldInvestment) {
			console.log("📤 Removiendo inversión anterior:", {
				monto: currencyFormat(params.oldInvestment.monto),
				moneda: params.oldInvestment.moneda,
				deadline: params.oldInvestment.deadline.toLocaleDateString("es-AR"),
			});

			await updateDoc(inversionDoc, {
				investments: arrayRemove(params.oldInvestment),
			});
		}

		console.log("📥 Agregando nueva inversión:", {
			monto: currencyFormat(params.newInvestment.monto),
			moneda: params.newInvestment.moneda,
			deadline: params.newInvestment.deadline.toLocaleDateString("es-AR"),
		});

		await updateDoc(inversionDoc, {
			investments: arrayUnion(params.newInvestment),
		});

		console.log("✅ Inversión actualizada exitosamente");
	} catch (error) {
		console.error("❌ Error al actualizar la inversión:", error);
		throw error;
	}
};
