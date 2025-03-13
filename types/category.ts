import type { TransactionType } from "./transaction"

export interface Category {
  id: string
  type: TransactionType
  value: string
  label: string
  color?: string
  isDefault?: boolean
}

