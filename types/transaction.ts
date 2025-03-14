export type TransactionType = "income" | "expense" | "transfer"
export type RecurrenceType = "daily" | "weekly" | "biweekly" | "monthly" | "yearly"

export interface Transaction {
  id: string
  type: TransactionType
  name: string
  value: number
  date: Date
  category: string
  walletId: string
  description: string
  isRecurring?: boolean
  recurrenceType?: RecurrenceType
  recurrenceCount?: number
  isPartOfRecurrence?: boolean
  recurrenceGroupId?: string
  updateAllRecurrences?: boolean
  transferId?: string
  isEffectuated: boolean
  effectuatedAt?: Date
  createdAt: Date
}

export interface TransactionFilters {
  startDate?: Date
  endDate?: Date
  categories?: string[]
  walletIds?: string[]
  isEffectuated?: boolean
  searchTerm?: string
}

