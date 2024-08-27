import { useState } from 'react';
import { generarVouchers } from '../../firebase/voucher';
import { VoucherList } from './VoucherList';

export const GenerateVouchersForm = () => {
  const [cantidad, setCantidad] = useState<number>(0);
  const [titulo, setTitulo] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleGenerateVouchers = async () => {
    setLoading(true);
    try {
      await generarVouchers(cantidad, titulo);
      alert('Vouchers generados y almacenados correctamente');
    } catch (error) {
      console.error('Error al generar y almacenar vouchers:', error);
      alert('Error al generar vouchers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-4">Generar Vouchers</h2>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Título:
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Cantidad:
        </label>
        <input
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(parseInt(e.target.value, 10))}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div className="flex justify-between items-center">
        <button
          onClick={handleGenerateVouchers}
          disabled={loading}
          className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Generando...' : 'Generar Vouchers'}
        </button>
      </div>
      <VoucherList />
    </div>
  );
};
