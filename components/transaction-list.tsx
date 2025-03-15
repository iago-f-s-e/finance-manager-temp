"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  EditIcon,
  MoreHorizontalIcon,
  RepeatIcon,
  SearchIcon,
  SortAscIcon,
  SortDescIcon,
  TrashIcon,
  WalletIcon,
  CheckCircle,
  XCircle,
  CheckCircle2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TransactionForm } from "@/components/transaction-form"
import type { Transaction, TransactionType } from "@/types/transaction"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/financial-utils"
import { useFinancialStore } from "@/lib/store"

interface TransactionListProps {
  transactions: Transaction[]
  type: TransactionType
  onUpdate: (transaction: Transaction, updateAll?: boolean) => void
  onDelete: (id: string, deleteAll?: boolean) => void
}

const RECURRENCE_TYPES = [
  { value: "daily", label: "Diariamente" },
  { value: "weekly", label: "Semanalmente" },
  { value: "monthly", label: "Mensalmente" },
  { value: "yearly", label: "Anualmente" },
]

export function TransactionList({ transactions, type, onUpdate, onDelete }: TransactionListProps) {
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedWallet, setSelectedWallet] = useState<string>("")
  const [selectedEffectuated, setSelectedEffectuated] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [recurrenceGroupFilter, setRecurrenceGroupFilter] = useState<string | null>(null)

  const categoriesStore = useFinancialStore((state) => state.categories)
  const categories = useMemo(() => categoriesStore.filter((c) => c.type === type), [categoriesStore, type])
  const wallets = useFinancialStore((state) => state.wallets)
  const effectuateTransaction = useFinancialStore((state) => state.effectuateTransaction)

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Filter by search term
      if (searchTerm && !transaction.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // Filter by category
      if (selectedCategory && selectedCategory !== "all" && transaction.category !== selectedCategory) {
        return false
      }

      // Filter by wallet
      if (selectedWallet && selectedWallet !== "all" && transaction.walletId !== selectedWallet) {
        return false
      }

      // Filter by effectuated status
      if (selectedEffectuated !== "all") {
        const isEffectuated = selectedEffectuated === "effectuated"
        if (transaction.isEffectuated !== isEffectuated) {
          return false
        }
      }

      // Filter by recurrence group
      if (recurrenceGroupFilter) {
        const groupId = transaction.recurrenceGroupId || transaction.id
        if (groupId !== recurrenceGroupFilter) {
          return false
        }
      }

      return true
    })
  }, [transactions, searchTerm, selectedCategory, selectedWallet, selectedEffectuated, recurrenceGroupFilter])

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      // Usar explicitamente a data da transação, não a data de criação
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB
    })
  }, [filteredTransactions, sortOrder])

  const handleEdit = (transaction: Transaction) => {
    setEditTransaction(transaction)
    setIsDialogOpen(true)
  }

  const handleUpdate = (updatedTransaction: Transaction, updateAll?: boolean) => {
    onUpdate(updatedTransaction, Boolean(updateAll))
    setIsDialogOpen(false)
    setEditTransaction(null)
  }

  const handleDelete = (transaction: Transaction, deleteAll = false) => {
    onDelete(transaction.id, deleteAll && (transaction.isRecurring || transaction.recurrenceGroupId !== undefined))
  }

  const handleEffectuate = (transaction: Transaction, isEffectuated: boolean, updateAll = false) => {
    effectuateTransaction(transaction.id, isEffectuated, updateAll)
  }

  const getCategoryLabel = (categoryValue: string) => {
    const category = categories.find((cat) => cat.value === categoryValue)
    return category ? category.label : categoryValue
  }

  const getCategoryColor = (categoryValue: string) => {
    const category = categories.find((cat) => cat.value === categoryValue)
    return category?.color || "#6b7280"
  }

  const getWalletName = (walletId: string) => {
    const wallet = wallets.find((w) => w.id === walletId)
    return wallet ? wallet.name : "Carteira Desconhecida"
  }

  const getWalletColor = (walletId: string) => {
    const wallet = wallets.find((w) => w.id === walletId)
    return wallet?.color || "#6b7280"
  }

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc")
  }

  const handleFilterByRecurrenceGroup = (transaction: Transaction) => {
    const groupId = transaction.recurrenceGroupId || transaction.id
    setRecurrenceGroupFilter(groupId)
  }

  const clearRecurrenceGroupFilter = () => {
    setRecurrenceGroupFilter(null)
  }

  return (
    <>
      <div className="flex flex-col space-y-4 mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                    {category.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedWallet} onValueChange={setSelectedWallet}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Carteira" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as carteiras</SelectItem>
              {wallets.map((wallet) => (
                <SelectItem key={wallet.id} value={wallet.id}>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: wallet.color }} />
                    {wallet.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedEffectuated} onValueChange={setSelectedEffectuated}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="effectuated">Efetivadas</SelectItem>
              <SelectItem value="not-effectuated">Não efetivadas</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={toggleSortOrder}>
            {sortOrder === "desc" ? <SortDescIcon className="h-4 w-4" /> : <SortAscIcon className="h-4 w-4" />}
          </Button>
        </div>

        {recurrenceGroupFilter && (
          <div className="flex items-center">
            <Badge variant="outline" className="gap-1">
              <RepeatIcon className="h-3 w-3" />
              Filtrando por grupo de recorrência
            </Badge>
            <Button variant="ghost" size="sm" onClick={clearRecurrenceGroupFilter} className="ml-2 h-6 px-2">
              <XCircle className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="h-[400px] pr-4">
        {sortedTransactions.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Nenhuma {type === "income" ? "entrada" : "saída"} encontrada
              </p>
              <p className="text-xs text-muted-foreground">
                {searchTerm || selectedCategory || selectedWallet || selectedEffectuated !== "all"
                  ? "Tente ajustar os filtros"
                  : `Adicione uma nova ${type === "income" ? "entrada" : "saída"} para começar`}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center space-x-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: `${getCategoryColor(transaction.category)}20`,
                      color: getCategoryColor(transaction.category),
                    }}
                  >
                    {type === "income" ? <ArrowUpIcon className="h-5 w-5" /> : <ArrowDownIcon className="h-5 w-5" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-none">{transaction.name}</p>
                      {transaction.isEffectuated ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {format(new Date(transaction.date), "dd/MM/yyyy")}
                      {transaction.isRecurring && (
                        <Badge variant="outline" className="ml-2 gap-1">
                          <RepeatIcon className="h-3 w-3" />
                          {transaction.recurrenceType
                            ? RECURRENCE_TYPES.find((t) => t.value === transaction.recurrenceType)?.label
                            : "Recorrente"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: `${getCategoryColor(transaction.category)}20`,
                          color: getCategoryColor(transaction.category),
                        }}
                      >
                        {getCategoryLabel(transaction.category)}
                      </Badge>
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
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${transaction.isEffectuated ? "" : "opacity-60"}`}
                      style={{ color: getCategoryColor(transaction.category) }}
                    >
                      {formatCurrency(transaction.value)}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontalIcon className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                        <EditIcon className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      {!transaction.isEffectuated && (
                        <DropdownMenuItem onClick={() => handleEffectuate(transaction, true, false)}>
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          Efetivar
                        </DropdownMenuItem>
                      )}
                      {transaction.isEffectuated && (
                        <DropdownMenuItem onClick={() => handleEffectuate(transaction, false, false)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Desfazer efetivação
                        </DropdownMenuItem>
                      )}
                      {(transaction.isRecurring || transaction.recurrenceGroupId) && !transaction.isEffectuated && (
                        <DropdownMenuItem onClick={() => handleEffectuate(transaction, true, true)}>
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          Efetivar todas recorrências
                        </DropdownMenuItem>
                      )}
                      {(transaction.isRecurring || transaction.recurrenceGroupId) && transaction.isEffectuated && (
                        <DropdownMenuItem onClick={() => handleEffectuate(transaction, false, true)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Desfazer efetivação de todas
                        </DropdownMenuItem>
                      )}
                      {(transaction.isRecurring || transaction.recurrenceGroupId) && (
                        <>
                          <DropdownMenuItem onClick={() => handleFilterByRecurrenceGroup(transaction)}>
                            <RepeatIcon className="mr-2 h-4 w-4" />
                            Filtrar por este grupo
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {(transaction.isRecurring || transaction.recurrenceGroupId) && (
                        <DropdownMenuItem onClick={() => handleEdit({ ...transaction, updateAllRecurrences: true })}>
                          <RepeatIcon className="mr-2 h-4 w-4" />
                          Editar todas recorrências
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(transaction)}>
                        <TrashIcon className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                      {(transaction.isRecurring || transaction.recurrenceGroupId) && (
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(transaction, true)}>
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Excluir todas recorrências
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar {type === "income" ? "Entrada" : "Saída"}</DialogTitle>
            <DialogDescription>
              Atualize os detalhes da {type === "income" ? "entrada" : "saída"} selecionada
            </DialogDescription>
          </DialogHeader>
          {editTransaction && (
            <TransactionForm
              type={type}
              transaction={editTransaction}
              onSubmit={handleUpdate}
              onCancel={() => setIsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

