import axios from 'axios';

export async function sendTemplateMessage(
  telefono: string,
  semanas: number,
  cupon: string
) {
  const response = await axios({
    url: `https://graph.facebook.com/v21.0/${
      import.meta.env.VITE_WA_PHONE_NUMBER_ID
    }/messages`,
    method: 'post',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    data: JSON.stringify({
      messaging_product: 'whatsapp',
      to: telefono,
      type: 'template',
      template: {
        name: 'inactivos', // Asegúrate de que el nombre de la plantilla coincida
        language: {
          code: 'es_AR',
        },
        components: [
          {
            type: 'header',
            parameters: [
              {
                type: 'video',
                video: {
                  link: 'https://res.cloudinary.com/db2gtt9hk/video/upload/v1732675185/qvkhtfeusjmyco7gd2fr.mp4', // Cambia por el enlace de tu video
                },
              },
            ],
          },
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: `❤️‍🩹  *Vimos que no pedis hace más de ${semanas} semanas y desde Anhelo te extrañamos mucho!* 

Por eso te preparamos esta sorpresa: *${cupon}*

❤️‍🔥 Es un voucher 2x1 de regalo que podés canjear en nuestra página por las burgers que desees.  

*Atte: El mejor CM, con unos likes en Instagram me conformo*  😎`,
              },
            ],
          },
        ],
      },
    }),
  });

  console.log(response.data);
}
