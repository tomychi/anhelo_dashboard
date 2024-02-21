import React from 'react';
import { Line } from 'react-chartjs-2';

interface CompetitorData {
  followers: number;
  likes: number;
  comentarios: number;
}

interface DateData {
  [competitor: string]: CompetitorData;
}

export interface FakeDatabase {
  [date: string]: DateData;
}

const LineChart: React.FC<{ data: FakeDatabase }> = ({ data }) => {
  const dates = Object.keys(data);
  const competitors = Object.keys(data[dates[0]]);

  const chartData = {
    labels: dates,
    datasets: competitors.map((competitor) => ({
      label: competitor,
      data: dates.map((date) => data[date][competitor].followers),
      fill: false,
      borderColor: '#' + ((Math.random() * 0xffffff) << 0).toString(16),
    })),
  };

  return (
    <div className="h-[50vh]">
      <Line data={chartData} />
    </div>
  );
};

export default LineChart;
