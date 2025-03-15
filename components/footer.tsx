"use client"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm text-muted-foreground md:text-left">
          © {currentYear} SabbathDev. Todos os direitos reservados.
        </p>
        <div className="flex items-center gap-2">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-d5wbjAldm0nmo4hVPZCuxFeMcuNFEQ.png"
            alt="SabbathDev Logo"
            className="h-8 w-8"
          />
        </div>
      </div>
    </footer>
  )
}

