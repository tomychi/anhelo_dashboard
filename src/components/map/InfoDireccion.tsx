import { useContext } from 'react';
import { MapContext } from '../../context';

export const InfoDireccion = () => {
  const { info } = useContext(MapContext);

  return (
    <div className="bg-blue-500 hover:bg-blue-700 text-white font-bold  px-4 rounded-lg">
      {info && (
        <div>
          <p>Hay: {info.kms} km</p>
          <p>Tarda: {info.minutes} m</p>
        </div>
      )}
    </div>
  );
};
