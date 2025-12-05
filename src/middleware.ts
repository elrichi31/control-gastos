import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// Rutas públicas que no requieren autenticación
const publicRoutes = ['/', '/auth/login', '/auth/register']

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    
    // Verificar si el usuario está intentando acceder a rutas de auth cuando ya está autenticado
    if (req.nextauth.token && pathname.startsWith('/auth/')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Rutas públicas no requieren autenticación
        if (publicRoutes.includes(pathname)) {
          return true
        }
        
        // Si está intentando acceder a rutas de auth, no requiere autenticación
        if (pathname.startsWith('/auth/')) {
          return true
        }
        
        // Para otras rutas, requiere token (usuario autenticado)
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - api/cron (Cron jobs - no requieren autenticación)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
