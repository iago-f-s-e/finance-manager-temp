"use client"

import type React from "react"
import { useRef } from "react"
import { useFinancialStore } from "@/lib/store"

export function FinancialStoreProvider({ children }: { children: React.ReactNode }) {
  // Usar useRef para garantir que o store seja inicializado apenas uma vez
  const initialized = useRef(false)

  if (!initialized.current) {
    // Inicializar o store apenas uma vez
    useFinancialStore.getState()
    initialized.current = true
  }

  return <>{children}</>
}

