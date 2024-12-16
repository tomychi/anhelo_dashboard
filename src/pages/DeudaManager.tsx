import React, { useState, useEffect, useRef } from "react";
import { getInversiones, type Inversion } from "../firebase/Inversion";
import { setDoc, doc, collection, getFirestore } from "firebase/firestore";
import currencyFormat from "../helpers/currencyFormat";

interface InversionModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const InversionModal: React.FC<InversionModalProps> = ({ isOpen, onClose }) => {
	const [nombreInversor, setNombreInversor] = useState("");
	const [monto, setMonto] = useState("");
	const [deadline, setDeadline] = useState("");
	const [loading, setLoading] = useState(false);
	const modalRef = useRef<HTMLDivElement>(null);
	const [dragStart, setDragStart] = useState<number | null>(null);
	const [currentTranslate, setCurrentTranslate] = useState(0);
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setIsAnimating(true);
			setCurrentTranslate(0);
		}
	}, [isOpen]);

	const handleTouchStart = (e: React.TouchEvent) => {
		setDragStart(e.touches[0].clientY);
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		setDragStart(e.clientY);
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (dragStart === null) return;
		const currentPosition = e.touches[0].clientY;
		const difference = currentPosition - dragStart;
		if (difference < 0) return;
		setCurrentTranslate(difference);
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (dragStart === null) return;
		const difference = e.clientY - dragStart;
		if (difference < 0) return;
		setCurrentTranslate(difference);
	};

	const handleDragEnd = () => {
		if (currentTranslate > 200) {
			onClose();
		} else {
			setCurrentTranslate(0);
		}
		setDragStart(null);
	};

	useEffect(() => {
		const handleMouseUp = () => {
			if (dragStart !== null) {
				handleDragEnd();
			}
		};

		window.addEventListener("mouseup", handleMouseUp);
		window.addEventListener("touchend", handleDragEnd);

		return () => {
			window.removeEventListener("mouseup", handleMouseUp);
			window.removeEventListener("touchend", handleDragEnd);
		};
	}, [dragStart, currentTranslate]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const firestore = getFirestore();
			const inversionesCollection = collection(firestore, "inversion");

			await setDoc(doc(inversionesCollection, nombreInversor), {
				Monto: parseFloat(monto),
				Deadline: new Date(deadline),
			});

			onClose();
			window.location.reload(); // Refresh to show new data
		} catch (error) {
			console.error("Error al agregar inversión:", error);
			alert("Error al agregar la inversión");
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-end justify-center">
			<div
				className={`absolute inset-0 bg-black transition-opacity duration-300 ${
					isAnimating ? "bg-opacity-50" : "bg-opacity-0"
				}`}
				style={{
					opacity: Math.max(0, 1 - currentTranslate / 400),
				}}
				onClick={onClose}
			/>
			<div
				ref={modalRef}
				className={`relative bg-white w-full max-w-lg rounded-t-lg px-4 pb-4 pt-12 transition-transform duration-300 touch-none ${
					isAnimating ? "translate-y-0" : "translate-y-full"
				}`}
				style={{
					transform: `translateY(${currentTranslate}px)`,
				}}
			>
				<div
					className="absolute top-0 left-0 right-0 h-12 cursor-grab active:cursor-grabbing"
					onTouchStart={handleTouchStart}
					onTouchMove={handleTouchMove}
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
				>
					<div className="absolute top-2 left-1/2 transform -translate-x-1/2">
						<div className="w-12 h-1 bg-gray-300 rounded-full" />
					</div>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Nombre del Inversor
						</label>
						<input
							type="text"
							value={nombreInversor}
							onChange={(e) => setNombreInversor(e.target.value)}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black text-sm"
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Monto
						</label>
						<input
							type="number"
							value={monto}
							onChange={(e) => setMonto(e.target.value)}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black text-sm"
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Deadline
						</label>
						<input
							type="date"
							value={deadline}
							onChange={(e) => setDeadline(e.target.value)}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black text-sm"
							required
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-black text-white rounded-lg py-2 px-4 hover:bg-gray-800 transition-colors disabled:bg-gray-400"
					>
						{loading ? (
							<div className="flex justify-center">
								<div className="flex flex-row gap-1">
									<div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
									<div className="w-2 h-2 bg-white rounded-full animate-pulse delay-75"></div>
									<div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150"></div>
								</div>
							</div>
						) : (
							"Agregar Inversor"
						)}
					</button>
				</form>
			</div>
		</div>
	);
};

export const DeudaManager: React.FC = () => {
	const [inversiones, setInversiones] = useState<Inversion[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showModal, setShowModal] = useState(false);

	useEffect(() => {
		const fetchInversiones = async () => {
			try {
				const inversionesData = await getInversiones();
				setInversiones(inversionesData);
				setLoading(false);
			} catch (err) {
				console.error("Error al obtener las inversiones:", err);
				setError("Error al cargar los datos");
				setLoading(false);
			}
		};

		fetchInversiones();
	}, []);

	if (loading) {
		return <div className="p-4">Cargando inversiones...</div>;
	}

	if (error) {
		return <div className="p-4 text-red-500">{error}</div>;
	}

	return (
		<div className="flex flex-col">
			<div className="flex flex-row justify-between font-coolvetica items-center mt-8 mx-4 mb-4">
				<p className="text-black font-bold text-4xl mt-1">Deuda</p>
				<button
					onClick={() => setShowModal(true)}
					className="bg-black text-gray-100 rounded-lg px-4 py-2 text-sm hover:bg-gray-800 transition-colors"
				>
					+ Nuevo inversor
				</button>
			</div>

			<div className="font-coolvetica">
				<table className="w-full text-xs text-left text-black">
					<thead className="text-black border-b h-10">
						<tr>
							<th scope="col" className="pl-4 w-2/5">
								Inversor
							</th>
							<th scope="col" className="pl-4 w-1/4">
								Monto
							</th>
							<th scope="col" className="pl-4 w-1/4">
								Deadline
							</th>
							<th scope="col" className="pl-4 w-1/6"></th>
						</tr>
					</thead>
					<tbody>
						{inversiones.map((inversion) => (
							<tr
								key={inversion.id}
								className="text-black border font-light h-10 border-black border-opacity-20"
							>
								<th scope="row" className="pl-4 w-2/5 font-light">
									{inversion.id}
								</th>
								<td className="pl-4 w-1/4 font-light">
									{currencyFormat(inversion.Monto)}
								</td>
								<td className="pl-4 w-1/4 font-light">
									{inversion.Deadline.toLocaleDateString("es-AR")}
								</td>
								<td className="pl-4 pr-4 w-1/6 font-black text-2xl flex items-center justify-end h-full relative">
									<p className="absolute text-2xl top-[-4px] cursor-pointer">
										...
									</p>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<InversionModal isOpen={showModal} onClose={() => setShowModal(false)} />
		</div>
	);
};

export default DeudaManager;
