import React, { useState, useEffect } from 'react';
import { obtenerTodosLosVouchers, Voucher } from '../../firebase/voucher';

export const VoucherList: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchVouchers = async () => {
      setLoading(true);
      try {
        const allVouchers = await obtenerTodosLosVouchers();
        setVouchers(allVouchers);
      } catch (error) {
        console.error('Error al obtener todos los vouchers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, []);

  useEffect(() => {
    setFilteredVouchers(vouchers.filter((v) => v.estado === 'disponible'));
  }, [vouchers]);

  const handleCopyVoucher = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    alert(`Código ${codigo} copiado al portapapeles`);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-4">Vouchers Disponibles</h2>
      <ul className="list-disc pl-5 mb-4">
        {loading ? (
          <li>Cargando vouchers...</li>
        ) : filteredVouchers.length > 0 ? (
          filteredVouchers.map((voucher, index) => (
            <li key={index} className="flex justify-between items-center mb-2">
              <span>
                {voucher.codigo} - {voucher.estado} ----- {voucher.titulo}
              </span>
              <button
                onClick={() => handleCopyVoucher(voucher.codigo)}
                className="bg-green-500 text-white py-1 px-2 rounded-lg hover:bg-green-600"
              >
                Copiar
              </button>
            </li>
          ))
        ) : (
          <li>No hay vouchers disponibles.</li>
        )}
      </ul>
    </div>
  );
};
