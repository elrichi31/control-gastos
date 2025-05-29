import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from 'chart.js';

ChartJS.register(
  ArcElement, // Para gráficos de pastel
  Tooltip,
  Legend,
  CategoryScale, // Para el eje X
  LinearScale, // Para el eje Y
  PointElement, // Para los puntos del gráfico de líneas
  LineElement // Para las líneas
);

interface Props {
  labels: string[];
  data: number[];
}

const DailyLineChart: React.FC<Props> = ({ labels, data }) => {
  return (
    <div className="mb-8" style={{ maxWidth: '500px', height: '300px', margin: '0 auto' }}>
      <h2 className="text-lg font-bold mb-2 text-center">Gastos por Día</h2>
      <Line
        data={{
          labels,
          datasets: [
            {
              label: 'Gastos diarios',
              data,
              borderColor: '#4CAF50', // Verde claro para las líneas
              backgroundColor: 'rgba(76, 175, 80, 0.2)', // Fondo semitransparente verde claro
              borderWidth: 2,
              pointBackgroundColor: '#FFC107', // Amarillo para los puntos
            },
          ],
        }}
        options={{
          plugins: {
            legend: {
              display: false,
            },
          },
          maintainAspectRatio: true,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Fecha',
                color: '#000000', // Texto en negro para modo claro
              },
              ticks: {
                color: '#000000', // Etiquetas en negro
              },
            },
            y: {
              title: {
                display: true,
                text: 'Gasto ($)',
                color: '#000000', // Texto en negro para modo claro
              },
              ticks: {
                color: '#000000', // Etiquetas en negro
              },
            },
          },
        }}
      />
    </div>
  );
};

export default DailyLineChart;
