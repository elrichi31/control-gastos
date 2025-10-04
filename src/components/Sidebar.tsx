"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Home, FileText, Calculator, X, ChevronLeft, BarChart3, Receipt, LogOut, User, ChevronDown, Repeat, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState, useEffect } from "react"

const menuItems = [
	{
		name: "Resumen",
		href: "/",
		icon: Home,
	},
	{
		name: "Presupuesto",
		href: "/presupuesto",
		icon: Calculator,
	},
	{
		name: "Estadísticas",
		href: "/estadisticas",
		icon: BarChart3,
	},
]

const gastosSubmenu = [
	{
		name: "Crear Nuevo",
		href: "/form",
		icon: Plus,
	},
	{
		name: "Detalle",
		href: "/detalle-gastos",
		icon: Receipt,
	},
	{
		name: "Gastos Recurrentes",
		href: "/gastos-recurrentes",
		icon: Repeat,
	},
]

interface SidebarProps {
	isOpen: boolean
	onClose: () => void
	isMobile: boolean
	isCollapsed: boolean
	onToggleCollapse: () => void
}

export function Sidebar({
	isOpen,
	onClose,
	isMobile,
	isCollapsed,
	onToggleCollapse,
}: SidebarProps) {
	const pathname = usePathname()
	const router = useRouter()
	const { data: session } = useSession()
	const [gastosOpen, setGastosOpen] = useState(false)

	// Verificar si alguna ruta de gastos está activa
	const isGastosActive = gastosSubmenu.some(item => pathname === item.href)

	// Abrir automáticamente el dropdown si estamos en una ruta de gastos
	useEffect(() => {
		if (isGastosActive) {
			setGastosOpen(true)
		}
	}, [isGastosActive])

	// Cerrar dropdown cuando se hace clic fuera (solo para versión colapsada)
	useEffect(() => {
		if (!gastosOpen || !isCollapsed) return

		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as HTMLElement
			if (!target.closest('.gastos-dropdown-container')) {
				setGastosOpen(false)
			}
		}

		document.addEventListener('click', handleClickOutside)
		return () => document.removeEventListener('click', handleClickOutside)
	}, [gastosOpen, isCollapsed])

	const handleLogout = async () => {
		await signOut({ 
			callbackUrl: '/auth/login',
			redirect: true 
		})
	}

	if (isMobile) {
		return (
			<>
				{/* Overlay para móviles */}
				{isOpen && (
					<div
						className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
						onClick={onClose}
					/>
				)}

				{/* Sidebar móvil */}
				<div
					className={cn(
						"fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out w-64 lg:hidden flex flex-col",
						isOpen ? "translate-x-0" : "-translate-x-full",
					)}
				>
					<div className="flex items-center justify-between p-6">
						<h1 className="text-2xl font-bold text-gray-900">GastosApp</h1>
						<Button variant="ghost" size="sm" onClick={onClose}>
							<X className="w-5 h-5" />
						</Button>
					</div>

					<div className="px-6 pb-4">
						<p className="text-sm font-medium text-gray-600">Menu</p>
					</div>

					<nav className="px-3 flex-1">
						{menuItems.map((item) => {
							const Icon = item.icon
							const isActive =
								pathname === item.href ||
								(item.href === "/" && pathname === "/")

							return (
								<Link
									key={item.name}
									href={item.href}
									onClick={onClose}
									className={cn(
										"flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1",
										isActive
											? "bg-gray-100 text-gray-900"
											: "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
									)}
								>
									<Icon className="w-5 h-5" />
									{item.name}
								</Link>
							)
						})}

						{/* Sección de Gastos con Collapsible */}
						<Collapsible open={gastosOpen} onOpenChange={setGastosOpen}>
							<CollapsibleTrigger asChild>
								<button
									className={cn(
										"w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1",
										isGastosActive
											? "bg-gray-100 text-gray-900"
											: "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
									)}
								>
									<div className="flex items-center gap-3">
										<FileText className="w-5 h-5" />
										<span>Gastos</span>
									</div>
									<ChevronDown
										className={cn(
											"w-4 h-4 transition-transform",
											gastosOpen && "rotate-180"
										)}
									/>
								</button>
							</CollapsibleTrigger>
							<CollapsibleContent className="pl-4">
								{gastosSubmenu.map((item) => {
									const Icon = item.icon
									const isActive = pathname === item.href

									return (
										<Link
											key={item.name}
											href={item.href}
											onClick={onClose}
											className={cn(
												"flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1",
												isActive
													? "bg-gray-100 text-gray-900"
													: "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
											)}
										>
											<Icon className="w-4 h-4" />
											{item.name}
										</Link>
									)
								})}
							</CollapsibleContent>
						</Collapsible>
					</nav>

					{/* Sección de usuario en la parte inferior del móvil */}
					<div className="mt-auto border-t border-gray-200 p-3">
						{session?.user && (
							<div className="px-3 py-2 mb-2">
								<div className="flex items-center gap-2 mb-1">
									<User className="w-4 h-4 text-gray-500" />
									<p className="text-sm font-medium text-gray-900">{session.user.name}</p>
								</div>
								<p className="text-xs text-gray-500 ml-6">{session.user.email}</p>
							</div>
						)}
						
						<button
							onClick={handleLogout}
							className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-red-600 hover:bg-red-50 hover:text-red-700"
						>
							<LogOut className="w-5 h-5 flex-shrink-0" />
							<span>Cerrar Sesión</span>
						</button>
					</div>
				</div>
			</>
		)
	}

	// Sidebar desktop
	return (
		<div
			className={cn(
				"fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-50 transition-all duration-300 ease-in-out hidden lg:block",
				isCollapsed ? "w-16" : "w-64",
			)}
		>
			<div
				className={cn(
					"flex items-center p-6",
					isCollapsed ? "justify-center" : "justify-between",
				)}
			>
				{!isCollapsed && (
					<h1 className="text-2xl font-bold text-gray-900">GastosApp</h1>
				)}
				<Button
					variant="ghost"
					size="sm"
					onClick={onToggleCollapse}
					className="flex-shrink-0"
				>
					<ChevronLeft
						className={cn(
							"w-5 h-5 transition-transform",
							isCollapsed && "rotate-180",
						)}
					/>
				</Button>
			</div>

			{!isCollapsed && (
				<div className="px-6 pb-4">
					<p className="text-sm font-medium text-gray-600">Menu</p>
				</div>
			)}

			<nav className="px-3">
				{menuItems.map((item) => {
					const Icon = item.icon
					const isActive =
						pathname === item.href ||
						(item.href === "/" && pathname === "/")

					return (
						<Link
							key={item.name}
							href={item.href}
							className={cn(
								"flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 group",
								isActive
									? "bg-gray-100 text-gray-900"
									: "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
								isCollapsed && "justify-center",
							)}
							title={isCollapsed ? item.name : undefined}
						>
							<Icon className="w-5 h-5 flex-shrink-0" />
							{!isCollapsed && <span>{item.name}</span>}
						</Link>
					)
				})}

				{/* Sección de Gastos con Collapsible - Desktop */}
				{isCollapsed ? (
					// Versión colapsada: solo mostrar ícono con tooltip
					<div className="relative group gastos-dropdown-container">
						<button
							onClick={() => setGastosOpen(!gastosOpen)}
							className={cn(
								"w-full flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1",
								isGastosActive
									? "bg-gray-100 text-gray-900"
									: "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
							)}
							title="Gastos"
						>
							<FileText className="w-5 h-5 flex-shrink-0" />
						</button>
						
						{/* Dropdown flotante cuando está colapsado */}
						{gastosOpen && (
							<div className="absolute left-full top-0 ml-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px] z-50">
								{gastosSubmenu.map((item) => {
									const Icon = item.icon
									const isActive = pathname === item.href

									return (
										<Link
											key={item.name}
											href={item.href}
											className={cn(
												"flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors",
												isActive
													? "bg-gray-100 text-gray-900"
													: "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
											)}
										>
											<Icon className="w-4 h-4" />
											{item.name}
										</Link>
									)
								})}
							</div>
						)}
					</div>
				) : (
					// Versión expandida: collapsible normal
					<Collapsible open={gastosOpen} onOpenChange={setGastosOpen}>
						<CollapsibleTrigger asChild>
							<button
								className={cn(
									"w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1",
									isGastosActive
										? "bg-gray-100 text-gray-900"
										: "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
								)}
							>
								<div className="flex items-center gap-3">
									<FileText className="w-5 h-5 flex-shrink-0" />
									<span>Gastos</span>
								</div>
								<ChevronDown
									className={cn(
										"w-4 h-4 transition-transform",
										gastosOpen && "rotate-180"
									)}
								/>
							</button>
						</CollapsibleTrigger>
						<CollapsibleContent className="pl-4">
							{gastosSubmenu.map((item) => {
								const Icon = item.icon
								const isActive = pathname === item.href

								return (
									<Link
										key={item.name}
										href={item.href}
										className={cn(
											"flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1",
											isActive
												? "bg-gray-100 text-gray-900"
												: "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
										)}
									>
										<Icon className="w-4 h-4" />
										{item.name}
									</Link>
								)
							})}
						</CollapsibleContent>
					</Collapsible>
				)}
			</nav>

			{/* Sección de usuario en la parte inferior */}
			<div className="mt-auto border-t border-gray-200 p-3">
				{session?.user && !isCollapsed && (
					<div className="px-3 py-2 mb-2">
						<p className="text-sm font-medium text-gray-900">{session.user.name}</p>
						<p className="text-xs text-gray-500">{session.user.email}</p>
					</div>
				)}
				
				<button
					onClick={handleLogout}
					className={cn(
						"w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
						"text-red-600 hover:bg-red-50 hover:text-red-700",
						isCollapsed && "justify-center"
					)}
					title={isCollapsed ? "Cerrar Sesión" : undefined}
				>
					<LogOut className="w-5 h-5 flex-shrink-0" />
					{!isCollapsed && <span>Cerrar Sesión</span>}
				</button>
			</div>
		</div>
	)
}
