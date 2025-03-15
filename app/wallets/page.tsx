"use client"

import { useState, useMemo } from "react"
import { useFinancialStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { WalletForm } from "@/components/wallet-form"
import { WalletTransferForm } from "@/components/wallet-transfer-form"
import { formatCurrency } from "@/lib/financial-utils"
import { Edit, MoreHorizontal, Plus, Trash, ArrowRightLeft, History } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Checkbox } from "@/components/ui/checkbox"
import type { Wallet, WalletTransfer } from "@/types/wallet"
import * as LucideIcons from "lucide-react"

export default function WalletsPage() {
  const {
    wallets,
    incomes,
    expenses,
    transfers,
    addWallet,
    updateWallet,
    deleteWallet,
    transferBetweenWallets,
    updateTransaction,
    deleteTransaction,
  } = useFinancialStore()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("wallets")
  const [deleteTransactions, setDeleteTransactions] = useState(false)
  const [targetWalletId, setTargetWalletId] = useState<string>("")

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)

  // Dados para o gráfico de pizza
  const walletChartData = useMemo(() => {
    return wallets.map((wallet) => ({
      name: wallet.name,
      value: wallet.balance,
      color: wallet.color || "#6b7280",
    }))
  }, [wallets])

  // Histórico de transferências
  const transferHistory = useMemo(() => {
    return [...transfers].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transfers])

  // Verificar se uma carteira tem transações vinculadas
  const hasTransactions = (walletId: string) => {
    return [...incomes, ...expenses].some((t) => t.walletId === walletId)
  }

  const getWalletTransactionsCount = (walletId: string): number => {
    return [...incomes, ...expenses].filter((t) => t.walletId === walletId).length
  }

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
    const iconKey = (iconName.charAt(0).toUpperCase() + iconName.slice(1))
      .split("-")
      .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
      .join("")

    const Icon = (LucideIcons as Record<string, any>)[iconKey]
    return Icon ? <Icon className="h-5 w-5" /> : null
  }

  // Obter o nome da carteira
  const getWalletName = (walletId: string) => {
    const wallet = wallets.find((w) => w.id === walletId)
    return wallet ? wallet.name : "Carteira desconhecida"
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Carteiras</h1>
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
        <p className="text-muted-foreground">Gerencie suas carteiras, visualize saldos e histórico de transferências</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="wallets">Carteiras</TabsTrigger>
          <TabsTrigger value="transfers">Histórico de Transferências</TabsTrigger>
        </TabsList>

        <TabsContent value="wallets" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Gráfico de distribuição de saldo */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Distribuição de Saldo</CardTitle>
                <CardDescription>Visualização do saldo por carteira</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {walletChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={walletChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {walletChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">Nenhuma carteira com saldo disponível</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Saldo total */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Saldo Total</CardTitle>
                <CardDescription>Soma de todas as carteiras</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-6">{formatCurrency(totalBalance)}</div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Resumo de Carteiras</h3>
                  <div className="space-y-2">
                    {wallets.map((wallet) => (
                      <div key={wallet.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: wallet.color }} />
                          <span>{wallet.name}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(wallet.balance)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de carteiras */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {wallets.map((wallet) => (
              <Card key={wallet.id}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div
                        className="p-2 rounded-full"
                        style={{ backgroundColor: `${wallet.color}20`, color: wallet.color }}
                      >
                        {renderWalletIcon(wallet.icon || "Wallet")}
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
                          setError(null)
                          setDeleteTransactions(false)
                          setTargetWalletId("")
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
        </TabsContent>

        <TabsContent value="transfers">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transferências</CardTitle>
              <CardDescription>Registro de todas as transferências entre carteiras</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {transferHistory.length === 0 ? (
                  <div className="flex h-40 items-center justify-center text-center">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Nenhuma transferência encontrada</p>
                      <p className="text-xs text-muted-foreground">
                        Realize transferências entre suas carteiras para visualizar o histórico
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transferHistory.map((transfer) => (
                      <div key={transfer.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                            <p className="font-medium">
                              {getWalletName(transfer.fromWalletId)} → {getWalletName(transfer.toWalletId)}
                            </p>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <History className="mr-1 h-3 w-3" />
                            {format(new Date(transfer.date), "PPP", { locale: ptBR })}
                          </div>
                          {transfer.description && (
                            <p className="text-sm text-muted-foreground">{transfer.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-blue-600">{formatCurrency(transfer.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
            <DialogDescription>Tem certeza que deseja excluir a carteira {selectedWallet?.name}?</DialogDescription>
          </DialogHeader>

          {selectedWallet && (
            <div className="flex items-center gap-2 p-3 border rounded-md">
              <div
                className="p-2 rounded-full"
                style={{ backgroundColor: `${selectedWallet.color}20`, color: selectedWallet.color }}
              >
                {renderWalletIcon(selectedWallet.icon || "Wallet")}
              </div>
              <div>
                <p className="font-medium">{selectedWallet.name}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(selectedWallet.balance)}</p>
              </div>
            </div>
          )}

          {selectedWallet && hasTransactions(selectedWallet.id) && (
            <>
              <Alert variant="warning">
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
                        <SelectValue placeholder="Selecione uma carteira de destino" />
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
              disabled={selectedWallet && hasTransactions(selectedWallet.id) && !deleteTransactions && !targetWalletId}
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
          <WalletTransferForm onSubmit={handleTransfer} onCancel={() => setIsTransferDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

