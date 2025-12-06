"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PieChartData {
  name: string
  value: number
  color: string
}

interface PieChartWidgetProps {
  data: PieChartData[]
  title: string
}

export function PieChartWidget({ data, title }: PieChartWidgetProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const percentage = ((data.value / total) * 100).toFixed(1)
      return (
        <div className="bg-white dark:bg-neutral-900 p-3 border border-gray-200 dark:border-neutral-600 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{data.payload.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.value)} ({percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLegend = ({ payload }: any) => {
    if (!payload?.length) return null
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-6">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-sm text-gray-600 dark:text-gray-400">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="bg-white dark:bg-neutral-900 shadow-sm border border-gray-200 dark:border-neutral-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96 flex flex-col">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="45%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={CustomLegend} verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
