export type TransactionType = "income" | "expense"
export type RecurrenceType = "daily" | "weekly" | "biweekly" | "monthly" | "yearly"

export interface Transaction {
  id: string
  type: TransactionType
  name: string
  value: number
  date: Date
  category: string
  description: string
  isRecurring?: boolean
  recurrenceType?: RecurrenceType
  recurrenceCount?: number
  isPartOfRecurrence?: boolean
  recurrenceGroupId?: string
  createdAt: Date
}

export interface TransactionFilters {
  startDate?: Date
  endDate?: Date
  categories?: string[]
  searchTerm?: string
}

