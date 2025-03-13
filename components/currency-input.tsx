"use client"

import type React from "react"

import { useState, useEffect, forwardRef } from "react"
import { Input, type InputProps } from "@/components/ui/input"
import { formatCurrency, parseCurrencyInput } from "@/lib/financial-utils"

interface CurrencyInputProps extends Omit<InputProps, "onChange"> {
  value: number
  onChange: (value: number) => void
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(({ value, onChange, ...props }, ref) => {
  const [displayValue, setDisplayValue] = useState("")

  // Format the initial value
  useEffect(() => {
    if (value !== undefined) {
      setDisplayValue(formatCurrency(value).replace("R$", "").trim())
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value

    // Allow empty input
    if (!inputValue) {
      setDisplayValue("")
      onChange(0)
      return
    }

    // Remove non-numeric characters except comma
    const sanitizedValue = inputValue.replace(/[^\d,]/g, "")

    // Format for display
    const parts = sanitizedValue.split(",")
    let formattedValue = parts[0]

    // Add thousand separators
    if (formattedValue.length > 3) {
      formattedValue = formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    }

    // Add decimal part if exists
    if (parts.length > 1) {
      // Limit to 2 decimal places
      const decimals = parts[1].substring(0, 2)
      formattedValue = `${formattedValue},${decimals}`
    }

    setDisplayValue(formattedValue)

    // Convert to number for the model
    const numericValue = parseCurrencyInput(formattedValue)
    onChange(numericValue)
  }

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <span className="text-gray-500">R$</span>
      </div>
      <Input {...props} ref={ref} type="text" value={displayValue} onChange={handleChange} className="pl-10" />
    </div>
  )
})

CurrencyInput.displayName = "CurrencyInput"

