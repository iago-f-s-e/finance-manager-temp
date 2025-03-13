"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import type { Transaction } from "@/types/transaction"

interface FinancialDataContextType {
  incomes: Transaction[]
  expenses: Transaction[]
  addIncome: (income: Transaction) => void
  addExpense: (expense: Transaction) => void
  updateIncome: (income: Transaction) => void
  updateExpense: (expense: Transaction) => void
  deleteIncome: (id: string) => void
  deleteExpense: (id: string) => void
}

const FinancialDataContext = createContext<FinancialDataContextType | undefined>(undefined)

export function FinancialDataProvider({ children }: { children: React.ReactNode }) {
  const [incomes, setIncomes] = useState<Transaction[]>([])
  const [expenses, setExpenses] = useState<Transaction[]>([])

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedIncomes = localStorage.getItem("incomes")
    const savedExpenses = localStorage.getItem("expenses")

    if (savedIncomes) {
      setIncomes(JSON.parse(savedIncomes))
    }

    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses))
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("incomes", JSON.stringify(incomes))
  }, [incomes])

  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses))
  }, [expenses])

  // Helper function to generate recurring transactions
  const generateRecurringTransactions = (transaction: Transaction): Transaction[] => {
    if (!transaction.isRecurring || !transaction.recurrenceCount) {
      return [transaction]
    }

    const transactions: Transaction[] = []
    const baseDate = new Date(transaction.date)

    for (let i = 0; i < transaction.recurrenceCount; i++) {
      const newDate = new Date(baseDate)
      newDate.setMonth(baseDate.getMonth() + i)

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

  const addIncome = (income: Transaction) => {
    if (income.isRecurring && income.recurrenceCount) {
      const recurringIncomes = generateRecurringTransactions(income)
      setIncomes((prev) => [...prev, ...recurringIncomes])
    } else {
      setIncomes((prev) => [...prev, income])
    }
  }

  const addExpense = (expense: Transaction) => {
    if (expense.isRecurring && expense.recurrenceCount) {
      const recurringExpenses = generateRecurringTransactions(expense)
      setExpenses((prev) => [...prev, ...recurringExpenses])
    } else {
      setExpenses((prev) => [...prev, expense])
    }
  }

  const updateIncome = (updatedIncome: Transaction) => {
    setIncomes((prev) => prev.map((income) => (income.id === updatedIncome.id ? updatedIncome : income)))
  }

  const updateExpense = (updatedExpense: Transaction) => {
    setExpenses((prev) => prev.map((expense) => (expense.id === updatedExpense.id ? updatedExpense : expense)))
  }

  const deleteIncome = (id: string) => {
    setIncomes((prev) => prev.filter((income) => income.id !== id))
  }

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id))
  }

  return (
    <FinancialDataContext.Provider
      value={{
        incomes,
        expenses,
        addIncome,
        addExpense,
        updateIncome,
        updateExpense,
        deleteIncome,
        deleteExpense,
      }}
    >
      {children}
    </FinancialDataContext.Provider>
  )
}

export function useFinancialData() {
  const context = useContext(FinancialDataContext)

  if (context === undefined) {
    throw new Error("useFinancialData must be used within a FinancialDataProvider")
  }

  return context
}

