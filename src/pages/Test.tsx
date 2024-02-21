// https://api.instagram.com/oauth/authorize
// ?client_id=1149863709343245
// &redirect_uri=https://dashboard.onlyanhelo.com/authentication
// &scope=user_profile,user_media
// &response_type=code

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// AQC4x1jCUf8LmrQEFNvgg54OVelWg2nUOR5YCJ7fhOAWKkWn3R76a4rMh7w4wZ80z3o3E8GcSoyKyfhrT0pAcFBlTabm64yRmashwzgHRGldtcW3P-y7yp1mCtH9WnIgOEzg9NZVOkpAQK9VeFIEIU1pqoBnly8DPpN84CVm760Juzo9eHigdPLLE-kUq6rs_JInW8Q8j-EPELnguYoNn9VGdpJag9vbLdcoL8OomHRQbA

// curl -X POST \
// https://api.instagram.com/oauth/access_token \
// -F client_id=1149863709343245 \
// -F client_secret=ff7df5c9d1c6e492c993be8dba24b942 \
// -F grant_type=authorization_code \
// -F redirect_uri=https://dashboard.onlyanhelo.com/authentication \
// -F code={AQC4x1jCUf8LmrQEFNvgg54OVelWg2nUOR5YCJ7fhOAWKkWn3R76a4rMh7w4wZ80z3o3E8GcSoyKyfhrT0pAcFBlTabm64yRmashwzgHRGldtcW3P-y7yp1mCtH9WnIgOEzg9NZVOkpAQK9VeFIEIU1pqoBnly8DPpN84CVm760Juzo9eHigdPLLE-kUq6rs_JInW8Q8j-EPELnguYoNn9VGdpJag9vbLdcoL8OomHRQbA}

const clientId = '1149863709343245';
const redirectUri = 'https://dashboard.onlyanhelo.com/authentication';
const scope = 'user_profile,user_media';
const clientSecret = 'ff7df5c9d1c6e492c993be8dba24b942';

const authorizationUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
const accessTokenUrl = 'https://api.instagram.com/oauth/access_token';

export const Test = () => {
  const location = useLocation();
  const [codigo, setCodigo] = useState<string>('');

  window.open(authorizationUrl, '_blank');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');

    if (code) {
      // Aquí puedes hacer algo con el código de autorización
      setCodigo(code);
      console.log('Código de autorización:', code);
      // Luego puedes utilizar este código para solicitar un token de acceso
    }
  }, [location.search]);

  const formData = new FormData();
  formData.append('client_id', clientId);
  formData.append('client_secret', clientSecret);
  formData.append('grant_type', 'authorization_code');
  formData.append('redirect_uri', redirectUri);
  formData.append('code', codigo);

  fetch(accessTokenUrl, {
    method: 'POST',
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      // Aquí puedes trabajar con el token de acceso y otros datos de usuario
      console.log(data);
    })
    .catch((error) => {
      console.error('Error al obtener el token de acceso:', error);
    });

  return <div>test</div>;
};

// Abre una nueva ventana del navegador con la URL de autorización
