import React, { useState, useEffect, useRef } from 'react';
import {
  actualizarVouchersUsados,
  obtenerTitulosVouchers,
  obtenerTodosLosVouchers,
  Voucher,
  VoucherTituloConFecha,
} from '../../firebase/voucher';
import { jsPDF } from 'jspdf';
import voucherImg from '../../assets/Voucher.jpg'; // Asegúrate de que la ruta es correcta

interface GroupedVoucher {
  titulo: string;
  fecha: string;
  usados: number;
  total: number;
  codigos: string[];
}

export const VoucherList: React.FC = () => {
  const [groupedVouchers, setGroupedVouchers] = useState<GroupedVoucher[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);
  const [clickPosition, setClickPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [voucherTitles, setVoucherTitles] = useState<VoucherTituloConFecha[]>(
    []
  ); // Nuevo estado para los títulos de los vouchers

  useEffect(() => {
    const fetchVouchers = async () => {
      setLoading(true);
      try {
        const allVoucherTitles = await obtenerTitulosVouchers(); // Obtener títulos de vouchers
        setVoucherTitles(allVoucherTitles); // Almacenar títulos en el estado
      } catch (error) {
        console.error('Error al obtener todos los vouchers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const image = new Image();
    image.src = voucherImg;

    image.onload = () => {
      if (ctx && canvas) {
        console.log('Imagen cargada exitosamente.');
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
      } else {
        console.error('Error: No se pudo obtener el contexto del canvas.');
      }
    };

    image.onerror = () => {
      console.error('Error al cargar la imagen.');
    };

    return () => {
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, []);

  const groupVouchersByTitle = (vouchers: Voucher[]): GroupedVoucher[] => {
    const groupedObj: { [key: string]: GroupedVoucher } = {};

    vouchers.forEach((voucher) => {
      if (!groupedObj[voucher.titulo]) {
        groupedObj[voucher.titulo] = {
          titulo: voucher.titulo,
          fecha: voucher.fecha,
          usados: 0,
          total: 0,
          codigos: [],
        };
      }

      groupedObj[voucher.titulo].total++;
      groupedObj[voucher.titulo].codigos.push(voucher.codigo);
      if (voucher.estado === 'usado') {
        groupedObj[voucher.titulo].usados++;
      }

      if (
        new Date(voucher.fecha) > new Date(groupedObj[voucher.titulo].fecha)
      ) {
        groupedObj[voucher.titulo].fecha = voucher.fecha;
      }
    });

    return Object.values(groupedObj);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setClickPosition({ x, y });
    }
  };

  const generateVoucherPDF = () => {
    if (groupedVouchers.length > 0) {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [320, 450], // Tamaño SA3
      });

      const numVouchersPerPage = 36; // Número de vouchers por página
      const voucherWidth = 50; // Ajusta el ancho del voucher
      const voucherHeight = 80; // Ajusta la altura del voucher
      const margin = 0; // Espacio entre vouchers
      const numColumns = 9; // Número de columnas por página
      const numRows = 4; // Número de filas por página

      let voucherIndex = 0;

      groupedVouchers.forEach((group) => {
        group.codigos.forEach((codigo) => {
          if (voucherIndex > 0 && voucherIndex % numVouchersPerPage === 0) {
            doc.addPage(); // Agrega una nueva página después de llenar la página actual
          }

          const x = (voucherIndex % numColumns) * (voucherWidth + margin);
          const y =
            (Math.floor(voucherIndex / numColumns) % numRows) *
            (voucherHeight + margin);

          doc.addImage(voucherImg, 'JPEG', x, y, voucherWidth, voucherHeight);

          // Asegúrate de que la posición del código sea correcta
          const scaleX = voucherWidth / (canvasRef.current?.width || 400);
          const scaleY = voucherHeight / (canvasRef.current?.height || 300);

          const scaledX = clickPosition.x * scaleX;
          const scaledY = clickPosition.y * scaleY;

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8); // Ajusta el tamaño de la fuente si es necesario
          doc.setTextColor(0, 0, 0); // Negro
          doc.text(`${codigo}`, x + scaledX, y + scaledY);

          voucherIndex++;
        });
      });

      doc.save('vouchers_anhelo_burgers.pdf');
    } else {
      alert('No hay códigos disponibles para imprimir.');
    }
  };

  const getUsageColor = (usados: number, total: number): string => {
    const ratio = usados / total;
    if (ratio < 0.25) return 'bg-red-main';
    if (ratio < 0.5) return 'bg-yellow-500';
    return 'text-green-500';
  };

  const copyCodigosToClipboard = (codigos: string[]) => {
    const codigosText = codigos.join('\n');
    navigator.clipboard.writeText(codigosText).then(
      () => {
        alert('Códigos copiados al portapapeles');
      },
      (err) => {
        console.error('Error al copiar códigos: ', err);
        alert('Error al copiar códigos');
      }
    );
  };

  return (
    <div>
      <table className="w-full text-xs text-left font-coolvetica text-black">
        <thead className="text-black">
          <tr>
            <th scope="col" className="pl-4 w-3/12 py-3">
              Campaña
            </th>
            <th scope="col" className="pl-4 w-1/12 py-3">
              Fecha
            </th>
            <th scope="col" className="pl-4 w-1/12 py-3">
              Canjeados
            </th>
            <th scope="col" className="pl-4 w-1/12 py-3">
              Entregados / creados
            </th>
            <th scope="col" className="w-2/12 py-3"></th>
            <th scope="col" className="w-2/12 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="text-center py-4">
                Cargando campañas...
              </td>
            </tr>
          ) : voucherTitles.length > 0 ? (
            voucherTitles.map((t, index) => (
              <tr
                key={index}
                className="text-black border font-light border-black border-opacity-20"
              >
                <td className="w-3/12 font-light py-3 pl-4">{t.titulo}</td>
                <td className="w-3/12 font-light py-3 pl-4">{t.fecha}</td>
                <td className="w-3/12 font-light py-3 pl-4">{t.canjeados}</td>
                <td
                  className="w-3/12 font-light py-3 pl-4 cursor-pointer"
                  onClick={() => {
                    const nuevaCantidadUsados = prompt(
                      'Ingrese la nueva cantidad de vouchers usados:'
                    );
                    if (nuevaCantidadUsados !== null) {
                      actualizarVouchersUsados(
                        t.titulo,
                        parseInt(nuevaCantidadUsados, 10)
                      );
                    }
                  }}
                >
                  {t.usados} / {t.creados}
                </td>
                <button
                  onClick={() => {}}
                  className="p-1 rounded-md text-center text-gray-100 bg-blue-500 w-full"
                >
                  Seleccionar Voucher
                </button>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-4">
                No hay campañas disponibles.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {selectedVoucher && (
        <>
          <h2 className="text-center my-4">
            Haz clic en la imagen para elegir la ubicación del código
          </h2>
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            style={{ border: '1px solid black' }}
            onClick={handleCanvasClick}
          />
          <button
            onClick={generateVoucherPDF}
            className="p-1 rounded-md text-center text-gray-100 bg-green-500 w-full"
          >
            Generar Voucher
          </button>
        </>
      )}
    </div>
  );
};
