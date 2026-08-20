"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  large?: boolean
}

export function Breadcrumb({ items, large = false }: BreadcrumbProps) {
  return (
    <nav className={`flex items-center space-x-2 ${large ? "text-3xl font-bold" : "text-sm"} text-muted-foreground`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className={`${large ? "w-8 h-8 mx-4" : "w-4 h-4 mx-2"} text-muted-foreground`} />}
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-bold">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
