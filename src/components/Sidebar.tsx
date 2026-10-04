"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { clearPrivateCaches } from "@/lib/pwa/cache-policy"
import { Home, Calculator, BarChart3, Receipt, LogOut, Repeat, Plus, Wallet, Plug, Mail, PanelLeft, X, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { ModeToggle } from "@/components/mode-toggle"
import { CronStatus } from "@/components/CronStatus"

type NavItem = { name: string; href: string; icon: LucideIcon }

export const navSections: { title?: string; items: NavItem[] }[] = [
	{
		items: [
			{ name: "Resumen", href: "/dashboard", icon: Home },
			{ name: "Detalle de gastos", href: "/detalle-gastos", icon: Receipt },
			{ name: "Presupuesto", href: "/presupuesto", icon: Calculator },
			{ name: "Estadísticas", href: "/estadisticas", icon: BarChart3 },
		],
	},
	{
		title: "Gastos",
		items: [
			{ name: "Nuevo gasto", href: "/form", icon: Plus },
			{ name: "Desde correo", href: "/gastos-correo", icon: Mail },
			{ name: "Recurrentes", href: "/gastos-recurrentes", icon: Repeat },
		],
	},
	{
		title: "Cuenta",
		items: [{ name: "Conexiones MCP", href: "/conexiones", icon: Plug }],
	},
]

export function initials(name?: string | null) {
	return (name ?? "?").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join("")
}

interface SidebarProps {
	isOpen: boolean
	onClose: () => void
	isMobile: boolean
	isCollapsed: boolean
	onToggleCollapse: () => void
}

export function Sidebar({ isOpen, onClose, isMobile, isCollapsed, onToggleCollapse }: SidebarProps) {
	const pathname = usePathname()
	const { data: session } = useSession()
	// En móvil el drawer siempre va expandido.
	const collapsed = !isMobile && isCollapsed

	const handleLogout = async () => {
		await clearPrivateCaches()
		await signOut({ callbackUrl: "/auth/login", redirect: true })
	}

	const content = (
		<>
			<div className={cn("flex h-14 items-center gap-2.5 border-b border-sidebar-border px-3", collapsed && "justify-center px-0")}>
				<div className="grid size-8 shrink-0 place-items-center rounded-lg border border-sidebar-border bg-card">
					<Wallet className="size-4 text-foreground" />
				</div>
				{!collapsed && (
					<div className="min-w-0 flex-1 leading-tight">
						<p className="truncate text-[13px] font-semibold text-foreground">BethaSpend</p>
						<p className="truncate text-[11px] text-sidebar-muted">Control de gastos</p>
					</div>
				)}
				{isMobile && (
					<button onClick={onClose} aria-label="Cerrar menú" className="grid size-8 place-items-center rounded-md text-sidebar-muted hover:bg-sidebar-accent hover:text-foreground">
						<X className="size-4" />
					</button>
				)}
			</div>

			<nav className="flex-1 overflow-y-auto px-2 py-3">
				{navSections.map((section, i) => (
					<div key={i} className={cn(i > 0 && "mt-3 border-t border-sidebar-border pt-3")}>
						{section.title && !collapsed && (
							<p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-sidebar-muted/80">{section.title}</p>
						)}
						{section.items.map(({ name, href, icon: Icon }) => {
							const isActive = pathname === href || pathname?.startsWith(href + "/")
							return (
								<Link
									key={href}
									href={href}
									onClick={isMobile ? onClose : undefined}
									title={collapsed ? name : undefined}
									aria-current={isActive ? "page" : undefined}
									className={cn(
										"mb-0.5 flex h-8 items-center gap-2.5 rounded-lg border px-2.5 text-[13px] transition-colors",
										isActive
											? "border-sidebar-border bg-sidebar-accent font-semibold text-foreground shadow-xs"
											: "border-transparent text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-foreground",
										collapsed && "justify-center px-0",
									)}
								>
									<Icon className="size-4 shrink-0" />
									{!collapsed && <span className="truncate">{name}</span>}
								</Link>
							)
						})}
					</div>
				))}
			</nav>

			<div className="border-t border-sidebar-border p-2">
				{!collapsed && <div className="pt-1"><CronStatus /></div>}
				<div className={cn("flex items-center gap-1", collapsed ? "flex-col" : "justify-between px-1")}>
					<ModeToggle />
					{!isMobile && (
						<button
							onClick={onToggleCollapse}
							aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
							className="grid size-9 place-items-center rounded-lg text-sidebar-muted hover:bg-sidebar-accent hover:text-foreground"
						>
							<PanelLeft className="size-4" />
						</button>
					)}
				</div>
				<div className={cn("mt-2 flex items-center gap-2.5 rounded-lg border border-sidebar-border bg-card p-2", collapsed && "flex-col p-1.5")}>
					<div className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
						{initials(session?.user?.name)}
					</div>
					{!collapsed && (
						<div className="min-w-0 flex-1 leading-tight">
							<p className="truncate text-[13px] font-medium text-foreground">{session?.user?.name ?? "—"}</p>
							<p className="truncate text-[11px] text-sidebar-muted">{session?.user?.email}</p>
						</div>
					)}
					<button
						onClick={handleLogout}
						title="Cerrar sesión"
						aria-label="Cerrar sesión"
						className="grid size-7 shrink-0 place-items-center rounded-md text-sidebar-muted hover:bg-destructive/10 hover:text-destructive"
					>
						<LogOut className="size-4" />
					</button>
				</div>
			</div>
		</>
	)

	if (isMobile) {
		return (
			<>
				{isOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} />}
				<aside
					className={cn(
						"fixed left-0 top-0 z-50 flex h-dvh w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-out lg:hidden",
						isOpen ? "translate-x-0" : "-translate-x-full",
					)}
				>
					{content}
				</aside>
			</>
		)
	}

	return (
		<aside
			className={cn(
				"fixed left-0 top-0 z-50 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out lg:flex",
				collapsed ? "w-16" : "w-60",
			)}
		>
			{content}
		</aside>
	)
}
