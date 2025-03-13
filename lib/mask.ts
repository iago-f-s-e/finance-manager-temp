function formatInteger(value: string): string {
  return value.replace(/\D/g, "")
}

function formatFloat(value: string): string {
  return (Number(formatInteger(value)) / 100).toFixed(2)
}

function formatTheComa(value: string): string {
  return Number.parseFloat(formatFloat(value)).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export const handleInputMoneyMask = (value: number | string) => {
  if (typeof value === "number") {
    return `R$ ${formatTheComa(value.toFixed(2))}`
  }

  return `R$ ${formatTheComa(value)}`
}

export const handleRemoveMoneyMask = (value: string) => Number.parseFloat(formatFloat(value))

