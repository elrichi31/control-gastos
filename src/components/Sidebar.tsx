"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FileText, Calculator, X, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const menuItems = [
	{
		name: "Resumen",
		href: "/",
		icon: Home,
	},
	{
		name: "Registro de Gastos",
		href: "/form",
		icon: FileText,
	},
	{
		name: "Presupuesto",
		href: "/presupuesto",
		icon: Calculator,
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
						"fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out w-64 lg:hidden",
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
					</nav>
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
			</nav>
		</div>
	)
}
