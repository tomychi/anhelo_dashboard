import { Feature, Point, GeoJsonProperties } from 'geojson';
export interface PointHopper {
  [key: string]: Feature<Point, GeoJsonProperties>;
}

export interface CoordinatesProps {
  lng: number;
  lat: number;
}

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
  total: number;
  referencias: string;
  id: string;
  piso: string;
  cadete: string;
  dislike: boolean;
  delay: boolean;
  tiempoElaborado: string;
  tiempoEntregado: string;
  entregado: boolean;
  map: [number, number];
}
