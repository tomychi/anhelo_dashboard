import {
  updateTiempoElaboradoForOrder,
  updateTiempoEntregaForOrder,
} from '../../../firebase/UploadOrder';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/configureStore';
import { SelectCadete } from '../SelectCadete';

import {
  CardComandaHeader,
  CardComandaInfo,
  CardComdandaBody,
  CardComandaFooter,
} from '../Card';
import {
  obtenerColorTailwind,
  obtenerDiferenciaHorariaWithColor,
} from '../../../helpers/calculateDiffHours';
import { useEffect, useState } from 'react';
import { obtenerDiferenciaHoraria } from '../../../helpers/dateToday';
import { PedidoProps } from '../../../types/types';

interface CardComandaProps extends PedidoProps {
  cadetes: string[];
}

export const CardComanda = ({
  aclaraciones,
  detallePedido,
  direccion,
  elaborado,
  envio,
  fecha,
  hora,
  metodoPago,
  subTotal,
  telefono,
  total,
  efectivoCantidad,
  referencias,
  id,
  ubicacion,
  cadete,
  dislike,
  delay,
  tiempoElaborado,
  tiempoEntregado,
  entregado,
  map,
  kms,
  minutosDistancia,
}: CardComandaProps) => {
  const comanda = {
    aclaraciones,
    detallePedido,
    direccion,
    elaborado,
    envio,
    fecha,
    hora,
    metodoPago,
    subTotal,
    telefono,
    total,
    efectivoCantidad,
    referencias,
    id,
    ubicacion,
    cadete,
    dislike,
    delay,
    tiempoElaborado,
    tiempoEntregado,
    entregado,
    map,
    kms,
    minutosDistancia,
  };

  const { user } = useSelector((state: RootState) => state.auth);
  // Estado para almacenar la cantidad de minutos de demora
  const [minutosDeDemora, setMinutosDeDemora] = useState(
    obtenerDiferenciaHoraria(hora)
  );

  const [bgColor, setBgColor] = useState(obtenerColorTailwind(minutosDeDemora));

  // Efecto para actualizar la cantidad de minutos de demora cada minuto
  // Función para calcular y actualizar la cantidad de minutos de demora
  const actualizarMinutosDeDemora = () => {
    const nuevaDiferencia = obtenerDiferenciaHoraria(hora);

    // Actualizar el estado de bg-color
    setBgColor(obtenerColorTailwind(obtenerDiferenciaHorariaWithColor(hora)));

    setMinutosDeDemora(nuevaDiferencia);
  };

  // Actualiza la cantidad de minutos de demora cada minuto
  setInterval(actualizarMinutosDeDemora, 60000); // 60000 milisegundos = 1 minuto

  useEffect(() => {
    // Actualizar el estado de bg-color
    setBgColor(obtenerColorTailwind(obtenerDiferenciaHorariaWithColor(hora)));
  }, [hora]);

  return (
    <div
      className={`flex justify-center font-coolvetica uppercase flex-col max-w-sm overflow-hidden h-min p-4 
  ${bgColor}
   `}
    >
      <CardComandaHeader
        user={user}
        hora={hora}
        id={id}
        entregado={entregado}
        tiempoEntregado={tiempoEntregado}
        tiempoElaborado={tiempoElaborado}
        fecha={fecha}
        minutosDeDemora={minutosDeDemora}
      />

      <CardComandaInfo
        direccion={direccion}
        ubicacion={ubicacion}
        referencias={referencias}
        telefono={telefono}
        metodoPago={metodoPago}
        total={total}
        efectivoCantidad={efectivoCantidad}
        user={user}
        id={id}
        fecha={fecha}
        tiempoElaborado={tiempoElaborado}
        tiempoEntregado={tiempoEntregado}
        updateTiempoElaboradoForOrder={updateTiempoElaboradoForOrder}
        updateTiempoEntregaForOrder={updateTiempoEntregaForOrder}
        entregado={entregado}
      />

      <SelectCadete
        elaborado={elaborado}
        cadete={cadete}
        fecha={fecha}
        id={id}
      />

      <CardComdandaBody
        aclaraciones={aclaraciones}
        detallePedido={detallePedido}
      />

      <CardComandaFooter user={user} comanda={comanda} />
    </div>
  );
};
