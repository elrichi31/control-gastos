'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { SessionQueryProvider } from '@/components/layout/SessionQueryProvider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <SessionQueryProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </SessionQueryProvider>
    </SessionProvider>
  )
}
