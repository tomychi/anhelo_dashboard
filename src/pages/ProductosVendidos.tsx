import { useSelector } from 'react-redux';
import { RootState } from '../redux/configureStore';
import { Bar } from 'react-chartjs-2';
import { Chart } from 'chart.js';

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
      display: true,
      labels: {
        color: 'rgb(0, 0, 0)',
        font: {
          family: 'Antonio',
        },
        boxWidth: 2,
      },
    },
    title: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        color: 'rgb(0, 0, 0)',
        font: {
          family: 'Antonio',
        },
      },
    },
    x: {
      ticks: {
        color: 'rgb(0, 0, 0)',
        font: {
          family: 'Antonio',
        },
      },
    },
  },
};
const plugin = {
  id: 'customCanvasBackgroundColor',
  beforeDraw: (chart: Chart) => {
    const { ctx } = chart;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = 'rgba(254, 0, 0)';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
};

export const ProductosVendidos = () => {
  const { productosPedidos, toppingsData, totalProductosVendidos } =
    useSelector((state: RootState) => state.data);

  const { burgers } = useSelector((state: RootState) => state.product);
  const dataBurgers = {
    labels: productosPedidos.map((b) => b.burger),
    datasets: [
      {
        label: 'BURGER BEST SELLER',
        data: productosPedidos.map((b) => b.quantity),
        backgroundColor: 'rgba(0, 0, 0)',
      },
    ],
  };

  const dataToppings = {
    labels: toppingsData.map((t) => t.name),
    datasets: [
      {
        label: 'TOPPINGS SELL',
        data: toppingsData.map((t) => t.quantity),
        backgroundColor: 'rgba(0, 0, 0)',
      },
    ],
  };
  const hamburguesasPedidas = productosPedidos.reduce((total, producto) => {
    // Verificar si el producto es una hamburguesa
    const hamburguesa = burgers.find(
      (burger) => burger.data.name === producto.burger
    );
    if (hamburguesa) {
      return total + producto.quantity;
    } else {
      return total;
    }
  }, 0);

  return (
    <div className="flex p-4 gap-4 justify-between flex-col w-full">
      <div
        className="flex items-center p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400"
        role="alert"
      >
        <svg
          className="flex-shrink-0 inline w-4 h-4 me-3"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
        </svg>
        <span className="sr-only">Info</span>
        <div>
          <span className="font-medium">Info alert!</span> Se vendieron{' '}
          {hamburguesasPedidas} hamburguesas
        </div>
      </div>
      <div
        className="flex items-center p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400"
        role="alert"
      >
        <svg
          className="flex-shrink-0 inline w-4 h-4 me-3"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
        </svg>
        <span className="sr-only">Info</span>
        <div>
          <span className="font-medium">Info alert!</span> Se vendieron{' '}
          {totalProductosVendidos} prodcutos
        </div>
      </div>
      <div className="grid-cols-1 grid gap-2  w-full  ">
        {[dataBurgers, dataToppings].map((data, index) => (
          <div className="" key={index}>
            <Bar data={data} options={options} plugins={[plugin]} />
          </div>
        ))}
      </div>
    </div>
  );
};
