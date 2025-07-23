"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: string
}

export function StatsCard({ title, value, subtitle, icon: Icon, trend, color = "text-blue-600" }: StatsCardProps) {
  return (
    <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        {trend && (
          <div className="flex items-center mt-2">
            <span className={`text-xs font-medium ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
              {trend.value > 0 ? "+" : ""}{Math.round(trend.value)}% vs mes anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
