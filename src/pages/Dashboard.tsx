import { Chart, registerables } from 'chart.js';
import info from '../assets/combined_addresses.json';
import { Bar } from 'react-chartjs-2';

Chart.register(...registerables);

const hamburguesasVendidas = {};

const toppingsVendidos = {};

const palabrasClaveToppings = [
  '- bacon',
  '- cebolla caramelizada',
  '- crispy',
  '- ketchup',
  '- lechuga',
  '- mayonesa',
  '- salsa anhelo',
  '- salsa barbecue',
  '- tomate',
];

const palabrasClave = [
  'anhelo classic',
  'bbq bcn cheeseburger',
  'bcn cheeseburger',
  'crispy bcn',
  'cuadruple cheeseburger',
  'doble cheeseburger',
  'easter egg',
  'mario inspired',
  'papas anhelo ®',
  'papas con cheddar ®',
  'pepsi',
  'pote de cheddar',
  'pote de mayonesa',
  'pote de salsa anhelo',
  'simple cheeseburger',
  'triple cheeseburger',
];

info.forEach((pedido) => {
  const pedidos = pedido.pedido.split('\n');
  pedidos.forEach((elemento) => {
    const [nombre, cantidad] = elemento.split('x ').reverse();
    const cleanNombre = nombre.toLowerCase().trim();

    if (palabrasClave.includes(cleanNombre)) {
      hamburguesasVendidas[cleanNombre] =
        (hamburguesasVendidas[cleanNombre] || 0) + parseInt(cantidad, 10);
    }

    palabrasClaveToppings.forEach((topping) => {
      if (cleanNombre.includes(topping)) {
        toppingsVendidos[topping] = (toppingsVendidos[topping] || 0) + 1;
      }
    });
  });
});

export const Dashboard = () => {
  const nombresHamburguesas = Object.keys(hamburguesasVendidas);
  const cantidadesHamburguesas = Object.values(hamburguesasVendidas);

  const nombresToppings = Object.keys(toppingsVendidos);
  const cantidadToppings = Object.values(toppingsVendidos);

  const dataBurgers = {
    labels: nombresHamburguesas,
    datasets: [
      {
        label: 'Productos vendidos',
        data: cantidadesHamburguesas,
        backgroundColor: 'rgba(192, 11, 11, 1)', // Color rojo para las barras
        borderColor: 'rgba(255, 99, 132, 1)', // Color rojo para el borde de las barras
        borderWidth: 2, // Ancho del borde de las barras
      },
    ],
  };

  const dataToppings = {
    labels: nombresToppings,
    datasets: [
      {
        label: 'Toppings',
        data: cantidadToppings,
        backgroundColor: 'rgba(255, 99, 132, 0.6)', // Color rojo para las barras
        borderColor: 'rgba(255, 99, 132, 1)', // Color rojo para el borde de las barras
        borderWidth: 2, // Ancho del borde de las barras
      },
    ],
  };

  const plugin = {
    id: 'customCanvasBackgroundColor',
    beforeDraw: (chart, args, options) => {
      const { ctx } = chart;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = 'rgba(35, 33, 34, 1)'; // Fondo negro
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    },
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        display: true,
        labels: {
          color: 'rgb(255, 99, 132)',
        },
      },
      title: {
        display: true,
        text: 'ANHELO PRODUCTS ®',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div>
      <Bar data={dataBurgers} options={options} plugins={[plugin]} />
      <Bar data={dataToppings} options={options} />
    </div>
  );
};
