import { useSelector } from 'react-redux';
import { RootState } from '../redux/configureStore';
import { Bar, Line } from 'react-chartjs-2';

import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

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
  const { materiales } = useSelector((state: RootState) => state.materials);
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

  // Definir la lista originals
  const originals = [
    'Simple Chessburger',
    'Doble Cheeseburger',
    'Triple Cheeseburger',
    'Cuadruple Cheeseburger',
  ];

  // Filtrar los elementos de productosPedidos según las hamburguesas originales
  const productosOriginals = productosPedidos.filter((producto) =>
    originals.includes(producto.burger)
  );

  // Calcular la suma de todos los valores de quantity en productosOriginals
  const totalQuantityOriginals = productosOriginals.reduce(
    (total, producto) => total + producto.quantity,
    0
  );

  const toppingsTodos = [
    'mayonesa',
    'bacon',
    'lechuga',
    'tomate',
    'cebolla',
    'ketchup',
    'barbecue',
    'alioli',
  ];

  const materialesFiltrados = materiales.filter((material) =>
    toppingsTodos.includes(material.nombre.toLowerCase())
  );

  const materialesFiltradosConCosto = materialesFiltrados.map((material) => ({
    nombre: material.nombre,
    costo: material.costo,
  }));

  const toppingsPagos = [
    'bacon',
    'lechuga',
    'tomate',
    'cebolla caramelizada',
    'salsa anhelo',
  ];

  const ventasToppingsPagos = toppingsData.filter((topping) =>
    toppingsPagos.includes(topping.name.toLowerCase())
  );

  // Sumar los quantity de todos los toppings
  const totalQuantityToppings = toppingsData.reduce(
    (total, topping) => total + topping.quantity,
    0
  );

  // Sumar los quantity de cada topping pago
  const totalQuantityToppingsPagos = ventasToppingsPagos.reduce(
    (total, topping) => total + topping.quantity,
    0
  );

  // Interfaz para definir la estructura de los objetos en el arreglo relacionados
  interface Relacionado {
    nombre: string;
    costo: number;
    quantity: number;
    costoTotal: number; // Agregar la propiedad costoTotal
  }

  // Función auxiliar para comparar nombres especiales
  function compararNombres(nombre1: string, nombre2: string): boolean {
    // Tratar los casos especiales, como "cebolla" y "cebolla caramelizada"
    if (
      (nombre1 === 'cebolla' && nombre2 === 'cebolla caramelizada') ||
      (nombre1 === 'cebolla caramelizada' && nombre2 === 'cebolla')
    )
      return true;
    if (
      (nombre1 === 'alioli' && nombre2 === 'salsa anhelo') ||
      (nombre1 === 'salsa anhelo' && nombre2 === 'alioli')
    )
      return true;
    // Otros casos
    return nombre1 === nombre2;
  }

  // Relacionar los dos conjuntos de datos
  const relacionados: Relacionado[] = [];

  materialesFiltradosConCosto.forEach((material) => {
    const topping = toppingsData.find((t) =>
      compararNombres(t.name, material.nombre)
    );
    if (topping) {
      relacionados.push({
        nombre: material.nombre,
        costo: material.costo,
        quantity: topping.quantity,
        costoTotal: 0, // Inicializamos costoTotal a 0
      });
    }
  });

  // Calcular y almacenar el costo total para cada producto
  relacionados.forEach((item) => {
    item.costoTotal = item.quantity * item.costo;
  });

  // Calcular la suma de todos los valores de costoTotal
  const sumaCostoTotal = relacionados.reduce(
    (total, item) => total + item.costoTotal,
    0
  );

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

  const totalMedallonesNecesarios = productosPedidos.reduce(
    (total, producto) => {
      // Verificar si el producto es una hamburguesa
      const hamburguesa = burgers.find(
        (burger) => burger.data.name === producto.burger
      );
      if (hamburguesa) {
        // Obtener la cantidad de medallones necesarios para esta hamburguesa
        const cantidadMedallones =
          hamburguesa.data.ingredients.carne * producto.quantity;
        return total + cantidadMedallones;
      } else {
        return total;
      }
    },
    0
  );

  const totalBaconToppings = toppingsData.reduce((total, topping) => {
    // Verificar si el topping es bacon
    if (topping.name === 'bacon') {
      return total + topping.quantity;
    } else {
      return total;
    }
  }, 0);

  const totalBaconNecesario = productosPedidos.reduce((total, producto) => {
    // Verificar si el producto es una hamburguesa
    const hamburguesa = burgers.find(
      (burger) => burger.data.name === producto.burger
    );
    if (hamburguesa && hamburguesa.data.ingredients.bacon) {
      // Obtener la cantidad de bacon necesaria para esta hamburguesa
      const cantidadBacon =
        hamburguesa.data.ingredients.bacon * producto.quantity;
      return total + cantidadBacon;
    } else {
      return total;
    }
  }, 0);
  // Objeto para realizar el seguimiento de la cantidad de medallones por minuto
  const medallonesPorMinuto: { [minuto: number]: number } = {};

  // Calcular la cantidad de medallones por minuto
  productosPedidos.forEach((producto) => {
    const hamburguesa = burgers.find(
      (burger) => burger.data.name === producto.burger
    );
    if (hamburguesa) {
      const cantidadMedallones =
        hamburguesa.data.ingredients.carne * producto.quantity;
      const hora = producto.hora;
      const [hour, minute] = hora.split(':').map(Number);
      const minutos = hour * 60 + minute; // Convertir la hora a minutos
      if (!medallonesPorMinuto[minutos]) {
        medallonesPorMinuto[minutos] = 0;
      }
      medallonesPorMinuto[minutos] += cantidadMedallones;
    }
  });

  // Convertir los minutos en objetos Date
  const minutosComoFechas = Object.keys(medallonesPorMinuto)
    .map(Number)
    .sort((a, b) => a - b);

  // Convertir los minutos ordenados de nuevo a cadenas de horas
  const horasOrdenadas = minutosComoFechas.map((minutos) => {
    const hour = Math.floor(minutos / 60);
    const minute = minutos % 60;
    return `${hour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}`;
  });

  //

  const cantBolsitas = productosPedidos.reduce((total, producto) => {
    if (producto.burger.includes('Papas con Cheddar ®')) {
      return total + producto.quantity * 2;
    } else if (producto.burger.includes('Papas Anhelo ®')) {
      return total + producto.quantity * 2;
    } else if (producto.burger.includes('Satisfayer')) {
      return total;
    } else {
      return total + producto.quantity;
    }
  }, 0);

  const chartData = {
    labels: horasOrdenadas,
    datasets: [
      {
        label: `Medallones por minuto`,
        data: horasOrdenadas.map(
          (hora) =>
            medallonesPorMinuto[
              parseInt(hora.split(':')[0]) * 60 + parseInt(hora.split(':')[1])
            ]
        ),
        fill: false,
        borderColor: 'rgba(75, 192, 192, 0.6)',
        tension: 0.1,
      },
    ],
  };
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
          <br />
          Toppings totales: {totalQuantityToppings}. Costo ${sumaCostoTotal}
          <br />
          Toppings pagos: {totalQuantityToppingsPagos}. Bruto $
          {totalQuantityToppingsPagos * 300}
          <br />
          Un promedio de{' '}
          {Math.ceil((totalQuantityToppings / totalQuantityOriginals) * 100) /
            100}{' '}
          toppings por compra
          <br />
          Medallones: {totalMedallonesNecesarios}
          <br />
          Carne: {(totalMedallonesNecesarios * 90) / 1000} KG
          <br />
          Bacon: {totalBaconNecesario + totalBaconToppings} fetas
          <br />
          Bacon: {((totalBaconNecesario + totalBaconToppings) * 20) / 1000} KG
          <br />
          Bolsitas de papas: {cantBolsitas}
          <br />
          papas: {(cantBolsitas * 120) / 1000} KG
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
        <Line data={chartData} />

        {[dataBurgers, dataToppings].map((data, index) => (
          <div className="" key={index}>
            <Bar data={data} options={options} plugins={[plugin]} />
          </div>
        ))}
      </div>
    </div>
  );
};
