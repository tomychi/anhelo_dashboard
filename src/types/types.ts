export interface DetallePedidoItem {
	burger: string;
	priceBurger: number;
	priceToppings: number;
	quantity: number;
	subTotal: number;
	toppings: string[];
	costoBurger: number;
}

export interface PedidoProps {
	aclaraciones: string;
	detallePedido: DetallePedidoItem[];
	direccion: string;
	elaborado: boolean;
	envio: number;
	fecha: string;
	hora: string;
	metodoPago: string;
	subTotal: number;
	telefono: string;
	paid: boolean;
	cookNow: boolean;
	total: number;
	efectivoCantidad: number;
	mercadopagoCantidad: number;
	referencias: string;
	id: string;
	ubicacion: string;
	cadete: string;
	dislike: boolean;
	delay: boolean;
	tiempoElaborado: string;
	tiempoEntregado: string;
	entregado: boolean;
	map: [number, number];
	kms: number;
	minutosDistancia: number;
	cerca?: boolean;
	rating?: Rating;
}

export interface Rating {
	presentacion?: number;
	tiempo?: number;
	temperatura?: number;
	pagina?: number;
	// Agrega más propiedades de calificación si es necesario
}

export interface ReadDataProps {
	comanda: PedidoProps;
}

export interface ComandaProps {
	data: PedidoProps;
	id: string;
}

export interface ToppingsProps {
	name: string;
	id?: string;
	price?: number;
}
export interface ItemProps {
	quantity: number;
	name: string;
	price: number;
	toppings: ToppingsProps[];
	description?: string;
	img?: string;
	type?: string;
}

export interface FormCustomProps {
	cart: ItemProps[];
	total: number;
}

export interface ValuesProps {
	subTotal: number;
	fullName: string;
	phone: string;
	deliveryMethod: string;
	address: string;
	references: string;
	isFlat: boolean;
	floorAndNumber: string;
	paymentMethod: string;
	money: string;
}
export interface FormSubmitProps {
	values: ValuesProps;
	cart: ItemProps[];
	total: number;
	envio: number;
}

export interface ProductoMaterial {
	id: string;
	nombre: string;
	categoria: string;
	costo: number;
	unit: string;
	precioVenta?: number;
	ganancia?: number;
	unidadPorPrecio: number;
	stock?: number;
}

export interface TelefonosProps {
	fecha: string;
	telefono: string;
}

export interface CustomerType {
	existingCustomers: PedidoProps[];
	newCustomers: PedidoProps[];
}

export interface Cadete {
	id: string;
	name?: string;
	available?: boolean;
	category?: string;
	vueltas?: Vuelta[];
}
export interface Vuelta {
	startTime: Date;
	endTime?: Date;
	rideId: string;
	status: string;
	totalDistance: number;
	totalDuration: number;
	paga: number;
	orders: PedidoProps[];
}

export interface CadeteData {
	precioPorKM: number;
	precioPuntoEntrega: number;
}

export interface Gasto {
	id: string;
	category: string;
	description: string;
	estado: string;
	fecha: string;
	name: string;
	quantity: number;
	total: number;
	unit: string;
}
