import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  return <main className="flex min-h-screen items-center justify-center bg-background p-6"><Card className="w-full max-w-md"><CardHeader><CardTitle>Acceso privado</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">El registro público está cerrado. Contacta al administrador para crear una cuenta. Si ya tienes una, puedes seguir entrando normalmente.</p><Button asChild className="w-full"><Link href="/auth/login">Iniciar sesión</Link></Button></CardContent></Card></main>
}
