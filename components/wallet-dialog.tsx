"use client"

// Inside the delete wallet dialog section:
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Transaction {
  id: string
  walletId: string
  // other transaction properties
}

interface Wallet {
  id: string
  name: string
  // other wallet properties
}

interface WalletDialogProps {
  wallets: Wallet[]
  selectedWallet: Wallet | null
  setSelectedWallet: (wallet: Wallet | null) => void
  deleteWallet: (walletId: string) => void
  updateTransaction: (transaction: Transaction) => void
  deleteTransaction: (transactionId: string) => void
  incomes: Transaction[]
  expenses: Transaction[]
  setIsDeleteDialogOpen: (open: boolean) => void
  setError: (error: string | null) => void
}

const WalletDialog = ({
  wallets,
  selectedWallet,
  setSelectedWallet,
  deleteWallet,
  updateTransaction,
  deleteTransaction,
  incomes,
  expenses,
  setIsDeleteDialogOpen,
  setError,
}: WalletDialogProps) => {
  const [deleteTransactions, setDeleteTransactions] = useState(false)
  const [targetWalletId, setTargetWalletId] = useState("")

  const hasTransactions = (walletId: string): boolean => {
    return [...incomes, ...expenses].some((t) => t.walletId === walletId)
  }

  const handleDeleteWallet = async () => {
    if (!selectedWallet) return

    try {
      if (hasTransactions(selectedWallet.id)) {
        if (deleteTransactions) {
          // Delete all transactions associated with this wallet
          const walletTransactions = [...incomes, ...expenses].filter((t) => t.walletId === selectedWallet.id)
          walletTransactions.forEach((t) => deleteTransaction(t.id))
        } else if (targetWalletId) {
          // Transfer transactions to another wallet
          const walletTransactions = [...incomes, ...expenses].filter((t) => t.walletId === selectedWallet.id)
          walletTransactions.forEach((t) => {
            updateTransaction({
              ...t,
              walletId: targetWalletId,
            })
          })
        } else {
          throw new Error("Selecione uma carteira de destino ou opte por excluir as transações")
        }
      }

      deleteWallet(selectedWallet.id)
      setIsDeleteDialogOpen(false)
      setSelectedWallet(null)
      setError(null)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Ocorreu um erro ao excluir a carteira")
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="delete-transactions"
          checked={deleteTransactions}
          onCheckedChange={(checked) => {
            setDeleteTransactions(checked === true)
            if (checked) setTargetWalletId("")
          }}
        />
        <label
          htmlFor="delete-transactions"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Excluir todas as transações vinculadas
        </label>
      </div>

      {!deleteTransactions && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Transferir transações para:</label>
          <Select value={targetWalletId} onValueChange={setTargetWalletId} disabled={deleteTransactions}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma carteira" />
            </SelectTrigger>
            <SelectContent>
              {wallets
                .filter((w) => w.id !== selectedWallet?.id)
                .map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

export default WalletDialog

