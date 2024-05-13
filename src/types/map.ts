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
