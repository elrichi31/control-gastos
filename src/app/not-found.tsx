import Link from "next/link"

export default function NotFound() {
  return <div className="space-y-4 p-6">
    <h1 className="text-xl font-semibold">Página no encontrada</h1>
    <p className="text-muted-foreground">La dirección solicitada no existe.</p>
    <Link href="/dashboard" className="underline">Volver al resumen</Link>
  </div>
}
