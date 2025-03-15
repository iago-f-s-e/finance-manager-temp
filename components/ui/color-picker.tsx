"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  className?: string
}

const predefinedColors = [
  "#f44336",
  "#e91e63",
  "#9c27b0",
  "#673ab7",
  "#3f51b5",
  "#2196f3",
  "#03a9f4",
  "#00bcd4",
  "#009688",
  "#4caf50",
  "#8bc34a",
  "#cddc39",
  "#ffeb3b",
  "#ffc107",
  "#ff9800",
  "#ff5722",
  "#795548",
  "#607d8b",
  "#9e9e9e",
  "#000000",
]

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState(color || "#000000")
  const [customColor, setCustomColor] = useState(color || "#000000")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSelectedColor(color)
    setCustomColor(color)
  }, [color])

  const handleColorChange = (newColor: string) => {
    setSelectedColor(newColor)
    onChange(newColor)
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setCustomColor(newColor)
    setSelectedColor(newColor)
    onChange(newColor)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-10 h-10 p-0 border-2", className)}
          style={{ backgroundColor: selectedColor }}
          onClick={() => inputRef.current?.click()}
        />
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-5 gap-2">
            {predefinedColors.map((presetColor) => (
              <Button
                key={presetColor}
                variant="outline"
                className="w-8 h-8 p-0 rounded-md border-2"
                style={{ backgroundColor: presetColor }}
                onClick={() => handleColorChange(presetColor)}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              ref={inputRef}
              type="color"
              value={customColor}
              onChange={handleCustomColorChange}
              className="w-8 h-8 cursor-pointer"
            />
            <input
              type="text"
              value={customColor}
              onChange={handleCustomColorChange}
              className="flex-1 px-2 py-1 border rounded-md text-sm"
              placeholder="#000000"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

