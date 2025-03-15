export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex h-16 items-center justify-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} SabbathDev. Todos os direitos reservados.
      </div>
    </footer>
  )
}

