import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { revokeUserSessions, sessionRegistryEnabled } from '@/lib/auth/session-registry'

const headers = { 'Cache-Control': 'no-store' }
export const dynamic = 'force-dynamic'
async function owner() {
  const session = await getServerSession(authOptions)
  return session?.user?.id || null
}
export async function GET() {
  try {
    if (!await owner()) return Response.json({ error: 'Inicia sesión' }, { status: 401, headers })
    return Response.json({ revocationEnabled: sessionRegistryEnabled() }, { headers })
  } catch { return Response.json({ error: 'No se pudo consultar seguridad' }, { status: 503, headers }) }
}
export async function POST(request: Request) {
  try {
    const userId = await owner()
    if (!userId) return Response.json({ error: 'Inicia sesión' }, { status: 401, headers })
    let origin: string
    try { origin = new URL(process.env.NEXTAUTH_URL || '').origin } catch {
      return Response.json({ error: 'Configuración de seguridad pendiente' }, { status: 503, headers })
    }
    if (request.headers.get('origin') !== origin) return Response.json({ error: 'Origen no autorizado' }, { status: 403, headers })
    if ((request.headers.get('content-type') || '').split(';')[0].trim() !== 'application/json') return Response.json({ error: 'Se requiere JSON' }, { status: 415, headers })
    if (!sessionRegistryEnabled()) return Response.json({ error: 'Revocación pendiente de activación' }, { status: 503, headers })
    await revokeUserSessions(userId)
    return Response.json({ success: true }, { headers })
  } catch { return Response.json({ error: 'No se pudieron cerrar las sesiones' }, { status: 503, headers }) }
}
