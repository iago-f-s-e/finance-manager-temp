"use client"

import React, {useRef} from "react"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  className?: string
}

const predefinedColors = [
  "#E6E6FA", // Lavender
  "#9370DB", // Medium Purple
  "#663399", // Rebecca Purple
  "#98FB98", // Pale Green
  "#FFFACD", // Lemon Chiffon
  "#FFA07A", // Light Salmon
  "#FFB6C1", // Light Pink
  "#DDA0DD", // Plum
  "#FF7F50", // Coral
  "#00BCD4", // Cyan
  "#f44336",
  "#2196f3",
]

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState(color || "#000000")
  const ref = useRef<HTMLButtonElement | null>(null)

  return (
    <Popover>
      <PopoverTrigger ref={ref} asChild>
        <Button
          variant="outline"
          className={cn("w-10 h-10 p-0 border-2", className)}
          style={{ backgroundColor: color }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Seletor de Cores</h4>
            <p className="text-sm text-muted-foreground">Escolha entre cores predefinidas ou personalizadas</p>
          </div>

          <div className="relative">
            <div className="h-24 rounded-md" style={{backgroundColor: selectedColor}}/>
          </div>

          <div>
            <h5 className="text-sm font-medium mb-2">Seletor de cor personalizado</h5>
            <Input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(() => e.target.value)}
              className="w-full h-10 rounded-md cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h5 className="text-sm font-medium mb-2">Cores predefinidas</h5>
              <div className="grid grid-cols-6 gap-2">
                {predefinedColors.map((presetColor) => (
                  <Button
                    key={presetColor}
                    variant="outline"
                    className={cn(
                      "w-8 h-8 p-0 rounded-full",
                      selectedColor === presetColor && "ring-2 ring-primary ring-offset-2",
                    )}
                    style={{backgroundColor: presetColor}}
                    onClick={() => setSelectedColor(() => presetColor)}
                  />
                ))}
              </div>
            </div>

            <Button onClick={() => {
              onChange(selectedColor)
              ref.current?.click()
            }}> Selecionar</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

