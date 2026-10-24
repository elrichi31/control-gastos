"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <div role="alert" className="space-y-4 p-6">
    <h1 className="text-xl font-semibold">No se pudo cargar esta página</h1>
    <p className="text-muted-foreground">Intenta de nuevo para continuar.</p>
    <Button onClick={retry}>Reintentar</Button>
    <Link href="/dashboard" className="ml-4 underline">Volver al resumen</Link>
  </div>
}
