"use client"

import { useState } from "react"
import { useMobile } from "./useMobile"

export function useSidebar() {
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Desktop visibility is controlled by CSS; state only tracks the mobile drawer.
  const toggle = () => setIsOpen(previous => !previous)
  const close = () => setIsOpen(false)
  const open = () => setIsOpen(true)
  const toggleCollapse = () => setIsCollapsed(previous => !previous)

  return {
    isOpen,
    toggle,
    close,
    open,
    isMobile,
    isCollapsed,
    toggleCollapse,
  }
}
