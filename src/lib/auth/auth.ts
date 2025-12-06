import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
    }
  }
  
  interface User {
    id: string
    email: string
    name: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Usar Supabase Auth para autenticar
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (error || !data?.user) {
            console.error('Error en autenticación:', error)
            return null
          }

          console.log("Usuario autenticado:", data.user)

          // Retornar el usuario autenticado
          return {
            id: data.user.id,
            name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Usuario',
            email: data.user.email!,
          }
        } catch (error) {
          console.error('Error durante autenticación:', error)
          return null
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],

  session: {
    strategy: "jwt" as const,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Si la URL es relativa, construir URL completa
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // Si la URL es del mismo origen, permitir
      if (url.startsWith(baseUrl)) {
        return url
      }
      // Por defecto, redirigir al dashboard
      return `${baseUrl}/dashboard`
    },
  },

  pages: {
    signIn: '/auth/login',
  },

  debug: process.env.NODE_ENV === 'development',
}
