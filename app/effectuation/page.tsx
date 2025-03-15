"use client"

import { useState, useEffect, useMemo } from "react"
import { format, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, ArrowRightLeft, CheckCircle2, ArrowUpIcon, ArrowDownIcon, WalletIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { WalletTransferForm } from "@/components/wallet-transfer-form"
import { useFinancialStore } from "@/lib/store"
import { formatCurrency } from "@/lib/financial-utils"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import type { TransactionType } from "@/types/transaction"
import type { WalletTransfer } from "@/types/wallet"

export default function EffectuationPage() {
  const { toast } = useToast()
  const { incomes, expenses, wallets, effectuateTransaction, transferBetweenWallets } = useFinancialStore()

  // Estado para o tipo de transação ativo (entrada ou saída)
  const [activeType, setActiveType] = useState<TransactionType>("expense")

  // Estado para o range de datas
  const [dateRange, setDateRange] = useState<{
    from: Date
    to: Date
  }>({
    from: new Date(),
    to: addDays(new Date(), 2),
  })

  // Estado para transações selecionadas
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])

  // Estado para o diálogo de transferência
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)

  // Filtrar transações não efetivadas dentro do range de datas
  const pendingTransactions = useMemo(() => {
    const transactions = activeType === "income" ? incomes : expenses

    return transactions
      .filter((transaction) => {
        const transactionDate = new Date(transaction.date)

        // Verificar se está dentro do range de datas
        const isInDateRange = transactionDate >= dateRange.from && transactionDate <= dateRange.to

        // Verificar se não está efetivada
        const isNotEffectuated = !transaction.isEffectuated

        return isInDateRange && isNotEffectuated
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [incomes, expenses, activeType, dateRange])

  // Filtrar transações já efetivadas dentro do range de datas
  const effectuatedTransactions = useMemo(() => {
    const transactions = activeType === "income" ? incomes : expenses

    return transactions
      .filter((transaction) => {
        const transactionDate = new Date(transaction.date)

        // Verificar se está dentro do range de datas
        const isInDateRange = transactionDate >= dateRange.from && transactionDate <= dateRange.to

        // Verificar se está efetivada
        const isEffectuated = transaction.isEffectuated

        return isInDateRange && isEffectuated
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [incomes, expenses, activeType, dateRange])

  // Calcular o valor total das transações selecionadas
  const totalSelectedValue = useMemo(() => {
    return pendingTransactions
      .filter((transaction) => selectedTransactions.includes(transaction.id))
      .reduce((sum, transaction) => sum + transaction.value, 0)
  }, [pendingTransactions, selectedTransactions])

  // Calcular o valor total das transações pendentes
  const totalPendingValue = useMemo(() => {
    return pendingTransactions.reduce((sum, transaction) => sum + transaction.value, 0)
  }, [pendingTransactions])

  // Calcular o valor total das transações efetivadas
  const totalEffectuatedValue = useMemo(() => {
    return effectuatedTransactions.reduce((sum, transaction) => sum + transaction.value, 0)
  }, [effectuatedTransactions])

  // Função para alternar a seleção de uma transação
  const toggleTransactionSelection = (id: string) => {
    setSelectedTransactions((prev) =>
      prev.includes(id) ? prev.filter((transactionId) => transactionId !== id) : [...prev, id],
    )
  }

  // Função para selecionar todas as transações
  const selectAllTransactions = () => {
    if (selectedTransactions.length === pendingTransactions.length) {
      setSelectedTransactions([])
    } else {
      setSelectedTransactions(pendingTransactions.map((t) => t.id))
    }
  }

  // Função para efetivar as transações selecionadas
  const effectuateSelectedTransactions = () => {
    selectedTransactions.forEach((id) => {
      effectuateTransaction(id, true, false)
    })

    toast({
      title: "Transações efetivadas",
      description: `${selectedTransactions.length} transações foram efetivadas com sucesso.`,
    })

    setSelectedTransactions([])
  }

  // Função para lidar com transferências entre carteiras
  const handleTransfer = (transfer: WalletTransfer) => {
    try {
      transferBetweenWallets(transfer)
      setIsTransferDialogOpen(false)

      toast({
        title: "Transferência realizada",
        description: `Transferência de ${formatCurrency(transfer.amount)} realizada com sucesso.`,
      })
    } catch (err) {
      toast({
        title: "Erro na transferência",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao realizar a transferência",
        variant: "destructive",
      })
    }
  }

  // Obter o nome da carteira
  const getWalletName = (walletId: string) => {
    const wallet = wallets.find((w) => w.id === walletId)
    return wallet ? wallet.name : "Carteira desconhecida"
  }

  // Obter a cor da carteira
  const getWalletColor = (walletId: string) => {
    const wallet = wallets.find((w) => w.id === walletId)
    return wallet?.color || "#6b7280"
  }

  // Limpar seleções quando mudar o tipo de transação
  useEffect(() => {
    setSelectedTransactions([])
  }, [activeType])

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Efetivação de Transações</h1>
          <Button variant="outline" className="gap-1" onClick={() => setIsTransferDialogOpen(true)}>
            <ArrowRightLeft className="h-4 w-4" />
            Transferir Entre Carteiras
          </Button>
        </div>
        <p className="text-muted-foreground">Efetive suas transações pendentes e gerencie suas carteiras</p>
      </div>

      {/* Carteiras */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {wallets.map((wallet) => (
          <Card key={wallet.id}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full" style={{ backgroundColor: `${wallet.color}20`, color: wallet.color }}>
                  <WalletIcon className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-medium">{wallet.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(wallet.balance)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumo de valores */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Período</CardTitle>
          <CardDescription>
            Valores totais para o período de {format(dateRange.from, "dd/MM/yyyy")} a{" "}
            {format(dateRange.to, "dd/MM/yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Pendentes</h3>
              <p className="text-2xl font-bold" style={{ color: activeType === "income" ? "#10b981" : "#ef4444" }}>
                {formatCurrency(totalPendingValue)}
              </p>
              <p className="text-sm text-muted-foreground">{pendingTransactions.length} transações</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Efetivadas</h3>
              <p className="text-2xl font-bold" style={{ color: activeType === "income" ? "#10b981" : "#ef4444" }}>
                {formatCurrency(totalEffectuatedValue)}
              </p>
              <p className="text-sm text-muted-foreground">{effectuatedTransactions.length} transações</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Total no Período</h3>
              <p className="text-2xl font-bold" style={{ color: activeType === "income" ? "#10b981" : "#ef4444" }}>
                {formatCurrency(totalPendingValue + totalEffectuatedValue)}
              </p>
              <p className="text-sm text-muted-foreground">
                {pendingTransactions.length + effectuatedTransactions.length} transações
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros e Controles */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs value={activeType} onValueChange={(value) => setActiveType(value as TransactionType)}>
          <TabsList>
            <TabsTrigger value="expense">Saídas</TabsTrigger>
            <TabsTrigger value="income">Entradas</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, "P", { locale: ptBR })} - {format(dateRange.to, "P", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({
                      from: range.from,
                      to: range.to,
                    })
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Transações Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Pendentes</CardTitle>
          <CardDescription>Selecione as transações que deseja efetivar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Lista de transações pendentes */}
          <div className="border rounded-md">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedTransactions.length > 0 && selectedTransactions.length === pendingTransactions.length
                  }
                  onCheckedChange={selectAllTransactions}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Selecionar todas ({pendingTransactions.length})
                </label>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Total selecionado: <span className="font-bold">{formatCurrency(totalSelectedValue)}</span>
                </span>
                <Button size="sm" disabled={selectedTransactions.length === 0} onClick={effectuateSelectedTransactions}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Efetivar Selecionadas
                </Button>
              </div>
            </div>

            {pendingTransactions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">Não há transações pendentes para o período selecionado</p>
              </div>
            ) : (
              <div className="divide-y">
                {pendingTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        id={`transaction-${transaction.id}`}
                        checked={selectedTransactions.includes(transaction.id)}
                        onCheckedChange={() => toggleTransactionSelection(transaction.id)}
                      />

                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full"
                        style={{
                          backgroundColor:
                            activeType === "income" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                          color: activeType === "income" ? "#10b981" : "#ef4444",
                        }}
                      >
                        {activeType === "income" ? (
                          <ArrowUpIcon className="h-5 w-5" />
                        ) : (
                          <ArrowDownIcon className="h-5 w-5" />
                        )}
                      </div>

                      <div>
                        <p className="font-medium">{transaction.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{format(new Date(transaction.date), "dd/MM/yyyy")}</span>
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1"
                            style={{
                              borderColor: getWalletColor(transaction.walletId),
                              color: getWalletColor(transaction.walletId),
                            }}
                          >
                            <WalletIcon className="h-3 w-3" />
                            {getWalletName(transaction.walletId)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-medium" style={{ color: activeType === "income" ? "#10b981" : "#ef4444" }}>
                        {formatCurrency(transaction.value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transações Efetivadas */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Efetivadas</CardTitle>
          <CardDescription>Transações já efetivadas no período selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          {effectuatedTransactions.length === 0 ? (
            <div className="p-8 text-center border rounded-md">
              <p className="text-muted-foreground">Não há transações efetivadas para o período selecionado</p>
            </div>
          ) : (
            <div className="border rounded-md divide-y">
              {effectuatedTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: activeType === "income" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                        color: activeType === "income" ? "#10b981" : "#ef4444",
                      }}
                    >
                      {activeType === "income" ? (
                        <ArrowUpIcon className="h-5 w-5" />
                      ) : (
                        <ArrowDownIcon className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{transaction.name}</p>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{format(new Date(transaction.date), "dd/MM/yyyy")}</span>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                          style={{
                            borderColor: getWalletColor(transaction.walletId),
                            color: getWalletColor(transaction.walletId),
                          }}
                        >
                          <WalletIcon className="h-3 w-3" />
                          {getWalletName(transaction.walletId)}
                        </Badge>
                        {transaction.effectuatedAt && (
                          <span className="text-xs">
                            Efetivada em: {format(new Date(transaction.effectuatedAt), "dd/MM/yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-medium" style={{ color: activeType === "income" ? "#10b981" : "#ef4444" }}>
                      {formatCurrency(transaction.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de transferência */}
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

