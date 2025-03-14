"use client"

import { useState } from "react"
import { useFinancialStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { WalletForm } from "@/components/wallet-form"
import { WalletTransferForm } from "@/components/wallet-transfer-form"
import { formatCurrency } from "@/lib/financial-utils"
import { Edit, MoreHorizontal, Plus, Trash, ArrowRightLeft } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { Wallet, WalletTransfer } from "@/types/wallet"
import * as LucideIcons from "lucide-react"

export function WalletList() {
  const { wallets, addWallet, updateWallet, deleteWallet, transferBetweenWallets } = useFinancialStore()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [error, setError] = useState<string | null>(null)

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)

  const handleAddWallet = (wallet: Wallet) => {
    addWallet(wallet)
    setIsAddDialogOpen(false)
  }

  const handleEditWallet = (wallet: Wallet) => {
    updateWallet(wallet)
    setIsEditDialogOpen(false)
    setSelectedWallet(null)
  }

  const handleDeleteWallet = () => {
    if (!selectedWallet) return

    try {
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

  const handleTransfer = (transfer: WalletTransfer) => {
    try {
      transferBetweenWallets(transfer)
      setIsTransferDialogOpen(false)
      setError(null)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Ocorreu um erro ao realizar a transferência")
      }
    }
  }

  // Função para renderizar o ícone da carteira
  const renderWalletIcon = (iconName: string) => {
    const Icon = (LucideIcons as Record<string, any>)[
      iconName
        .split("-")
        .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
        .join("")
    ]

    return Icon ? <Icon className="h-5 w-5" /> : null
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Carteiras</h2>
        <div className="flex gap-2">
          <Button onClick={() => setIsTransferDialogOpen(true)} className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Transferir
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Carteira
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Saldo Total</CardTitle>
            <CardDescription className="text-blue-100">Soma de todas as carteiras</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalBalance)}</div>
          </CardContent>
        </Card>

        {wallets.map((wallet) => (
          <Card key={wallet.id}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className="p-2 rounded-full"
                    style={{ backgroundColor: `${wallet.color}20`, color: wallet.color }}
                  >
                    {renderWalletIcon(wallet.icon || "wallet")}
                  </div>
                  <CardTitle className="text-lg">{wallet.name}</CardTitle>
                </div>
                {wallet.description && <CardDescription className="mt-1">{wallet.description}</CardDescription>}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Abrir menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedWallet(wallet)
                      setIsEditDialogOpen(true)
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => {
                      setSelectedWallet(wallet)
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: wallet.color }}>
                {formatCurrency(wallet.balance)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Wallet Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Carteira</DialogTitle>
            <DialogDescription>Crie uma nova carteira para organizar suas finanças</DialogDescription>
          </DialogHeader>
          <WalletForm onSubmit={handleAddWallet} onCancel={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Wallet Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Excluir Carteira</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta carteira? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          {selectedWallet && (
            <div className="flex items-center gap-2 p-3 border rounded-md">
              <div
                className="p-2 rounded-full"
                style={{ backgroundColor: `${selectedWallet.color}20`, color: selectedWallet.color }}
              >
                {renderWalletIcon(selectedWallet.icon || "wallet")}
              </div>
              <div>
                <p className="font-medium">{selectedWallet.name}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(selectedWallet.balance)}</p>
              </div>
            </div>
          )}

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>Não é possível excluir uma carteira que possui transações vinculadas.</AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteWallet}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Transferir Entre Carteiras</DialogTitle>
            <DialogDescription>Transfira valores entre suas carteiras</DialogDescription>
          </DialogHeader>
          <WalletTransferForm onSubmit={handleTransfer} onCancel={() => setIsTransferDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}

