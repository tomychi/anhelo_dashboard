export const AnheloIG = () => {
  const access_token = import.meta.env.VITE_ACCESS_TOKEN_INSTAGRAM;

  const url = `https://graph.instagram.com/me?fields=id,username&access_token=${access_token}`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
    })
    .catch((err) => {
      console.log('err', err);
    });

  return <div>AnheloIG</div>;
};
