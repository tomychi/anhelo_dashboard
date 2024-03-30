import anheloLogo from '../../assets/anheloLogo.png';

export const ReactLogo = () => {
  return (
    <img
      src={anheloLogo}
      alt="React Logo"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '130px',
      }}
    />
  );
};
