"use client"

import { useEffect, useState } from "react"
import { X, Download, Smartphone, Share2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Verificar si ya está instalada
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true

    if (isInstalled) {
      return
    }

    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Verificar si el usuario ya cerró el prompt
    const promptClosed = localStorage.getItem('pwa-install-prompt-closed')
    if (promptClosed === 'true') {
      return
    }

    // Para iOS, mostrar instrucciones después de 5 segundos
    if (iOS) {
      setTimeout(() => {
        setShowIOSInstructions(true)
      }, 5000)
      return
    }

    // Para Android/Chrome
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Mostrar el prompt después de 3 segundos
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return
    }

    // Mostrar el prompt nativo
    deferredPrompt.prompt()

    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('Usuario aceptó instalar la PWA')
    } else {
      console.log('Usuario rechazó instalar la PWA')
    }

    // Limpiar el prompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleClose = () => {
    setShowPrompt(false)
    setShowIOSInstructions(false)
    localStorage.setItem('pwa-install-prompt-closed', 'true')
  }

  // Prompt para iOS con instrucciones
  if (showIOSInstructions && isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom-5">
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl border border-gray-200 dark:border-neutral-700 p-4">
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>

          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <Smartphone className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Instalar BethaSpend
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Añade esta app a tu pantalla de inicio
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
            <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-neutral-800 rounded">
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-teal-600 text-white rounded-full text-[10px] font-bold">1</div>
              <div className="flex-1">
                <p>Toca el botón <Share2 className="inline w-3 h-3 mx-1" /> <strong>Compartir</strong> abajo</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-neutral-800 rounded">
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-teal-600 text-white rounded-full text-[10px] font-bold">2</div>
              <div className="flex-1">
                <p>Selecciona <Plus className="inline w-3 h-3 mx-1" /> <strong>Añadir a pantalla de inicio</strong></p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-neutral-800 rounded">
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-teal-600 text-white rounded-full text-[10px] font-bold">3</div>
              <div className="flex-1">
                <p>Toca <strong>Añadir</strong> para confirmar</p>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <Button
              onClick={handleClose}
              variant="outline"
              size="sm"
              className="w-full text-xs dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-700"
            >
              Entendido
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Prompt para Android/Chrome
  if (!showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom-5">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl border border-gray-200 dark:border-neutral-700 p-4">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
            <Smartphone className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              Instalar BethaSpend
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Instala la app en tu dispositivo para acceder rápidamente y usar sin conexión
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleClose}
            variant="outline"
            size="sm"
            className="flex-1 text-xs dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-700"
          >
            Ahora no
          </Button>
          <Button
            onClick={handleInstallClick}
            size="sm"
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs"
          >
            <Download className="w-4 h-4 mr-2" />
            Instalar
          </Button>
        </div>
      </div>
    </div>
  )
}
