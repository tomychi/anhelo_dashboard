import React, { useEffect, useState } from 'react';
import {
  crearVoucher,
  generarCodigos,
  obtenerTitulosVouchers,
  VoucherTituloConFecha,
} from '../../firebase/voucher';
import { VoucherList } from './VoucherList';
import { SelectCodes } from './SelectCodes';

export const GenerateVouchersForm = () => {
  const [showForm, setShowForm] = useState(false);
  const [cantidad, setCantidad] = useState(0);
  const [loading, setLoading] = useState(false);
  const [voucherTitles, setVoucherTitles] = useState<VoucherTituloConFecha[]>(
    []
  );

  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState('');

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

  const handleGenerateVouchers = async () => {
    setLoading(true);
    try {
      await generarCodigos(cantidad);
      alert(`Se han generado y almacenado ${cantidad} códigos correctamente.`);
      setCantidad(0);
    } catch (error) {
      console.error('Error al generar y almacenar códigos:', error);
      alert('Error al generar códigos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVoucher = async () => {
    setLoading(true);
    try {
      await crearVoucher(titulo, fecha);
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

            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handleCreateVoucher}
                disabled={loading}
                className="text-gray-100 w-full h-10 px-4 bg-black font-medium rounded-md outline-none"
              >
                {loading ? 'Generando...' : 'Generar campa'}
              </button>
            </div>
            <div className="flex flex-col p-4 gap-4">
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
              <button
                onClick={handleGenerateVouchers}
                disabled={loading}
                className="text-gray-100 w-full h-10 px-4 bg-black font-medium rounded-md outline-none"
              >
                {loading ? 'Generando...' : 'Generar Códigos'}
              </button>
              <SelectCodes voucherTitles={voucherTitles} />
            </div>
          </>
        )}
      </div>
      <VoucherList />
    </div>
  );
};
