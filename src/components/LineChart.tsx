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

interface LineChartProps {
  data: FakeDatabase;
}
const LineChart: React.FC<LineChartProps> = ({ data }) => {
  if (!data) {
    return <div>No data available</div>;
  }

  const dates = Object.keys(data).sort();
  const usernames = dates.length > 0 ? Object.keys(data[dates[0]]) : [];

  const colors = [
    'rgba(255, 99, 132, 1)', // anhelo
    'rgb(11,193,123)',
    'rgba(153, 102, 255, 1)',
    'rgb(219,18,60)',
    'rgb(246,204,49)',
  ];

  const datasets = usernames.map((username, index) => ({
    label: username,
    data: dates.map((date) => data[date][username]?.followers ?? null),
    fill: false,
    borderColor: colors[index % colors.length],
    tension: 0.1,
  }));

  const chartData = {
    labels: dates,
    datasets,
  };

  return <Line data={chartData} />;
};
export default LineChart;
