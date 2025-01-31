export interface PedidoDetalle {
    burger: string;
    costoBurger: number;
    priceBurger: number;
    priceToppings: number;
    quantity: number;
    subTotal: number;
    toppings: any[];
}

export interface DetallePedido {
    id: string;
    direccion: string;
    distancia: number;
    tiempoEspera: number;
    tiempoPercibidoESTIMADO: number;
    estadoCocina: string;
    fecha: string;
    hora: string;
    telefono: string;
    metodoPago: string;
    total: number;
    subTotal: number;
    envio: number;
    envioExpress: number;
    map: number[];
    detallePedido: PedidoDetalle[];
    aclaraciones: string;
    referencias: string;
    ubicacion: string;
    cerca: boolean;
    elaborado: boolean;
    paid: boolean;
    pendingOfBeingAccepted: boolean;
    deliveryMethod: string;
    couponCodes: string[];
}

export interface RecorridoData {
    date: Date;
    datosEstimados: {
        totalDistance: number;
        totalTime: number;
        costoPorEntrega: number;
        horaRegreso: string;
        peorEntrega: {
            tiempo: number;
            direccion: string;
        },
        pedidos: {
            id: string;
            direccion: string;
            distancia: number;
            tiempoEspera: number;
            tiempoPercibido: number;
            estado: string;
            metodoPago: string;
            total: number;
        }[]
    };
    datosDiferencial?: {
        totalDistance: number;
        totalTime: number;
        pedidos?: {
            id: string;
            tiempoReal: number;
            distanciaReal: number;
        }[]
    };
    salio?: Date;
    regreso?: Date;
}

export interface CadetData {
    id?: string;
    name: string;
    available: boolean;
    recorridos: RecorridoData[];
    lastSession: Date;
}