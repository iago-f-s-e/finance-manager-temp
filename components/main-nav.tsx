"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {Sheet, SheetContent, SheetTitle, SheetTrigger} from "@/components/ui/sheet"
import { Menu } from "lucide-react"

export function MainNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const routes = [
    {
      href: "/",
      label: "Dashboard",
      active: pathname === "/",
    },
    {
      href: "/details",
      label: "Transações",
      active: pathname === "/details",
    },
    {
      href: "/effectuation",
      label: "Efetivação",
      active: pathname === "/effectuation",
    },
    {
      href: "/wallets",
      label: "Carteiras",
      active: pathname === "/wallets",
    },
    {
      href: "/settings",
      label: "Configurações",
      active: pathname === "/settings",
    },
  ]

  return (
    <div className="flex w-full items-center">
      <div className="flex items-center">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="outline" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="lg:hidden">
            <SheetTitle className="hidden" />
            <div className="px-2 pb-6 mr-6">
              <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-d5wbjAldm0nmo4hVPZCuxFeMcuNFEQ.png"
                  alt="Logo"
                  className="h-6 w-6"
                />
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    route.active ? "text-black dark:text-white" : "text-muted-foreground",
                  )}
                >
                  {route.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/" className="hidden items-center gap-2 mr-6 lg:flex">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-d5wbjAldm0nmo4hVPZCuxFeMcuNFEQ.png"
            alt="Logo"
            className="h-6 w-6"
          />
        </Link>
      </div>
      <nav className="hidden lg:flex lg:flex-1 lg:justify-center">
        <div className="flex gap-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                route.active ? "text-black dark:text-white" : "text-muted-foreground",
              )}
            >
              {route.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}

