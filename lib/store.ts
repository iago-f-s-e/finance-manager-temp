import { create } from "zustand"
import { persist } from "zustand/middleware"
import { addDays, addMonths, addWeeks, addYears } from "date-fns"
import type { Transaction } from "@/types/transaction"
import type { Category } from "@/types/category"
import { INITIAL_CATEGORIES } from "@/lib/constants"

interface FinancialState {
  incomes: Transaction[]
  expenses: Transaction[]
  categories: Category[]

  // Transaction actions
  addTransaction: (transaction: Transaction) => void
  updateTransaction: (transaction: Transaction) => void
  deleteTransaction: (id: string) => void
  updateRecurrenceGroup: (transaction: Transaction, updateAll: boolean) => void

  // Category actions
  addCategory: (category: Category) => void
  updateCategory: (category: Category) => void
  deleteCategory: (id: string) => void

  // Import/Export
  importData: (data: { incomes: Transaction[]; expenses: Transaction[]; categories: Category[] }) => void
  clearAllData: () => void
}

export const useFinancialStore = create<FinancialState>()(
  persist(
    (set, get) => ({
      incomes: [],
      expenses: [],
      categories: INITIAL_CATEGORIES,

      addTransaction: (transaction) => {
        if (transaction.isRecurring && transaction.recurrenceCount && transaction.recurrenceType) {
          const recurringTransactions = generateRecurringTransactions(transaction)

          if (transaction.type === "income") {
            set((state) => ({ incomes: [...state.incomes, ...recurringTransactions] }))
          } else {
            set((state) => ({ expenses: [...state.expenses, ...recurringTransactions] }))
          }
        } else {
          if (transaction.type === "income") {
            set((state) => ({ incomes: [...state.incomes, transaction] }))
          } else {
            set((state) => ({ expenses: [...state.expenses, transaction] }))
          }
        }
      },

      updateTransaction: (transaction) => {
        if (transaction.type === "income") {
          set((state) => ({
            incomes: state.incomes.map((income) => (income.id === transaction.id ? transaction : income)),
          }))
        } else {
          set((state) => ({
            expenses: state.expenses.map((expense) => (expense.id === transaction.id ? transaction : expense)),
          }))
        }
      },

      deleteTransaction: (id) => {
        set((state) => ({
          incomes: state.incomes.filter((income) => income.id !== id),
          expenses: state.expenses.filter((expense) => expense.id !== id),
        }))
      },

      // Corrigir o problema com a função updateRecurrenceGroup
      // Modificar a função para evitar atualizações desnecessárias

      // Substituir a função updateRecurrenceGroup por:
      updateRecurrenceGroup: (transaction, updateAll) => {
        if (!transaction.recurrenceGroupId && !updateAll) {
          // Just update the single transaction if not part of a group
          get().updateTransaction(transaction)
          return
        }

        const groupId = transaction.recurrenceGroupId || transaction.id
        const transactions = transaction.type === "income" ? [...get().incomes] : [...get().expenses]

        if (updateAll) {
          // Update all transactions in the recurrence group
          const updatedTransactions = transactions.map((t) => {
            if (t.recurrenceGroupId === groupId || t.id === groupId) {
              // Keep original date but update other fields
              return {
                ...transaction,
                id: t.id,
                date: new Date(t.date),
                isPartOfRecurrence: t.isPartOfRecurrence,
                recurrenceGroupId: t.recurrenceGroupId,
              }
            }
            return t
          })

          if (transaction.type === "income") {
            set({ incomes: updatedTransactions })
          } else {
            set({ expenses: updatedTransactions })
          }
        } else {
          // Update only the specific transaction
          get().updateTransaction({
            ...transaction,
            date: new Date(transaction.date),
          })
        }
      },

      addCategory: (category) => {
        set((state) => ({ categories: [...state.categories, category] }))
      },

      updateCategory: (category) => {
        set((state) => ({
          categories: state.categories.map((c) => (c.id === category.id ? category : c)),
        }))
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }))
      },

      importData: (data) => {
        set({
          incomes: data.incomes || [],
          expenses: data.expenses || [],
          categories: data.categories || INITIAL_CATEGORIES,
        })
      },

      clearAllData: () => {
        set({
          incomes: [],
          expenses: [],
          categories: INITIAL_CATEGORIES,
        })
      },
    }),
    {
      name: "financial-storage",
    },
  ),
)

// Helper function to generate recurring transactions
function generateRecurringTransactions(transaction: Transaction): Transaction[] {
  if (!transaction.isRecurring || !transaction.recurrenceCount || !transaction.recurrenceType) {
    return [transaction]
  }

  const transactions: Transaction[] = []
  const baseDate = new Date(transaction.date)

  for (let i = 0; i < transaction.recurrenceCount; i++) {
    let newDate: Date

    // Calculate the date based on recurrence type
    switch (transaction.recurrenceType) {
      case "daily":
        newDate = addDays(baseDate, i)
        break
      case "weekly":
        newDate = addWeeks(baseDate, i)
        break
      case "biweekly":
        newDate = addWeeks(baseDate, i * 2)
        break
      case "monthly":
        newDate = addMonths(baseDate, i)
        break
      case "yearly":
        newDate = addYears(baseDate, i)
        break
      default:
        newDate = addMonths(baseDate, i)
    }

    transactions.push({
      ...transaction,
      id: i === 0 ? transaction.id : `${transaction.id}-${i}`,
      date: newDate,
      isPartOfRecurrence: i > 0,
      recurrenceGroupId: transaction.id,
    })
  }

  return transactions
}

