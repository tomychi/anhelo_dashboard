export const Loading = () => {
  return (
    <div
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        height: '100vh',
        position: 'fixed',
        right: '0',
        top: '0',
        width: '100vw',
      }}
      className="flex justify-center items-center"
    >
      {' '}
      <div className="text-center">
        <h3>Espere por favor</h3>
        <span>Localizando...</span>
      </div>
    </div>
  );
};
