import { ComandaRareProps } from '../../../types/types';
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

export const CardComanda = ({ comanda }: ComandaRareProps) => {
  const {
    aclaraciones,
    direccion,
    hora,
    metodoPago,
    total,
    telefono,
    detallePedido,
    elaborado,
    referencias,
    id,
    piso,
    fecha,
    cadete,
    tiempoElaborado,
    tiempoEntregado,
    entregado,
  } = comanda;
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div
      className={`flex justify-center font-antonio uppercase flex-col  max-w-sm  overflow-hidden h-min p-4 ${
        elaborado ? 'bg-green-500 hover:bg-custom-red' : 'bg-custom-red'
      }`}
    >
      <CardComandaHeader user={user} hora={hora} id={id} fecha={fecha} />

      <CardComandaInfo
        direccion={direccion}
        piso={piso}
        referencias={referencias}
        telefono={telefono}
        metodoPago={metodoPago}
        total={total}
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
