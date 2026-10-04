"use client"

import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Menu } from "lucide-react"
import { navSections, initials } from "@/components/Sidebar"

export function TopBar({ onMenuClick, isMobile }: { onMenuClick: () => void; isMobile: boolean }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isCurrent = (href: string) => pathname === href || pathname?.startsWith(href + "/")
  const section = navSections.find(s => s.items.some(i => isCurrent(i.href)))
  const current = section?.items.find(i => isCurrent(i.href))

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
      {isMobile && (
        <button onClick={onMenuClick} aria-label="Abrir menú" className="-ml-1 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground">
          <Menu className="size-4" />
        </button>
      )}
      <div className="flex min-w-0 items-center gap-2">
        <nav aria-label="Ruta" className="flex min-w-0 items-center gap-1.5 text-[13px]">
          <span className="text-muted-foreground">{section?.title ?? "General"}</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="truncate font-medium text-foreground">{current?.name ?? "BethaSpend"}</span>
        </nav>
        <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-foreground sm:inline-flex">
          <span className="size-1.5 rounded-full bg-chart-2" />
          Activo
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {session?.user && (
          <div className="hidden items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 sm:flex">
            <span className="grid size-6 place-items-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
              {initials(session.user.name)}
            </span>
            <span className="max-w-40 truncate text-[13px] font-medium text-foreground">{session.user.name}</span>
          </div>
        )}
      </div>
    </header>
  )
}
