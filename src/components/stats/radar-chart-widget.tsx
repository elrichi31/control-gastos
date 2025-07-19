"use client"

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts"
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

export function RadarChartWidget({ data, title }: RadarChartWidgetProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.payload.category}</p>
          <p className="text-sm text-purple-600">${data.value.toLocaleString()}</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, fill: "#6b7280" }} />
              <PolarRadiusAxis
                angle={90}
                domain={[0, "dataMax"]}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickFormatter={(value) => `$${value}`}
              />
              <Radar
                name="Gastos"
                dataKey="amount"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.1}
                strokeWidth={2}
                dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
