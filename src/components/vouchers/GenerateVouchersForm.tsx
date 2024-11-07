import { useState } from 'react';
import { crearVoucher } from '../../firebase/voucher';
import { VoucherList } from './VoucherList';

export const GenerateVouchersForm = () => {
  const [showForm, setShowForm] = useState(false);
  const [cantidad, setCantidad] = useState(0);
  const [loading, setLoading] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState('');

  const handleCreateVoucher = async () => {
    setLoading(true);
    try {
      await crearVoucher(titulo, fecha, cantidad);
      alert('Voucher creado exitosamente');
      setTitulo('');
      setFecha('');
    } catch (error) {
      alert('Error al crear el voucher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="mt-11">
        <div className="w-1/5 bg-black h-[0.5px]"></div>

        <p className="text-black font-medium text-2xl px-4 mt-2">2x1 Manager</p>
      </div>
      <div className="p-4 flex flex-col gap-4">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="text-gray-100 w-full h-10 px-4 bg-black font-medium rounded-md outline-none"
          >
            Crear nueva campaña
          </button>
        ) : (
          <>
            <input
              type="text"
              placeholder="Título del voucher"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
            />
            <input
              type="date"
              placeholder="Fecha del voucher"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
            />

            <input
              type="number"
              placeholder="Cantidad de códigos a generar"
              value={cantidad || ''}
              onChange={(e) => {
                const value = e.target.value;
                setCantidad(value === '' ? 0 : parseInt(value, 10));
              }}
              className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
            />

            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handleCreateVoucher}
                disabled={loading}
                className="text-gray-100 w-full h-10 px-4 bg-black font-medium rounded-md outline-none"
              >
                {loading ? 'Generando...' : 'Generar campa'}
              </button>
            </div>
          </>
        )}
      </div>
      <VoucherList />
    </div>
  );
};
