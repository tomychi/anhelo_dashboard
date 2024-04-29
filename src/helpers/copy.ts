import Swal from 'sweetalert2';

export const copyToClipboard = (textToCopy: string) => {
  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      Swal.fire({
        icon: 'success',
        title: 'Copiado',
        text: 'Texto copiado al portapapeles',
      });
    })
    .catch((error) => {
      console.error('Error copying to clipboard:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error al copiar al portapapeles',
      });
    });
};
