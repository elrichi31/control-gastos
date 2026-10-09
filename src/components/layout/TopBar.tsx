"use client"

import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Menu, Plus } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { navSections, initials } from "@/components/layout/Sidebar"

export function TopBar({ onMenuClick, isMobile, isMenuOpen = false }: { onMenuClick: () => void; isMobile: boolean; isMenuOpen?: boolean }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isCurrent = (href: string) => pathname === href || pathname?.startsWith(href + "/")
  const section = navSections.find(s => s.items.some(i => isCurrent(i.href)))
  const current = section?.items.find(i => isCurrent(i.href))

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
      {isMobile && (
        <button id="mobile-menu-trigger" onClick={onMenuClick} aria-label="Abrir menú" aria-expanded={isMenuOpen} aria-controls={isMenuOpen ? "mobile-navigation" : undefined} className="-ml-1 grid size-11 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Menu className="size-4" />
        </button>
      )}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <nav aria-label="Ruta" className="flex min-w-0 items-center gap-1.5 text-[13px]">
          <span className="hidden text-muted-foreground sm:inline">{section?.title ?? "General"}</span>
          <span aria-hidden="true" className="hidden text-muted-foreground/50 sm:inline">/</span>
          <span aria-current="page" className="truncate font-medium text-foreground">{current?.name ?? "BethaSpend"}</span>
        </nav>

      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {pathname !== "/form" && (
          <Link href="/form" className={cn(buttonVariants({ size: "sm", variant: "secondary" }), "h-11 shrink-0 gap-1.5 px-3 lg:h-9")}>
            <Plus className="size-4" aria-hidden="true" />
            Nuevo gasto
          </Link>
        )}
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
