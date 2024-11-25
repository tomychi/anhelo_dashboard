import axios from 'axios';

export async function sendTemplateMessage() {
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
      to: import.meta.env.VITE_TO_PHONE_NUMBER,
      type: 'template',
      template: {
        name: 'inactivos',
        language: {
          code: 'es_AR',
        },
        components: [
          {
            type: 'header',
            parameters: [
              {
                type: 'image',
                image: {
                  link: 'https://res.cloudinary.com/db2gtt9hk/image/upload/v1730813740/rsehvlnnpe0pj7ksuqgg.jpg',
                },
              },
            ],
          },
        ],
      },
    }),
  });

  console.log(response.data);
}
