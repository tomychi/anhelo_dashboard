export interface DetallePedidoItem {
  burger: string;
  priceBurger: number;
  priceToppings: number;
  quantity: number;
  subTotal: number;
  toppings: string[];
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
  total: number;
  id: string;
}

export interface ReadDataProps {
  comanda: PedidoProps;
}

export interface ComandaProps {
  data: PedidoProps;
  id: string;
}

export interface ComandaRareProps {
  comanda: PedidoProps;
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

export interface InfoItemProps {
  description: string;
  img: string;
  name: string;
  price: number;
  type: string;
}

export interface InfoDataProps {
  data: InfoItemProps;
  id: string;
  collectionName?: string;
}
