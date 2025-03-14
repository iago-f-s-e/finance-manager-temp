import type { Transaction, TransactionFilters } from "@/types/transaction"
import type { Category } from "@/types/category"
import type { Wallet } from "@/types/wallet"
import {
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  startOfYear,
  endOfYear,
  getWeek,
  getDate,
  getMonth,
  getYear,
} from "date-fns"
import { ptBR } from "date-fns/locale"

export type TimeScale = "day" | "week" | "biweekly" | "month" | "year"

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

export function groupTransactionsByTimeScale(transactions: Transaction[], timeScale: TimeScale = "month") {
  const grouped: Record<string, number> = {}

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date)
    let key: string

    switch (timeScale) {
      case "day":
        key = format(date, "yyyy-MM-dd")
        break
      case "week":
        // Usar o número da semana no ano
        key = `${getYear(date)}-W${getWeek(date, { locale: ptBR })}`
        break
      case "biweekly":
        // Agrupar por quinzena (1-15 e 16-fim do mês)
        const day = getDate(date)
        const biweekly = day <= 15 ? "1" : "2"
        key = `${format(date, "yyyy-MM")}-${biweekly}`
        break
      case "year":
        key = format(date, "yyyy")
        break
      case "month":
      default:
        key = format(date, "yyyy-MM")
        break
    }

    if (!grouped[key]) {
      grouped[key] = 0
    }

    grouped[key] += transaction.value
  })

  return grouped
}

export function formatTimeScaleLabel(key: string, timeScale: TimeScale): string {
  switch (timeScale) {
    case "day":
      return format(parseISO(key), "dd/MM/yyyy", { locale: ptBR })
    case "week":
      const [year, week] = key.split("-W")
      return `Semana ${week}, ${year}`
    case "biweekly":
      const [monthKey, biweekly] = key.split("-")
      const month = format(parseISO(`${monthKey}-01`), "MMM yyyy", { locale: ptBR })
      return biweekly === "1" ? `1-15 ${month}` : `16-31 ${month}`
    case "year":
      return key
    case "month":
    default:
      return format(parseISO(`${key}-01`), "MMM yyyy", { locale: ptBR })
  }
}

export function calculateBalanceByTimeScale(
  incomesByTime: Record<string, number>,
  expensesByTime: Record<string, number>,
  timeScale: TimeScale = "month",
) {
  // Get all unique time periods from both incomes and expenses
  const allTimePeriods = [...new Set([...Object.keys(incomesByTime), ...Object.keys(expensesByTime)])].sort()

  let accumulated = 0

  return allTimePeriods.map((key) => {
    const income = incomesByTime[key] || 0
    const expense = expensesByTime[key] || 0
    const balance = income - expense
    accumulated += balance

    return {
      period: key,
      month: formatTimeScaleLabel(key, timeScale),
      income,
      expense,
      balance,
      accumulated,
    }
  })
}

export function groupTransactionsByMonth(transactions: Transaction[]) {
  return groupTransactionsByTimeScale(transactions, "month")
}

export function calculateMonthlyBalance(
  monthlyIncomes: Record<string, number>,
  monthlyExpenses: Record<string, number>,
) {
  return calculateBalanceByTimeScale(monthlyIncomes, monthlyExpenses, "month")
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

export function groupTransactionsByWallet(transactions: Transaction[], wallets: Wallet[]) {
  const result = wallets.reduce(
    (acc, wallet) => {
      acc[wallet.id] = 0
      return acc
    },
    {} as Record<string, number>,
  )

  transactions.forEach((transaction) => {
    if (result[transaction.walletId] !== undefined) {
      result[transaction.walletId] += transaction.value
    }
  })

  return Object.entries(result)
    .map(([walletId, value]) => {
      const wallet = wallets.find((w) => w.id === walletId)
      return {
        id: walletId,
        name: wallet?.name || "Carteira Desconhecida",
        value,
        color: wallet?.color,
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

    // Filter by wallets
    if (filters.walletIds && filters.walletIds.length > 0 && !filters.walletIds.includes(transaction.walletId)) {
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

export function getDateRangeByTimeScale(timeScale: TimeScale, date: Date = new Date()) {
  switch (timeScale) {
    case "day":
      return {
        startDate: startOfDay(date),
        endDate: endOfDay(date),
      }
    case "week":
      return {
        startDate: startOfWeek(date, { locale: ptBR }),
        endDate: endOfWeek(date, { locale: ptBR }),
      }
    case "biweekly":
      const day = getDate(date)
      const isFirstHalf = day <= 15
      const startOfBiweekly = isFirstHalf
        ? new Date(getYear(date), getMonth(date), 1)
        : new Date(getYear(date), getMonth(date), 16)
      const endOfBiweekly = isFirstHalf ? new Date(getYear(date), getMonth(date), 15, 23, 59, 59) : endOfMonth(date)
      return {
        startDate: startOfBiweekly,
        endDate: endOfBiweekly,
      }
    case "year":
      return {
        startDate: startOfYear(date),
        endDate: endOfYear(date),
      }
    case "month":
    default:
      return {
        startDate: startOfMonth(date),
        endDate: endOfMonth(date),
      }
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

