import React, { useEffect, useState } from 'react';
import {
  generarVouchers,
  obtenerTitulosVouchers,
  subirCodigosExistentes,
  VoucherTituloConFecha,
} from '../../firebase/voucher';
import { VoucherList } from './VoucherList';

export const GenerateVouchersForm = () => {
  const [showForm, setShowForm] = useState(false);
  const [cantidad, setCantidad] = useState(0);
  const [titulo, setTitulo] = useState(''); // Título del nuevo voucher
  const [loading, setLoading] = useState(false);
  const [voucherTitles, setVoucherTitles] = useState<VoucherTituloConFecha[]>(
    []
  );
  const [selectedTitles, setSelectedTitles] = useState<{
    [key: string]: number;
  }>({});

  useEffect(() => {
    const fetchVouchers = async () => {
      setLoading(true);
      try {
        const allVoucherTitles = await obtenerTitulosVouchers();
        setVoucherTitles(allVoucherTitles);
      } catch (error) {
        console.error('Error al obtener todos los vouchers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, []);

  const handleTitleChange = (title: string, cantidadTransferir: number) => {
    setSelectedTitles((prev) => ({
      ...prev,
      [title]: cantidadTransferir,
    }));
  };

  const handleGenerateVouchers = async () => {
    setLoading(true);
    try {
      const checkedTitles = Object.entries(selectedTitles).filter(
        ([, checked]) => checked
      );

      if (checkedTitles.length === 0) {
        // Si no hay ningún título seleccionado, generar vouchers para el nuevo título
        await generarVouchers(cantidad, titulo);
      } else {
        // Si hay un título seleccionado, transferir códigos desde el título seleccionado al nuevo
        const [title] = checkedTitles[0];
        const voucher = voucherTitles.find((v) => v.titulo === title);

        if (voucher) {
          const cantidadDisponible = voucher.creados - voucher.usados;
          await generarVouchers(cantidad, titulo, title, cantidadDisponible);
        }
      }

      alert('Vouchers generados y almacenados correctamente');
      setShowForm(false);
      setCantidad(0);
      setTitulo('');
      setSelectedTitles({});
    } catch (error) {
      console.error('Error al generar y almacenar vouchers:', error);
      alert('Error al generar vouchers');
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
              value={titulo} // Campo para ingresar el título del nuevo voucher
              placeholder="Título de la campaña"
              onChange={(e) => setTitulo(e.target.value)}
              className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
            />
            <input
              type="number"
              placeholder="Cantidad de códigos necesarios"
              value={cantidad || ''}
              onChange={(e) => {
                const value = e.target.value;
                setCantidad(value === '' ? 0 : parseInt(value, 10));
              }}
              className="custom-bg block w-full h-10 px-4 text-xs font-light text-black bg-gray-300 border-black rounded-md appearance-none focus:outline-none focus:ring-0"
            />
            <div className="flex flex-col mt-4">
              {voucherTitles.map((voucher) => {
                const disponibles = voucher.creados - voucher.usados;
                return (
                  <div key={voucher.titulo} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={!!selectedTitles[voucher.titulo]}
                      onChange={(e) =>
                        handleTitleChange(
                          voucher.titulo,
                          e.target.checked ? cantidad : 0
                        )
                      }
                      className="mr-2"
                    />
                    <label>
                      {voucher.titulo} - {disponibles} disponibles
                    </label>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handleGenerateVouchers}
                disabled={loading}
                className="text-gray-100 w-full h-10 px-4 bg-black font-medium rounded-md outline-none"
              >
                {loading ? 'Generando...' : 'Generar'}
              </button>
            </div>
          </>
        )}
      </div>
      <VoucherList />
    </div>
  );
};
