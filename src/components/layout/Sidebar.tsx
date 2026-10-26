"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { clearPrivateCaches } from "@/lib/pwa/cache-policy"
import { Home, Calculator, BarChart3, Receipt, LogOut, Repeat, Plug, Mail, PanelLeft, X, type LucideIcon } from "lucide-react"
import { BethaLogo } from "@/components/brand/BethaLogo"
import { BethaMark } from "@/components/brand/BethaMark"
import { cn } from "@/lib/utils"
import { NewExpenseButton, type ExpenseKind } from "@/components/gastos/ExpenseDialogProvider"
import { ModeToggle } from "@/components/layout/mode-toggle"
import dynamic from "next/dynamic"
const MobileDrawer = dynamic(() => import("./MobileDrawer").then(m => m.MobileDrawer), { ssr: false })
const CronStatus = dynamic(() => import("@/components/layout/CronStatus").then(m => m.CronStatus), { ssr: false })

type NavItem = { name: string; href: string; icon: LucideIcon; action?: ExpenseKind }

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
				{collapsed ? (
					<BethaMark size={28} className="shrink-0 text-primary" />
				) : (
					<div className="min-w-0 flex-1">
						<BethaLogo size={16} />
					</div>
				)}
				{isMobile && (
					<button onClick={onClose} aria-label="Cerrar menú" className="grid size-11 shrink-0 place-items-center rounded-md text-sidebar-muted hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
						<X className="size-4" />
					</button>
				)}
			</div>

			<nav aria-label="Navegación principal" className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
				{navSections.map((section, i) => (
					<div key={section.items[0].href} className={cn(i > 0 && "mt-3 border-t border-sidebar-border pt-3")}>
						{section.title && !collapsed && (
							<p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-sidebar-muted/80">{section.title}</p>
						)}
						{section.items.map(({ name, href, icon: Icon, action }) => {
							const isActive = pathname === href || pathname?.startsWith(href + "/")
							if (action) return <NewExpenseButton
								key={href}
								kind={action}
								onClick={isMobile ? onClose : undefined}
								title={collapsed ? name : undefined}
								aria-label={name}
								variant="ghost"
								className={cn("mb-0.5 w-full justify-start gap-2.5 rounded-lg border border-transparent px-2.5 text-[13px] font-normal text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-foreground", isMobile ? "h-11" : "h-8", collapsed && "justify-center px-0")}
							><Icon className="size-4 shrink-0" />{!collapsed && <span className="truncate">{name}</span>}</NewExpenseButton>
							return (
								<Link
									key={href}
									href={href}
									onClick={isMobile ? onClose : undefined}
									title={collapsed ? name : undefined}
									aria-label={name}
									aria-current={isActive ? "page" : undefined}
									className={cn(
										"mb-0.5 flex items-center gap-2.5 rounded-lg border px-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
										isMobile ? "h-11" : "h-8",
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
							className="grid size-9 place-items-center rounded-lg text-sidebar-muted hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
						className={cn("grid shrink-0 place-items-center rounded-md text-sidebar-muted hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", isMobile ? "size-11" : "size-7")}
					>
						<LogOut className="size-4" />
					</button>
				</div>
			</div>
		</>
	)

	if (isMobile) return isOpen ? <MobileDrawer isOpen={isOpen} onClose={onClose}>{content}</MobileDrawer> : null

	return (
		<aside
			className={cn(
				"fixed left-0 top-0 z-50 hidden h-dvh flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out motion-reduce:transition-none lg:flex",
				collapsed ? "w-16" : "w-60",
			)}
		>
			{content}
		</aside>
	)
}
