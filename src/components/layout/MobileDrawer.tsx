"use client"
import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

export function MobileDrawer({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: ReactNode }) {
  return (<Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
				<Dialog.Portal>
					<Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
					<Dialog.Content
						asChild
						id="mobile-navigation"
						onCloseAutoFocus={(event) => {
							event.preventDefault()
							document.getElementById("mobile-menu-trigger")?.focus()
						}}
					>
						<aside className="fixed left-0 top-0 z-50 flex h-dvh w-72 max-w-[calc(100vw-3rem)] flex-col border-r border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-xl outline-none">
							<Dialog.Title className="sr-only">Menú de BethaSpend</Dialog.Title>
							<Dialog.Description className="sr-only">Navega entre tus gastos, presupuestos y conexiones.</Dialog.Description>
							{children}
						</aside>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>)
}
