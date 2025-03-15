import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { FinancialStoreProvider } from "@/lib/store-provider"
import { MainNav } from "@/components/main-nav"

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
            <div className="flex min-h-screen flex-col">
              <header className="sticky top-0 z-40 border-b bg-background">
                <div className="container flex h-16 items-center justify-between py-4">
                  <div className="flex items-center gap-6">
                    <MainNav />
                  </div>
                </div>
              </header>
              <main className="flex-1">{children}</main>
            </div>
            <Toaster />
          </FinancialStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'