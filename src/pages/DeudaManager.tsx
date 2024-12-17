import React, { useState, useEffect, useRef } from "react";
import currencyFormat from "../helpers/currencyFormat";
import {
	getInversiones,
	createInversion,
	updateInversion,
	type Investor,
	type Investment,
} from "../firebase/Inversion";
import arrow from "../assets/arrowIcon.png";

interface InversionModalProps {
	isOpen: boolean;
	onClose: () => void;
	investor?: Investor;
	selectedInvestment?: Investment;
}

const InversionModal: React.FC<InversionModalProps> = ({
	isOpen,
	onClose,
	investor,
	selectedInvestment,
}) => {
	const [isNewInvestor, setIsNewInvestor] = useState(true);
	const [nombreInversor, setNombreInversor] = useState("");
	const [selectedInvestorId, setSelectedInvestorId] = useState("");
	const [monto, setMonto] = useState("");
	const [moneda, setMoneda] = useState("USD");
	const [deadline, setDeadline] = useState("");
	const [loading, setLoading] = useState(false);
	const [inversores, setInversores] = useState<Investor[]>([]);

	useEffect(() => {
		if (isOpen) {
			const fetchInversores = async () => {
				try {
					const data = await getInversiones();
					setInversores(data);
				} catch (error) {
					console.error("Error al obtener inversores:", error);
				}
			};
			fetchInversores();
		}
	}, [isOpen]);

	const modalRef = useRef<HTMLDivElement>(null);
	const [dragStart, setDragStart] = useState<number | null>(null);
	const [currentTranslate, setCurrentTranslate] = useState(0);
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		if (investor) {
			setNombreInversor(investor.id);
		}
		if (selectedInvestment) {
			setMonto(selectedInvestment.monto.toString());
			setMoneda(selectedInvestment.moneda);
			setDeadline(selectedInvestment.deadline.toISOString().split("T")[0]);
		} else {
			setMonto("");
			setMoneda("USD");
			setDeadline("");
		}
	}, [investor, selectedInvestment, isOpen]);

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

		const newInvestment: Investment = {
			monto: parseFloat(monto),
			moneda,
			deadline: new Date(deadline),
		};

		try {
			if (investor && selectedInvestment) {
				await updateInversion({
					investorId: investor.id,
					oldInvestment: selectedInvestment,
					newInvestment,
				});
			} else if (!isNewInvestor && selectedInvestorId) {
				const selectedInvestor = inversores.find(
					(inv) => inv.id === selectedInvestorId
				);
				if (selectedInvestor) {
					await updateInversion({
						investorId: selectedInvestorId,
						newInvestment,
					});
				}
			} else {
				await createInversion({
					nombreInversor,
					investment: newInvestment,
				});
			}

			onClose();
			window.location.reload();
		} catch (error) {
			console.error("Error al procesar la inversión:", error);
			alert("Error al procesar la inversión");
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

				<form onSubmit={handleSubmit} className="space-y-2 font-coolvetica">
					<div className="space-y-8">
						{!investor && (
							<>
								<div>
									<div className="mt-2 flex gap-2">
										<button
											type="button"
											className={` h-10 rounded-md font-bold flex-1 ${
												isNewInvestor
													? "bg-black text-white"
													: "bg-gray-300 text-black"
											}`}
											onClick={() => setIsNewInvestor(true)}
										>
											Nuevo
										</button>
										<button
											type="button"
											className={` h-10 rounded-md font-bold flex-1 ${
												!isNewInvestor
													? "bg-black text-white"
													: "bg-gray-300 text-black"
											}`}
											onClick={() => setIsNewInvestor(false)}
										>
											Existente
										</button>
									</div>
								</div>

								{isNewInvestor ? (
									<div>
										<input
											type="text"
											value={nombreInversor}
											placeholder="Nombre del inversor"
											onChange={(e) => setNombreInversor(e.target.value)}
											className=" block w-full h-10 rounded-md bg-gray-300 px-4 shadow-sm  text-sm"
											required
										/>
									</div>
								) : (
									<div>
										<select
											value={selectedInvestorId}
											onChange={(e) => setSelectedInvestorId(e.target.value)}
											className=" block w-full h-10 rounded-md bg-gray-300 px-4 appearance-none shadow-sm  text-sm"
											required
										>
											<option value="">Seleccionar...</option>
											{inversores.map((inversor) => (
												<option key={inversor.id} value={inversor.id}>
													{formatInvestorName(inversor.id)}
												</option>
											))}
										</select>
									</div>
								)}
							</>
						)}
					</div>

					<div>
						<input
							placeholder="Monto"
							type="number"
							value={monto}
							onChange={(e) => setMonto(e.target.value)}
							className=" block w-full h-10 rounded-md bg-gray-300 px-4 shadow-sm  text-sm"
							required
						/>
					</div>

					<div>
						<select
							value={moneda}
							onChange={(e) => setMoneda(e.target.value)}
							className=" block w-full h-10 rounded-md bg-gray-300 px-4 shadow-sm  text-sm appearance-none"
							required
						>
							<option value="ARS">ARS</option>
							<option value="USD">USD</option>
							<option value="EUR">EUR</option>
						</select>
					</div>

					<div>
						<input
							type="date"
							value={deadline}
							onChange={(e) => setDeadline(e.target.value)}
							className=" block w-full h-10 rounded-md bg-gray-300 px-4 shadow-sm  text-sm"
							required
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-black h-20 text-gray-100 font-bold rounded-lg text-3xl hover:bg-gray-800 transition-colors disabled:bg-gray-400"
					>
						{loading ? (
							<div className="flex justify-center">
								<div className="flex flex-row gap-1">
									<div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
									<div className="w-2 h-2 bg-white rounded-full animate-pulse delay-75"></div>
									<div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150"></div>
								</div>
							</div>
						) : investor ? (
							"Actualizar"
						) : (
							"Agregar"
						)}
					</button>
				</form>
			</div>
		</div>
	);
};

// Esta es la fila comun
const InvestmentRow: React.FC<{
	investment: Investment;
	investor: Investor;
	showInvestor?: boolean;
	onEdit: (investor: Investor, investment: Investment) => void;
}> = ({ investment, investor, showInvestor = true, onEdit }) => (
	<tr className="text-black border font-light h-10 border-black border-opacity-20">
		{showInvestor && (
			<th scope="row" className="pl-4 w-1/4 font-light">
				{formatInvestorName(investor.id)}
			</th>
		)}
		{!showInvestor && <td className="pl-4 w-1/4" />}
		<td className="pl-4 w-1/4 font-light">
			{currencyFormat(investment.monto)}
		</td>
		<td className="pl-4 w-1/6 font-light">{investment.moneda}</td>
		<td className="pl-4 w-1/4 font-light">
			{investment.deadline.toLocaleDateString("es-AR")}
		</td>
		<td className="pl-4 pr-4 w-1/12 font-black text-2xl flex items-center justify-end h-full relative">
			<p
				className="absolute text-2xl top-[-4px] cursor-pointer"
				onClick={() => onEdit(investor, investment)}
			>
				...
			</p>
		</td>
	</tr>
);

// Esta es la fila agrupada
const formatInvestorName = (name: string) => {
	const parts = name.split(" ");
	if (parts.length > 1) {
		return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
	}
	return name;
};

const InvestorGroup: React.FC<{
	investor: Investor;
	onEdit: (investor: Investor, investment: Investment) => void;
}> = ({ investor, onEdit }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const sortedInvestments = [...investor.investments].sort(
		(a, b) => a.deadline.getTime() - b.deadline.getTime()
	);

	const firstDeadline = sortedInvestments[0].deadline;
	const lastDeadline = sortedInvestments[sortedInvestments.length - 1].deadline;
	const totalByCurrency = sortedInvestments.reduce((acc, inv) => {
		acc[inv.moneda] = (acc[inv.moneda] || 0) + inv.monto;
		return acc;
	}, {} as Record<string, number>);

	if (sortedInvestments.length === 1) {
		return (
			<InvestmentRow
				investment={sortedInvestments[0]}
				investor={investor}
				onEdit={onEdit}
			/>
		);
	}

	return (
		<>
			<tr
				className="text-black border font-light h-10 border-black border-opacity-20 cursor-pointer hover:bg-gray-50"
				onClick={() => setIsExpanded(!isExpanded)}
			>
				<th scope="row" className="pl-4 w-1/4 font-light">
					{formatInvestorName(investor.id)}
				</th>
				<td className="pl-4 w-1/4 font-light">
					{Object.entries(totalByCurrency).map(([currency, amount], index) => (
						<div key={currency}>
							{currencyFormat(amount)} {currency}
						</div>
					))}
				</td>
				<td className="pl-4 w-1/6 font-light">
					{Object.keys(totalByCurrency).join(", ")}
				</td>
				<td className="pl-4 w-1/4 font-light">
					{firstDeadline.toLocaleDateString("es-AR")} -{" "}
					{lastDeadline.toLocaleDateString("es-AR")}
				</td>
				<td className="w-1/12">
					{isExpanded ? (
						<img src={arrow} className="h-2  rotate-90 " />
					) : (
						<img src={arrow} className="h-2 rotate-180" />
					)}
				</td>
			</tr>
			{isExpanded &&
				sortedInvestments.map((investment, index) => (
					<tr key={index} className="text-black font-light h-10">
						<td className="pl-4 w-1/4 font-light">{index + 1}</td>
						<td className="pl-4 w-1/4 font-light">
							{currencyFormat(investment.monto)}
						</td>
						<td className="pl-4 w-1/6 font-light">{investment.moneda}</td>
						<td className="pl-4 w-1/4 font-light">
							{investment.deadline.toLocaleDateString("es-AR")}
						</td>
						<td className="pl-4 pr-4 w-1/12 font-black text-2xl flex items-center justify-end h-full relative">
							<p
								className="absolute text-2xl top-[-4px] cursor-pointer"
								onClick={() => onEdit(investor, investment)}
							>
								...
							</p>
						</td>
					</tr>
				))}
		</>
	);
};

export const DeudaManager: React.FC = () => {
	const [inversores, setInversores] = useState<Investor[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [selectedInvestor, setSelectedInvestor] = useState<
		Investor | undefined
	>();
	const [selectedInvestment, setSelectedInvestment] = useState<
		Investment | undefined
	>();

	useEffect(() => {
		const fetchInversiones = async () => {
			try {
				const inversionesData = await getInversiones();
				// Sort investors based on their earliest deadline
				const sortedInversores = inversionesData.sort((a, b) => {
					const aEarliestDeadline = Math.min(
						...a.investments.map((inv) => inv.deadline.getTime())
					);
					const bEarliestDeadline = Math.min(
						...b.investments.map((inv) => inv.deadline.getTime())
					);
					return aEarliestDeadline - bEarliestDeadline;
				});
				setInversores(sortedInversores);
				setLoading(false);
			} catch (err) {
				console.error("Error al obtener las inversiones:", err);
				setError("Error al cargar los datos");
				setLoading(false);
			}
		};

		fetchInversiones();
	}, []);

	const handleEdit = (investor: Investor, investment: Investment) => {
		setSelectedInvestor(investor);
		setSelectedInvestment(investment);
		setShowModal(true);
	};

	const handleCloseModal = () => {
		setShowModal(false);
		setSelectedInvestor(undefined);
		setSelectedInvestment(undefined);
	};

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
					className="bg-gray-300 gap-2 text-black rounded-full flex items-center pt-3 pb-4 pl-3 pr-4 h-10"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="h-6 mt-1"
					>
						<path
							fill-rule="evenodd"
							d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
							clip-rule="evenodd"
						/>
					</svg>

					<p className="font-bold ">Nueva inversión</p>
				</button>
			</div>

			<div className="font-coolvetica">
				<table className="w-full text-xs text-left text-black">
					<thead className="text-black border-b h-10">
						<tr>
							<th scope="col" className="pl-4 w-1/4">
								Inversor
							</th>
							<th scope="col" className="pl-4 w-1/4">
								Monto
							</th>
							<th scope="col" className="pl-4 w-1/6">
								Moneda
							</th>
							<th scope="col" className="pl-4 w-1/4">
								Deadline
							</th>
							<th scope="col" className="pl-4 w-1/12"></th>
						</tr>
					</thead>
					<tbody>
						{inversores.map((investor) => (
							<InvestorGroup
								key={investor.id}
								investor={investor}
								onEdit={handleEdit}
							/>
						))}
					</tbody>
				</table>
			</div>

			<InversionModal
				isOpen={showModal}
				onClose={handleCloseModal}
				investor={selectedInvestor}
				selectedInvestment={selectedInvestment}
			/>
		</div>
	);
};

export default DeudaManager;
