"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
  // Ordenar datos de mayor a menor
  const sortedData = [...data].sort((a, b) => b.amount - a.amount)
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.payload.category}</p>
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

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={dataWithColors} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                type="number" 
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(value) => `$${value}`}
              />
              <YAxis 
                type="category" 
                dataKey="category" 
                tick={{ fontSize: 13, fill: "#374151" }}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
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
