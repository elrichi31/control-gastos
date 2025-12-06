"use client"

import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { ReactNode } from "react"

interface StatCardProps {
  title: string
  value: string
  subtitle?: ReactNode
  icon: LucideIcon
  colorScheme: "blue" | "green" | "purple" | "orange" | "indigo"
}

const colorSchemes = {
  blue: {
    gradient: "from-blue-50 to-blue-100 dark:from-neutral-900 dark:to-neutral-800",
    border: "border-blue-200 dark:border-neutral-700",
    title: "text-blue-600 dark:text-gray-400",
    value: "text-blue-900 dark:text-gray-100",
    icon: "text-blue-600 dark:text-gray-400"
  },
  green: {
    gradient: "from-green-50 to-green-100 dark:from-neutral-900 dark:to-neutral-800",
    border: "border-green-200 dark:border-neutral-700",
    title: "text-green-600 dark:text-gray-400",
    value: "text-green-900 dark:text-gray-100",
    icon: "text-green-600 dark:text-gray-400"
  },
  purple: {
    gradient: "from-purple-50 to-purple-100 dark:from-neutral-900 dark:to-neutral-800",
    border: "border-purple-200 dark:border-neutral-700",
    title: "text-purple-600 dark:text-gray-400",
    value: "text-purple-900 dark:text-gray-100",
    icon: "text-purple-600 dark:text-gray-400"
  },
  orange: {
    gradient: "from-orange-50 to-orange-100 dark:from-neutral-900 dark:to-neutral-800",
    border: "border-orange-200 dark:border-neutral-700",
    title: "text-orange-600 dark:text-gray-400",
    value: "text-orange-900 dark:text-gray-100",
    icon: "text-orange-600 dark:text-gray-400"
  },
  indigo: {
    gradient: "from-indigo-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800",
    border: "border-indigo-200 dark:border-neutral-700",
    title: "text-indigo-600 dark:text-gray-400",
    value: "text-indigo-900 dark:text-gray-100",
    icon: "text-indigo-600 dark:text-gray-400"
  }
}

export function StatCard({ title, value, subtitle, icon: Icon, colorScheme }: StatCardProps) {
  const colors = colorSchemes[colorScheme]

  return (
    <Card className={`bg-gradient-to-br ${colors.gradient} ${colors.border}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`${colors.title} text-sm font-medium`}>{title}</p>
            <p className={`text-2xl font-bold ${colors.value}`}>{value}</p>
            {subtitle && <div className="mt-2">{subtitle}</div>}
          </div>
          <Icon className={`w-8 h-8 ${colors.icon}`} />
        </div>
      </CardContent>
    </Card>
  )
}
