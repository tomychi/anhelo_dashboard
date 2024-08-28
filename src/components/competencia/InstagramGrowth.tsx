import { useEffect, useState } from 'react';
import LineChart, { FakeDatabase } from '../LineChart';
import {
  fetchAllInstagramData,
  transformData,
} from '../../firebase/InstagramData';
import {
  Chart,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
Chart.register(
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

export const InstagramGrowth: React.FC = () => {
  const [data, setData] = useState<FakeDatabase | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawData = await fetchAllInstagramData();
        const transformedData = transformData(rawData);
        setData(transformedData);
      } catch (error) {
        console.error('Error al obtener los datos:', error);
      }
    };

    fetchData();
  }, []);

  console.log(data);

  return (
    <div>
      <h1 className="text-custom-red uppercase flex items-center text-4xl font-black font-coolvetica">
        INSTAGRAM GROWTH
      </h1>
      <div className="w-full">
        {data ? <LineChart data={data} /> : <p>Cargando datos...</p>}
      </div>
    </div>
  );
};
