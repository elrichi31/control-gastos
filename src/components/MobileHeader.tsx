"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MobileHeaderProps {
  onMenuClick: () => void
  isMobile: boolean
}

export function MobileHeader({ onMenuClick, isMobile }: MobileHeaderProps) {
  if (!isMobile) return null

  return (
    <div className="lg:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onMenuClick} className="lg:hidden">
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">GastosApp</h1>
      </div>
    </div>
  )
}
