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
  const { hamburguesasPedidas, toppingsData } = useSelector(
    (state: RootState) => state.data
  );

  const dataBurgers = {
    labels: hamburguesasPedidas.map((b) => b.burger),
    datasets: [
      {
        label: 'BURGER BEST SELLER',
        data: hamburguesasPedidas.map((b) => b.quantity),
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

  return (
    <div className="flex p-4 gap-4 justify-between flex-col w-full">
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
