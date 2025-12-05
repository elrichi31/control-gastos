"use client"

import { Menu, Wallet } from "lucide-react"
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
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500 text-white">
            <Wallet className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">BethaSpend</h1>
        </div>
      </div>
    </div>
  )
}
