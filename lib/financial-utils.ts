import type { Transaction, TransactionFilters } from "@/types/transaction"
import type { Category } from "@/types/category"
import { format, isAfter, isBefore, parseISO, startOfMonth, endOfMonth } from "date-fns"

export function calculateTotals(incomes: Transaction[], expenses: Transaction[]) {
  const totalIncome = incomes.reduce((sum, income) => sum + income.value, 0)
  const totalExpense = expenses.reduce((sum, expense) => sum + expense.value, 0)
  const balance = totalIncome - totalExpense
  const accumulated = balance

  return {
    totalIncome,
    totalExpense,
    balance,
    accumulated,
  }
}

export function groupTransactionsByMonth(transactions: Transaction[]) {
  const grouped: Record<string, number> = {}

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date)
    const monthKey = format(date, "yyyy-MM")

    if (!grouped[monthKey]) {
      grouped[monthKey] = 0
    }

    grouped[monthKey] += transaction.value
  })

  return grouped
}

export function calculateMonthlyBalance(
  monthlyIncomes: Record<string, number>,
  monthlyExpenses: Record<string, number>,
) {
  // Get all unique months from both incomes and expenses
  const allMonths = [...new Set([...Object.keys(monthlyIncomes), ...Object.keys(monthlyExpenses)])].sort()

  let accumulated = 0

  return allMonths.map((monthKey) => {
    const income = monthlyIncomes[monthKey] || 0
    const expense = monthlyExpenses[monthKey] || 0
    const balance = income - expense
    accumulated += balance

    return {
      month: format(parseISO(monthKey), "MMM yyyy"),
      income,
      expense,
      balance,
      accumulated,
    }
  })
}

export function groupTransactionsByCategory(transactions: Transaction[], categories: Category[]) {
  const result = categories.reduce(
    (acc, category) => {
      acc[category.value] = 0
      return acc
    },
    {} as Record<string, number>,
  )

  transactions.forEach((transaction) => {
    if (result[transaction.category] !== undefined) {
      result[transaction.category] += transaction.value
    } else {
      // Handle transactions with categories that might have been deleted
      result[transaction.category] = transaction.value
    }
  })

  return Object.entries(result)
    .map(([category, value]) => {
      const categoryObj = categories.find((c) => c.value === category)
      return {
        category,
        label: categoryObj?.label || category,
        value,
        color: categoryObj?.color,
      }
    })
    .filter((item) => item.value > 0)
}

export function filterTransactions(transactions: Transaction[], filters: TransactionFilters): Transaction[] {
  return transactions.filter((transaction) => {
    const date = new Date(transaction.date)

    // Filter by date range
    if (filters.startDate && isBefore(date, filters.startDate)) {
      return false
    }

    if (filters.endDate && isAfter(date, filters.endDate)) {
      return false
    }

    // Filter by categories
    if (filters.categories && filters.categories.length > 0 && !filters.categories.includes(transaction.category)) {
      return false
    }

    // Filter by search term
    if (filters.searchTerm && !transaction.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false
    }

    return true
  })
}

export function getCurrentMonthDateRange() {
  const now = new Date()
  return {
    startDate: startOfMonth(now),
    endDate: endOfMonth(now),
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function parseCurrencyInput(value: string): number {
  // Remove currency symbol, dots and replace comma with dot
  const cleanValue = value.replace(/[^\d,]/g, "").replace(",", ".")
  return Number.parseFloat(cleanValue) || 0
}

export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

