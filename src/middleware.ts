import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Verificar si el usuario está intentando acceder a rutas de auth cuando ya está autenticado
    if (req.nextauth.token && req.nextUrl.pathname.startsWith('/auth/')) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Si está intentando acceder a rutas de auth, no requiere autenticación
        if (req.nextUrl.pathname.startsWith('/auth/')) {
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
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
