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

export interface DetallePedidoProps {
  burger?: string;
  toppings: string[];
  quantity?: number;
  priceBurger?: number;
  priceToppings?: number;
  subTotal: number;
}

export interface OrderDetailProps {
  envio: number;
  detallePedido: DetallePedidoProps[];
  subTotal: number;
  total: number;
  fecha: string;
  aclaraciones: string;
  metodoPago: string;
  direccion: string;
  telefono: string;
  hora: string;
  cerca?: boolean;
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
