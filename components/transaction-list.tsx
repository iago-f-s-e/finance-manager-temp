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
  onUpdate: (transaction: Transaction, updateAll: boolean) => void
  onDelete: (id: string) => void
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
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const categoriesStore = useFinancialStore((state) => state.categories)
  const categories = useMemo(() => categoriesStore.filter((c) => c.type === type), [categoriesStore, type])


  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    // Filter by search term
    if (searchTerm && !transaction.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== "all" && transaction.category !== selectedCategory) {
      return false
    }

    return true
  })

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB
  })

  const handleEdit = (transaction: Transaction) => {
    setEditTransaction(transaction)
    setIsDialogOpen(true)
  }

  const handleUpdate = (updatedTransaction: Transaction, updateAll?: boolean) => {
    onUpdate(updatedTransaction, Boolean(updateAll))
    setIsDialogOpen(false)
    setEditTransaction(null)
  }

  const handleDelete = (id: string) => {
    onDelete(id)
  }

  const getCategoryLabel = (categoryValue: string) => {
    const category = categories.find((cat) => cat.value === categoryValue)
    return category ? category.label : categoryValue
  }

  const getCategoryColor = (categoryValue: string) => {
    const category = categories.find((cat) => cat.value === categoryValue)
    return category?.color || "#6b7280"
  }

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc")
  }

  return (
    <>
      <div className="flex flex-col space-y-2 mb-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

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

          <Button variant="outline" size="icon" onClick={toggleSortOrder}>
            {sortOrder === "desc" ? <SortDescIcon className="h-4 w-4" /> : <SortAscIcon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        {sortedTransactions.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Nenhuma {type === "income" ? "entrada" : "saída"} encontrada
              </p>
              <p className="text-xs text-muted-foreground">
                {searchTerm || selectedCategory
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
                    <p className="text-sm font-medium leading-none">{transaction.name}</p>
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
                    <Badge
                      variant="secondary"
                      className="mt-1"
                      style={{
                        backgroundColor: `${getCategoryColor(transaction.category)}20`,
                        color: getCategoryColor(transaction.category),
                      }}
                    >
                      {getCategoryLabel(transaction.category)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium" style={{ color: getCategoryColor(transaction.category) }}>
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
                      {transaction.isRecurring && (
                        // TODO: lidar com handleEdit no caso do updateAllRecurrences = true
                        <DropdownMenuItem onClick={() => handleEdit({ ...transaction, updateAllRecurrences: true })}>
                          <RepeatIcon className="mr-2 h-4 w-4" />
                          Editar todas recorrências
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(transaction.id)}>
                        <TrashIcon className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
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

