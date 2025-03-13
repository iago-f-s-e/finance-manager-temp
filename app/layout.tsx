import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { FinancialStoreProvider } from "@/lib/store-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Sistema de Gestão Financeira",
  description: "Gerencie suas finanças pessoais com facilidade",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <FinancialStoreProvider>
            {children}
            <Toaster />
          </FinancialStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'