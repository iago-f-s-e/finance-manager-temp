"use client"

import { useState } from "react"
import { Trash2, Edit, Plus, CreditCard, Wallet as WalletIcon, ArrowRightLeft, AlertCircle, Target } from "lucide-react"
import { useFinancialStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WalletTransferForm } from "./wallet-transfer-form"
import { handleInputMoneyMask } from "@/lib/mask"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { WalletForm } from "@/components/wallet-form";
import {Wallet} from "@/types/wallet";

export function WalletList() {
  const { wallets, incomes, expenses, addWallet, updateWallet, deleteWallet, updateTransaction, deleteTransaction } =
    useFinancialStore()
  const { toast } = useToast()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteTransactions, setDeleteTransactions] = useState(false)
  const [targetWalletId, setTargetWalletId] = useState("")

  const hasTransactions = (walletId: string): boolean => {
    return [...incomes, ...expenses].some((t) => t.walletId === walletId)
  }

  const getWalletTransactionsCount = (walletId: string): number => {
    return [...incomes, ...expenses].filter((t) => t.walletId === walletId).length
  }

  const handleAddWallet = (wallet: Wallet) => {
    addWallet(wallet)
    setIsAddDialogOpen(false)

    toast({
      title: "Carteira adicionada",
      description: `A carteira ${wallet.name} foi adicionada com sucesso`,
    })
  }

  const handleEditWallet = (wallet: Wallet) => {
    updateWallet(wallet)
    setIsEditDialogOpen(false)
    setSelectedWallet(null)

    toast({
      title: "Carteira atualizada",
      description: `A carteira ${wallet.name} foi atualizada com sucesso`,
    })
  }

  const handleDeleteWallet = () => {
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
      setDeleteTransactions(false)
      setTargetWalletId("")

      toast({
        title: "Carteira excluída",
        description: `A carteira ${selectedWallet.name} foi excluída com sucesso`,
      })
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Ocorreu um erro ao excluir a carteira")
      }
    }
  }

  const walletIcons = [
    { value: "wallet", label: "Carteira", icon: <WalletIcon className="h-4 w-4" /> },
    { value: "credit-card", label: "Cartão de Crédito", icon: <CreditCard className="h-4 w-4" /> },
  ]

  const calculateGoalProgress = (wallet: WalletType): number => {
    if (!wallet.goal) return 0
    const progress = (wallet.balance / wallet.goal.value) * 100
    return Math.min(progress, 100) // Limitar a 100%
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Carteiras</h2>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Carteira
          </Button>
          <Button onClick={() => setIsTransferDialogOpen(true)} variant="outline" className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Transferir
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {wallets.map((wallet) => (
          <Card key={wallet.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {wallet.icon === "wallet" ? (
                    <WalletIcon className="h-5 w-5" style={{ color: wallet.color }} />
                  ) : (
                    <CreditCard className="h-5 w-5" style={{ color: wallet.color }} />
                  )}
                  <CardTitle>{wallet.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="19" cy="12" r="1" />
                          <circle cx="5" cy="12" r="1" />
                        </svg>
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedWallet(wallet)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setSelectedWallet(wallet)
                          setIsDeleteDialogOpen(true)
                          setError(null)
                          setDeleteTransactions(false)
                          setTargetWalletId("")
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardDescription>Saldo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{handleInputMoneyMask(wallet.balance)}</div>
              {wallet.goal && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Meta: {handleInputMoneyMask(wallet.goal.value)}
                    </span>
                    <span>{Math.round(calculateGoalProgress(wallet))}%</span>
                  </div>
                  <Progress value={calculateGoalProgress(wallet)} className="h-1.5" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Wallet Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Carteira</DialogTitle>
            <DialogDescription>Adicione uma nova carteira para gerenciar suas finanças</DialogDescription>
          </DialogHeader>

          <WalletForm onSubmit={handleAddWallet} onCancel={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Wallet Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Carteira</DialogTitle>
            <DialogDescription>Atualize os detalhes da carteira selecionada</DialogDescription>
          </DialogHeader>

          {selectedWallet && (
            <WalletForm
              wallet={selectedWallet}
              onSubmit={handleEditWallet}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}

        </DialogContent>
      </Dialog>

      {/* Delete Wallet Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Carteira</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir a carteira {selectedWallet?.name}?</DialogDescription>
          </DialogHeader>

          {selectedWallet && hasTransactions(selectedWallet.id) && (
            <>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription>
                  Esta carteira possui {getWalletTransactionsCount(selectedWallet.id)} transações vinculadas. Escolha
                  uma das opções abaixo:
                </AlertDescription>
              </Alert>

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
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWallet}
              disabled={Boolean(selectedWallet && hasTransactions(selectedWallet.id) && !deleteTransactions && !targetWalletId)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Transferir Entre Carteiras</DialogTitle>
            <DialogDescription>Transfira valores entre suas carteiras</DialogDescription>
          </DialogHeader>
          <WalletTransferForm onSubmit={() => setIsTransferDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

