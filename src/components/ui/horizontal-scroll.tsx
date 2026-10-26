"use client"

import { useEffect, useRef, type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

/** Native touch/trackpad scrolling, plus vertical mouse-wheel support when overflowing. */
export function HorizontalScroll({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1
      const next = Math.max(0, Math.min(element.scrollWidth - element.clientWidth, element.scrollLeft + event.deltaY * unit))
      // At either edge, let the surrounding modal continue scrolling vertically.
      if (next === element.scrollLeft) return
      event.preventDefault()
      element.scrollLeft = next
    }
    element.addEventListener("wheel", onWheel, { passive: false })
    return () => element.removeEventListener("wheel", onWheel)
  }, [])

  return <div {...props} ref={ref} className={cn("min-w-0 overflow-x-auto overscroll-x-contain [scrollbar-width:thin]", className)} />
}
