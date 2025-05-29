'use client';

import { useEffect, useState } from 'react';
import CategoryPieChart from '@/components/CategoryPieChart';
import DailyLineChart from '@/components/DailyLineChart';
import CategoryDetails from '@/components/CategoryDetails';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parse, isValid } from 'date-fns';

export interface Transaction {
  FECHA: string;
  DESCRIPCION: string;
  DEBITO: number;
  CREDITO: number;
  CATEGORÍA: string;
  TIPO_DE_GASTO: 'Débito' | 'Crédito' | 'Otros';
}


const Home: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [debitTransactions, setDebitTransactions] = useState<Transaction[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<Transaction[]>([]);

  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('Todos los meses');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/transactions');
        const data: Transaction[] = await response.json();
        setTransactions(data);

        // Obtener meses únicos
        const uniqueMonths = Array.from(
          new Set(
            data.map((transaction) => {
              const parsedDate = parse(transaction.FECHA, 'dd/MM/yyyy', new Date());
              return isValid(parsedDate) ? format(parsedDate, 'MMMM yyyy') : 'Fecha inválida';
            })
          )
        )
          .filter((month) => month !== 'Fecha inválida')
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        setMonths(['Todos los meses', ...uniqueMonths]);

        // Mostrar todos los meses inicialmente
        setFilteredTransactions(data);
        setDebitTransactions(data.filter(t => t.TIPO_DE_GASTO === 'Débito'));
        setCreditTransactions(data.filter(t => t.TIPO_DE_GASTO === 'Crédito'));

      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Manejar cambio de mes
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    if (month === 'Todos los meses') {
      setFilteredTransactions(transactions);
      setDebitTransactions(transactions.filter(t => t.TIPO_DE_GASTO === 'Débito'));
      setCreditTransactions(transactions.filter(t => t.TIPO_DE_GASTO === 'Crédito'));
    } else {
      const filtered = transactions.filter((transaction) => {
        const parsedDate = parse(transaction.FECHA, 'dd/MM/yyyy', new Date());
        return isValid(parsedDate) && format(parsedDate, 'MMMM yyyy') === month;
      });
      setFilteredTransactions(filtered);
      setDebitTransactions(filtered.filter(t => t.TIPO_DE_GASTO === 'Débito'));
      setCreditTransactions(filtered.filter(t => t.TIPO_DE_GASTO === 'Crédito'));
    }
  };

  // Calcular el gasto total
  const totalDebito = debitTransactions.reduce((sum, t) => sum + t.DEBITO, 0);
  const totalCredito = creditTransactions.reduce((sum, t) => sum + t.CREDITO, 0);
  const totalSpending = totalCredito - totalDebito;


  // Agrupar transacciones por categoría
  const categoryData = filteredTransactions.reduce((acc, transaction) => {
    if (!acc[transaction.CATEGORÍA]) {
      acc[transaction.CATEGORÍA] = [];
    }
    acc[transaction.CATEGORÍA].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const categoryLabels = Object.keys(categoryData);
  const categoryTotals = categoryLabels.map((category) =>
    categoryData[category].reduce((sum, transaction) => sum + transaction.DEBITO, 0)
  );

  // Preparar datos para el gráfico de líneas
  const dailyData = filteredTransactions.reduce((acc, transaction) => {
    const parsedDate = parse(transaction.FECHA, 'dd/MM/yyyy', new Date());
    if (!isValid(parsedDate)) return acc;

    const formattedDate = format(parsedDate, 'dd/MM/yyyy');
    if (!acc[formattedDate]) acc[formattedDate] = 0;
    acc[formattedDate] += transaction.DEBITO;
    return acc;
  }, {} as Record<string, number>);

  const dailyLabels = Object.keys(dailyData).sort((a, b) => {
    const dateA = parse(a, 'dd/MM/yyyy', new Date());
    const dateB = parse(b, 'dd/MM/yyyy', new Date());
    return dateA.getTime() - dateB.getTime();
  });
  const dailyValues = dailyLabels.map((date) => dailyData[date]);

  return (
    <div className="container mx-auto p-4 max-w-screen-md">
      <h1 className="text-xl font-bold mb-4 text-center">Control de Gastos</h1>
      {loading ? (
        <p>Cargando datos...</p>
      ) : (
        <>
          {/* Selector de mes */}
          <div className="mb-6 text-center">
            <label htmlFor="month-select" className="font-bold mr-2">
              Selecciona un mes:
            </label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="p-2 border border-gray-400 rounded"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          {/* Gráfico de pastel */}
          <CategoryPieChart labels={categoryLabels} data={categoryTotals} />

          {/* Gráfico de líneas */}
          <DailyLineChart labels={dailyLabels} data={dailyValues} />

          {/* Desglose de categorías */}
          <CategoryDetails categoryData={categoryData} />
          {/* Gasto total */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-center text-xl">Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center font-bold">Total Gastado (Débito): ${totalDebito.toFixed(2)}</p>
              <p className="text-center font-bold">Total Recibido (Crédito): ${totalCredito.toFixed(2)}</p>
              <p className={`text-center font-bold ${totalSpending < 0 ? 'text-red-600' : 'text-green-600'}`}>
                Gasto Neto: ${totalSpending.toFixed(2)}
              </p>
            </CardContent>
          </Card>

        </>
      )}
    </div>
  );
};

export default Home;
