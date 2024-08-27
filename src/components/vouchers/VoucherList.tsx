import React, { useState, useEffect } from 'react';
import {
  obtenerVouchers,
  obtenerTitulosVouchers,
} from '../../firebase/voucher';

interface Voucher {
  codigo: string;
  estado: 'disponible' | 'usado';
}

export const VoucherList: React.FC = () => {
  const [titulos, setTitulos] = useState<string[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTitulo, setSelectedTitulo] = useState<string | null>(null);

  useEffect(() => {
    const fetchTitulos = async () => {
      try {
        const fetchedTitulos = await obtenerTitulosVouchers();
        setTitulos(fetchedTitulos);
      } catch (error) {
        console.error('Error al obtener los títulos de vouchers:', error);
      }
    };
    fetchTitulos();
  }, []);

  const handleTituloClick = async (titulo: string) => {
    setLoading(true);
    setSelectedTitulo(titulo);
    try {
      const fetchedVouchers = await obtenerVouchers(titulo);
      setVouchers(fetchedVouchers);
    } catch (error) {
      console.error('Error al buscar vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyVoucher = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    alert(`Código ${codigo} copiado al portapapeles`);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-4">Vouchers Disponibles</h2>
      <ul className="list-disc pl-5 mb-4">
        {titulos.map((titulo, index) => (
          <li
            key={index}
            className={`cursor-pointer ${
              selectedTitulo === titulo ? 'font-bold' : ''
            }`}
            onClick={() => handleTituloClick(titulo)}
          >
            {titulo}
          </li>
        ))}
      </ul>

      {selectedTitulo && (
        <>
          <h3 className="text-xl font-bold mb-4">
            Vouchers para {selectedTitulo}
          </h3>
          <ul className="list-disc pl-5">
            {loading ? (
              <li>Cargando vouchers...</li>
            ) : (
              vouchers.map((voucher, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center mb-2"
                >
                  <span>
                    {voucher.codigo} - {voucher.estado}
                  </span>
                  <button
                    onClick={() => handleCopyVoucher(voucher.codigo)}
                    className="bg-green-500 text-white py-1 px-2 rounded-lg hover:bg-green-600"
                  >
                    Copiar
                  </button>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
};
