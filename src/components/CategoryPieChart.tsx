import { Pie } from 'react-chartjs-2';
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

const CategoryPieChart: React.FC<Props> = ({ labels, data }) => {
  return (
    <div className="mb-8" style={{ maxWidth: '300px', margin: '0 auto' }}>
      <h2 className="text-lg font-bold mb-2 text-center">Gastos por Categoría</h2>
      <Pie
        data={{
          labels,
          datasets: [
            {
              data,
              backgroundColor: [
                '#4CAF50', // Verde
                '#FF9800', // Naranja
                '#2196F3', // Azul
                '#9C27B0', // Púrpura
                '#F44336', // Rojo
                '#FFEB3B', // Amarillo
              ],
              hoverBackgroundColor: [
                '#66BB6A', // Verde más claro
                '#FFB74D', // Naranja más claro
                '#42A5F5', // Azul más claro
                '#AB47BC', // Púrpura más claro
                '#EF5350', // Rojo más claro
                '#FFF176', // Amarillo más claro
              ],
              borderColor: '#E0E0E0', // Bordes grises claros
              borderWidth: 1,
            },
          ],
        }}
        options={{
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#000000', // Texto negro para modo claro
              },
            },
          },
          maintainAspectRatio: true,
        }}
      />
    </div>
  );
};

export default CategoryPieChart;
