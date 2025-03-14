import { create } from "zustand"
import { persist } from "zustand/middleware"
import { addDays, addMonths, addWeeks, addYears } from "date-fns"
import type { Transaction } from "@/types/transaction"
import type { Category } from "@/types/category"
import type { Wallet, WalletTransfer } from "@/types/wallet"
import { INITIAL_CATEGORIES, INITIAL_WALLETS } from "@/lib/constants"

interface FinancialState {
  incomes: Transaction[]
  expenses: Transaction[]
  categories: Category[]
  wallets: Wallet[]
  transfers: WalletTransfer[]

  // Transaction actions
  addTransaction: (transaction: Transaction) => void
  updateTransaction: (transaction: Transaction, updateAll?: boolean) => void
  deleteTransaction: (id: string, deleteAll?: boolean) => void
  effectuateTransaction: (id: string, isEffectuated: boolean, updateAll?: boolean) => void

  // Category actions
  addCategory: (category: Category) => void
  updateCategory: (category: Category) => void
  deleteCategory: (id: string) => void

  // Wallet actions
  addWallet: (wallet: Wallet) => void
  updateWallet: (wallet: Wallet) => void
  deleteWallet: (id: string) => void
  transferBetweenWallets: (transfer: WalletTransfer) => void
  updateWalletBalance: (walletId: string, newBalance: number) => void

  // Import/Export
  importData: (data: {
    incomes: Transaction[]
    expenses: Transaction[]
    categories: Category[]
    wallets: Wallet[]
    transfers: WalletTransfer[]
  }) => void
  clearAllData: () => void
}

export const useFinancialStore = create<FinancialState>()(
  persist(
    (set, get) => ({
      incomes: [],
      expenses: [],
      categories: INITIAL_CATEGORIES,
      wallets: INITIAL_WALLETS,
      transfers: [],

      addTransaction: (transaction) => {
        // Atualizar o saldo da carteira apenas se a transação for efetivada
        if (transaction.isEffectuated) {
          const { wallets } = get()
          const wallet = wallets.find((w) => w.id === transaction.walletId)

          if (wallet) {
            // Atualizar o saldo da carteira com base no tipo de transação
            const updatedWallets = wallets.map((w) => {
              if (w.id === wallet.id) {
                return {
                  ...w,
                  balance:
                    transaction.type === "income" ? w.balance + transaction.value : w.balance - transaction.value,
                }
              }
              return w
            })

            set({ wallets: updatedWallets })
          }
        }

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

      updateTransaction: (transaction, updateAll = false) => {
        // Encontrar a transação original para ajustar o saldo da carteira
        let originalTransaction: Transaction | undefined

        if (transaction.type === "income") {
          originalTransaction = get().incomes.find((t) => t.id === transaction.id)
        } else {
          originalTransaction = get().expenses.find((t) => t.id === transaction.id)
        }

        if (originalTransaction) {
          const { wallets } = get()
          let updatedWallets = [...wallets]

          // Ajustar o saldo da carteira apenas se a transação original ou a nova estiver efetivada
          if (originalTransaction.isEffectuated || transaction.isEffectuated) {
            // Se a carteira mudou, ajustar o saldo de ambas as carteiras
            if (originalTransaction.walletId !== transaction.walletId) {
              // Reverter o efeito na carteira original se estava efetivada
              if (originalTransaction.isEffectuated) {
                updatedWallets = updatedWallets.map((w) => {
                  if (w.id === originalTransaction!.walletId) {
                    return {
                      ...w,
                      balance:
                        transaction.type === "income"
                          ? w.balance - originalTransaction!.value
                          : w.balance + originalTransaction!.value,
                    }
                  }
                  return w
                })
              }

              // Aplicar o efeito na nova carteira se estiver efetivada
              if (transaction.isEffectuated) {
                updatedWallets = updatedWallets.map((w) => {
                  if (w.id === transaction.walletId) {
                    return {
                      ...w,
                      balance:
                        transaction.type === "income" ? w.balance + transaction.value : w.balance - transaction.value,
                    }
                  }
                  return w
                })
              }
            }
            // Se apenas o valor ou status de efetivação mudou, ajustar a diferença
            else {
              // Se ambas estão efetivadas, ajustar a diferença de valor
              if (originalTransaction.isEffectuated && transaction.isEffectuated) {
                const difference = transaction.value - originalTransaction.value

                updatedWallets = updatedWallets.map((w) => {
                  if (w.id === transaction.walletId) {
                    return {
                      ...w,
                      balance: transaction.type === "income" ? w.balance + difference : w.balance - difference,
                    }
                  }
                  return w
                })
              }
              // Se a original estava efetivada mas a nova não está, reverter o valor
              else if (originalTransaction.isEffectuated && !transaction.isEffectuated) {
                updatedWallets = updatedWallets.map((w) => {
                  if (w.id === transaction.walletId) {
                    return {
                      ...w,
                      balance:
                        transaction.type === "income"
                          ? w.balance - originalTransaction.value
                          : w.balance + originalTransaction.value,
                    }
                  }
                  return w
                })
              }
              // Se a original não estava efetivada mas a nova está, adicionar o valor
              else if (!originalTransaction.isEffectuated && transaction.isEffectuated) {
                updatedWallets = updatedWallets.map((w) => {
                  if (w.id === transaction.walletId) {
                    return {
                      ...w,
                      balance:
                        transaction.type === "income" ? w.balance + transaction.value : w.balance - transaction.value,
                    }
                  }
                  return w
                })
              }
            }

            set({ wallets: updatedWallets })
          }
        }

        // Handle recurrence group updates
        if (updateAll && (transaction.recurrenceGroupId || transaction.id)) {
          const groupId = transaction.recurrenceGroupId || transaction.id

          if (transaction.type === "income") {
            set((state) => ({
              incomes: state.incomes.map((t) => {
                // Atualiza todas as transações do grupo de recorrência
                if (t.recurrenceGroupId === groupId || t.id === groupId) {
                  return {
                    ...transaction,
                    id: t.id,
                    date: new Date(t.date),
                    isPartOfRecurrence: t.isPartOfRecurrence,
                    recurrenceGroupId: t.recurrenceGroupId,
                  }
                }
                return t
              }),
            }))
          } else {
            set((state) => ({
              expenses: state.expenses.map((t) => {
                // Atualiza todas as transações do grupo de recorrência
                if (t.recurrenceGroupId === groupId || t.id === groupId) {
                  return {
                    ...transaction,
                    id: t.id,
                    date: new Date(t.date),
                    isPartOfRecurrence: t.isPartOfRecurrence,
                    recurrenceGroupId: t.recurrenceGroupId,
                  }
                }
                return t
              }),
            }))
          }
        } else {
          // Update single transaction
          if (transaction.type === "income") {
            set((state) => ({
              incomes: state.incomes.map((income) => (income.id === transaction.id ? transaction : income)),
            }))
          } else {
            set((state) => ({
              expenses: state.expenses.map((expense) => (expense.id === transaction.id ? transaction : expense)),
            }))
          }
        }
      },

      effectuateTransaction: (id, isEffectuated, updateAll = false) => {
        // Encontrar a transação
        const income = get().incomes.find((t) => t.id === id)
        const expense = get().expenses.find((t) => t.id === id)
        const transaction = income || expense

        if (!transaction) return

        const now = new Date()
        const effectuatedAt = isEffectuated ? now : undefined

        // Atualizar o saldo da carteira se o status de efetivação mudou
        if (transaction.isEffectuated !== isEffectuated) {
          const { wallets } = get()
          const wallet = wallets.find((w) => w.id === transaction.walletId)

          if (wallet) {
            const updatedWallets = wallets.map((w) => {
              if (w.id === wallet.id) {
                // Se estiver efetivando, adicionar ao saldo (entrada) ou subtrair (saída)
                if (isEffectuated) {
                  return {
                    ...w,
                    balance:
                      transaction.type === "income" ? w.balance + transaction.value : w.balance - transaction.value,
                  }
                }
                // Se estiver desfazendo a efetivação, reverter o efeito no saldo
                else {
                  return {
                    ...w,
                    balance:
                      transaction.type === "income" ? w.balance - transaction.value : w.balance + transaction.value,
                  }
                }
              }
              return w
            })

            set({ wallets: updatedWallets })
          }
        }

        // Atualizar todas as transações do grupo de recorrência
        if (updateAll && (transaction.recurrenceGroupId || transaction.id)) {
          const groupId = transaction.recurrenceGroupId || transaction.id

          if (transaction.type === "income") {
            set((state) => ({
              incomes: state.incomes.map((t) => {
                if (t.recurrenceGroupId === groupId || t.id === groupId) {
                  // Se o status de efetivação mudou, atualizar o saldo da carteira
                  if (t.isEffectuated !== isEffectuated && t.id !== id) {
                    const wallet = get().wallets.find((w) => w.id === t.walletId)

                    if (wallet) {
                      const updatedWallets = get().wallets.map((w) => {
                        if (w.id === wallet.id) {
                          if (isEffectuated) {
                            return {
                              ...w,
                              balance: w.balance + t.value,
                            }
                          } else {
                            return {
                              ...w,
                              balance: w.balance - t.value,
                            }
                          }
                        }
                        return w
                      })

                      set({ wallets: updatedWallets })
                    }
                  }

                  return {
                    ...t,
                    isEffectuated,
                    effectuatedAt: isEffectuated ? effectuatedAt : undefined,
                  }
                }
                return t
              }),
            }))
          } else {
            set((state) => ({
              expenses: state.expenses.map((t) => {
                if (t.recurrenceGroupId === groupId || t.id === groupId) {
                  // Se o status de efetivação mudou, atualizar o saldo da carteira
                  if (t.isEffectuated !== isEffectuated && t.id !== id) {
                    const wallet = get().wallets.find((w) => w.id === t.walletId)

                    if (wallet) {
                      const updatedWallets = get().wallets.map((w) => {
                        if (w.id === wallet.id) {
                          if (isEffectuated) {
                            return {
                              ...w,
                              balance: w.balance - t.value,
                            }
                          } else {
                            return {
                              ...w,
                              balance: w.balance + t.value,
                            }
                          }
                        }
                        return w
                      })

                      set({ wallets: updatedWallets })
                    }
                  }

                  return {
                    ...t,
                    isEffectuated,
                    effectuatedAt: isEffectuated ? effectuatedAt : undefined,
                  }
                }
                return t
              }),
            }))
          }
        } else {
          // Atualizar apenas a transação específica
          if (transaction.type === "income") {
            set((state) => ({
              incomes: state.incomes.map((t) =>
                t.id === id ? { ...t, isEffectuated, effectuatedAt: isEffectuated ? effectuatedAt : undefined } : t,
              ),
            }))
          } else {
            set((state) => ({
              expenses: state.expenses.map((t) =>
                t.id === id ? { ...t, isEffectuated, effectuatedAt: isEffectuated ? effectuatedAt : undefined } : t,
              ),
            }))
          }
        }
      },

      deleteTransaction: (id, deleteAll = false) => {
        // Encontrar a transação para ajustar o saldo da carteira
        const income = get().incomes.find((t) => t.id === id)
        const expense = get().expenses.find((t) => t.id === id)
        const transaction = income || expense

        if (transaction && transaction.isEffectuated) {
          const { wallets } = get()

          // Ajustar o saldo da carteira
          const updatedWallets = wallets.map((w) => {
            if (w.id === transaction.walletId) {
              return {
                ...w,
                balance: transaction.type === "income" ? w.balance - transaction.value : w.balance + transaction.value,
              }
            }
            return w
          })

          set({ wallets: updatedWallets })
        }

        if (deleteAll && transaction && (transaction.recurrenceGroupId || transaction.isRecurring)) {
          const groupId = transaction.recurrenceGroupId || transaction.id

          // Ajustar o saldo para todas as transações efetivadas do grupo que serão excluídas
          if (transaction.type === "income") {
            const groupTransactions = get().incomes.filter(
              (t) => (t.recurrenceGroupId === groupId || t.id === groupId) && t.isEffectuated && t.id !== id,
            )

            // Atualizar os saldos das carteiras para cada transação efetivada que será excluída
            groupTransactions.forEach((t) => {
              const { wallets } = get()
              const updatedWallets = wallets.map((w) => {
                if (w.id === t.walletId) {
                  return {
                    ...w,
                    balance: w.balance - t.value,
                  }
                }
                return w
              })

              set({ wallets: updatedWallets })
            })
          } else {
            const groupTransactions = get().expenses.filter(
              (t) => (t.recurrenceGroupId === groupId || t.id === groupId) && t.isEffectuated && t.id !== id,
            )

            // Atualizar os saldos das carteiras para cada transação efetivada que será excluída
            groupTransactions.forEach((t) => {
              const { wallets } = get()
              const updatedWallets = wallets.map((w) => {
                if (w.id === t.walletId) {
                  return {
                    ...w,
                    balance: w.balance + t.value,
                  }
                }
                return w
              })

              set({ wallets: updatedWallets })
            })
          }

          // Excluir todas as transações do grupo de recorrência
          set((state) => ({
            incomes: state.incomes.filter((t) => t.recurrenceGroupId !== groupId && t.id !== groupId),
            expenses: state.expenses.filter((t) => t.recurrenceGroupId !== groupId && t.id !== groupId),
          }))
        } else {
          // Excluir apenas a transação específica
          set((state) => ({
            incomes: state.incomes.filter((income) => income.id !== id),
            expenses: state.expenses.filter((expense) => expense.id !== id),
          }))
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

      addWallet: (wallet) => {
        set((state) => ({ wallets: [...state.wallets, wallet] }))
      },

      updateWallet: (wallet) => {
        set((state) => ({
          wallets: state.wallets.map((w) => (w.id === wallet.id ? wallet : w)),
        }))
      },

      deleteWallet: (id) => {
        // Verificar se existem transações vinculadas a esta carteira
        const { incomes, expenses } = get()
        const hasTransactions = incomes.some((t) => t.walletId === id) || expenses.some((t) => t.walletId === id)

        if (hasTransactions) {
          throw new Error("Não é possível excluir uma carteira com transações vinculadas")
        }

        set((state) => ({
          wallets: state.wallets.filter((w) => w.id !== id),
        }))
      },

      transferBetweenWallets: (transfer) => {
        const { wallets } = get()
        const fromWallet = wallets.find((w) => w.id === transfer.fromWalletId)
        const toWallet = wallets.find((w) => w.id === transfer.toWalletId)

        if (!fromWallet || !toWallet) {
          throw new Error("Carteiras não encontradas")
        }

        if (fromWallet.balance < transfer.amount) {
          throw new Error("Saldo insuficiente para transferência")
        }

        // Atualizar os saldos das carteiras
        const updatedWallets = wallets.map((w) => {
          if (w.id === fromWallet.id) {
            return { ...w, balance: w.balance - transfer.amount }
          }
          if (w.id === toWallet.id) {
            return { ...w, balance: w.balance + transfer.amount }
          }
          return w
        })

        // Criar transações de saída e entrada para a transferência
        const transferId = crypto.randomUUID()
        const now = new Date()

        const expenseTransaction: Transaction = {
          id: `transfer-out-${transferId}`,
          type: "expense",
          name: `Transferência para ${toWallet.name}`,
          value: transfer.amount,
          date: transfer.date,
          category: "transfer",
          walletId: fromWallet.id,
          description: transfer.description || `Transferência para ${toWallet.name}`,
          transferId,
          isEffectuated: true,
          effectuatedAt: now,
          createdAt: now,
        }

        const incomeTransaction: Transaction = {
          id: `transfer-in-${transferId}`,
          type: "income",
          name: `Transferência de ${fromWallet.name}`,
          value: transfer.amount,
          date: transfer.date,
          category: "transfer",
          walletId: toWallet.id,
          description: transfer.description || `Transferência de ${fromWallet.name}`,
          transferId,
          isEffectuated: true,
          effectuatedAt: now,
          createdAt: now,
        }

        set((state) => ({
          wallets: updatedWallets,
          transfers: [...state.transfers, transfer],
          expenses: [...state.expenses, expenseTransaction],
          incomes: [...state.incomes, incomeTransaction],
        }))
      },

      updateWalletBalance: (walletId, newBalance) => {
        set((state) => ({
          wallets: state.wallets.map((w) => (w.id === walletId ? { ...w, balance: newBalance } : w)),
        }))
      },

      importData: (data) => {
        // Ensure dates are properly converted to Date objects
        const processedData = {
          incomes: data.incomes.map((income) => ({
            ...income,
            date: new Date(income.date),
            effectuatedAt: income.effectuatedAt ? new Date(income.effectuatedAt) : undefined,
            createdAt: new Date(income.createdAt),
            isEffectuated: income.isEffectuated || false,
          })),
          expenses: data.expenses.map((expense) => ({
            ...expense,
            date: new Date(expense.date),
            effectuatedAt: expense.effectuatedAt ? new Date(expense.effectuatedAt) : undefined,
            createdAt: new Date(expense.createdAt),
            isEffectuated: expense.isEffectuated || false,
          })),
          categories: data.categories || INITIAL_CATEGORIES,
          wallets: data.wallets || INITIAL_WALLETS,
          transfers: data.transfers
            ? data.transfers.map((transfer) => ({
                ...transfer,
                date: new Date(transfer.date),
                createdAt: new Date(transfer.createdAt),
              }))
            : [],
        }

        set(processedData)
      },

      clearAllData: () => {
        set({
          incomes: [],
          expenses: [],
          categories: INITIAL_CATEGORIES,
          wallets: INITIAL_WALLETS,
          transfers: [],
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

