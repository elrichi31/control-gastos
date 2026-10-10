'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { ExpensesSessionReset } from '@/components/layout/ExpensesSessionReset'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ExpensesSessionReset />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
