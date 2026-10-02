import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { createClient } from "@supabase/supabase-js"
import { allowedGoogleAccount, googleAdmissionConfigured, AUTH_SESSION_MAX_SECONDS } from "./session-policy"
import { authSessionActive, registerAuthSession, googleAccountActive } from "./session-registry"

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
            if (error?.message?.toLowerCase().includes('email not confirmed')) {
              throw new Error('EMAIL_NOT_CONFIRMED')
            }
            return null
          }


          // Retornar el usuario autenticado
          return {
            id: data.user.id,
            name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Usuario',
            email: data.user.email!,
          }
        } catch (error) {
          if (error instanceof Error && error.message === 'EMAIL_NOT_CONFIRMED') {
            throw error
          }
          console.error('Error durante autenticación:', error)
          return null
        }
      },
    }),

    ...(googleAdmissionConfigured() && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })] : [])
  ],

  session: {
    strategy: "jwt" as const,
    maxAge: AUTH_SESSION_MAX_SECONDS,
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") return true
      if (account?.provider !== "google") return false
      const id = allowedGoogleAccount(profile)
      if (!id || !await googleAccountActive(id, user.email)) return false
      user.id = id
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.sessionStartedAt = Math.floor(Date.now() / 1000)
        token.sessionId = await registerAuthSession(user.id, token.sessionStartedAt as number)
      }
      if (typeof token.id !== "string" || !await authSessionActive(token.id, token.sessionId, token.sessionStartedAt)) return {}
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = typeof token.id === "string" ? token.id : ""
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      try {
        const target = new URL(url, baseUrl)
        if (target.origin === new URL(baseUrl).origin) return target.href
      } catch {
        // Malformed or foreign destinations fall back to a trusted local route.
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
