import { sendTemplateMessage } from '../utils/whatsapp';
import Swal from 'sweetalert2';

export const WhatsappFeatures = () => {
  const handleSendMessage = async () => {
    try {
      Swal.fire({
        title: 'Enviando mensaje...',
        text: 'Por favor, espera.',
        icon: 'info',
        showConfirmButton: false,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await sendTemplateMessage();

      Swal.fire({
        title: 'Mensaje enviado',
        text: 'El mensaje de WhatsApp se envió correctamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar',
      });
    } catch (error) {
      console.error('Error al enviar el mensaje:', error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al enviar el mensaje.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <button
        onClick={handleSendMessage}
        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded shadow-lg transition-all duration-300"
      >
        Enviar Mensaje de WhatsApp
      </button>
    </div>
  );
};
