import React, { useRef, useEffect } from "react";
import qrcode from "qrcode-generator";

const QRGlobal: React.FC = () => {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (qrRef.current) {
      const qr = qrcode(0, "L");
      const data = `https://dashboard.onlyanhelo.com/registroHorario`;
      qr.addData(data);
      qr.make();
      qrRef.current.innerHTML = qr.createSvgTag({
        scalable: true,
        cellSize: 4,
        margin: 1,
      });
    }
  }, []);

  return (
    <div
      ref={qrRef}
      className="w-2/4 bg-white rounded-xl border border-gray-200  p-2"
    />
  );
};

export default QRGlobal;
