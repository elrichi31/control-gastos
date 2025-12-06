"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"

interface RadarChartData {
  category: string
  amount: number
  fullMark: number
}

interface RadarChartWidgetProps {
  data: RadarChartData[]
  title: string
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6"]

export function RadarChartWidget({ data, title }: RadarChartWidgetProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  
  // Ordenar datos de mayor a menor
  const sortedData = [...data].sort((a, b) => b.amount - a.amount)
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white dark:bg-neutral-800 p-3 border border-gray-200 dark:border-neutral-600 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{data.payload.category}</p>
          <p className="text-sm font-semibold" style={{ color: data.payload.color }}>
            ${data.value.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }

  const dataWithColors = sortedData.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length]
  }))

  // Colores adaptados al tema
  const gridColor = isDark ? "#404040" : "#e5e7eb"
  const tickColor = isDark ? "#a3a3a3" : "#6b7280"

  return (
    <Card className="bg-white dark:bg-neutral-900 shadow-sm border border-gray-200 dark:border-neutral-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={dataWithColors} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                type="number" 
                tick={{ fontSize: 12, fill: tickColor }}
                tickFormatter={(value) => `$${value}`}
                axisLine={{ stroke: gridColor }}
                tickLine={{ stroke: gridColor }}
              />
              <YAxis 
                type="category" 
                dataKey="category" 
                tick={{ fontSize: 13, fill: tickColor }}
                width={100}
                axisLine={{ stroke: gridColor }}
                tickLine={{ stroke: gridColor }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
              <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                {dataWithColors.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
