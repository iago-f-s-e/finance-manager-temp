"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { FinancialChart } from "@/components/financial-chart"
import { TransactionList } from "@/components/transaction-list"
import { ImportExport } from "@/components/import-export"
import { useFinancialStore } from "@/lib/store"
import type { TransactionFilters } from "@/types/transaction"
import { filterTransactions, getCurrentMonthDateRange, formatCurrency } from "@/lib/financial-utils"
import { cn } from "@/lib/utils"

export default function DetailsPage() {
  // Get current month date range
  const currentMonthRange = getCurrentMonthDateRange()

  // Get data from store
  const { incomes, expenses, categories, wallets, updateTransaction, deleteTransaction } = useFinancialStore()

  // State for filters
  const [filters, setFilters] = useState<TransactionFilters>({
    startDate: currentMonthRange.startDate,
    endDate: currentMonthRange.endDate,
    categories: [],
    searchTerm: "",
  })

  // State for UI elements
  const [dateRange, setDateRange] = useState<{
    from: Date
    to: Date | undefined
  }>({
    from: currentMonthRange.startDate,
    to: currentMonthRange.endDate,
  })

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Memoized filtered transactions
  const filteredIncomes = filterTransactions(incomes, filters)
  const filteredExpenses = filterTransactions(expenses, filters)

  // Calculate totals
  const totalIncome = filteredIncomes.reduce((sum, income) => sum + income.value, 0)
  const totalExpense = filteredExpenses.reduce((sum, expense) => sum + expense.value, 0)
  const balance = totalIncome - totalExpense

  // Update filters when date range changes
  useEffect(() => {
    if (dateRange.from) {
      setFilters((prev) => ({
        ...prev,
        startDate: dateRange.from,
        endDate: dateRange.to || dateRange.from,
      }))
    }
  }, [dateRange])

  // Handle category selection
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setSelectedCategories((prev) => {
      const newCategories = checked ? [...prev, categoryId] : prev.filter((id) => id !== categoryId)

      return newCategories
    })
  }

  // Apply category filters
  const applyFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      categories: selectedCategories,
      searchTerm: searchTerm,
    }))
  }, [selectedCategories, searchTerm])

  // Reset filters
  const resetFilters = useCallback(() => {
    setSelectedCategories([])
    setSearchTerm("")
    setDateRange({
      from: currentMonthRange.startDate,
      to: currentMonthRange.endDate,
    })
    setFilters({
      startDate: currentMonthRange.startDate,
      endDate: currentMonthRange.endDate,
      categories: [],
      searchTerm: "",
    })
  }, [currentMonthRange.startDate, currentMonthRange.endDate])

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Detalhes Financeiros</h1>
          <ImportExport />
        </div>
        <p className="text-muted-foreground">
          Analise detalhadamente suas finanças e aplique filtros para visualizar dados específicos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Entradas Filtradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saídas Filtradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo Filtrado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", balance >= 0 ? "text-blue-600" : "text-red-600")}>
              {formatCurrency(balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Refine os dados exibidos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Período</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "P", { locale: ptBR })} -{" "}
                          {format(dateRange.to, "P", { locale: ptBR })}
                        </>
                      ) : (
                        format(dateRange.from, "P", { locale: ptBR })
                      )
                    ) : (
                      <span>Selecione um período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range?.from) {
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

              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentMonth = getCurrentMonthDateRange()
                    setDateRange({
                      from: currentMonth.startDate,
                      to: currentMonth.endDate,
                    })
                  }}
                >
                  Mês Atual
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const now = new Date()
                    const firstDay = new Date(now.getFullYear(), 0, 1)
                    const lastDay = new Date(now.getFullYear(), 11, 31)
                    setDateRange({
                      from: firstDay,
                      to: lastDay,
                    })
                  }}
                >
                  Ano Atual
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Busca</Label>
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Categorias de Entrada</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {categories
                  .filter((category) => category.type === "income")
                  .map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(category.value)}
                        onCheckedChange={(checked) => handleCategoryChange(category.value, checked === true)}
                      />
                      <label
                        htmlFor={`category-${category.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                      >
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                        {category.label}
                      </label>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categorias de Saída</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {categories
                  .filter((category) => category.type === "expense")
                  .map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(category.value)}
                        onCheckedChange={(checked) => handleCategoryChange(category.value, checked === true)}
                      />
                      <label
                        htmlFor={`category-${category.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                      >
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                        {category.label}
                      </label>
                    </div>
                  ))}
              </div>
            </div>

            <Button
              className="mt-2 w-full"
              size="sm"
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  categories: selectedCategories,
                }))
              }}
            >
              Aplicar Filtros de Categoria
            </Button>

            <Button className="w-full" onClick={applyFilters}>
              Aplicar Filtros
            </Button>

            <Button variant="outline" className="w-full" onClick={resetFilters}>
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gráficos</CardTitle>
              <CardDescription>Visualize seus dados financeiros</CardDescription>
            </CardHeader>
            <CardContent>
              <FinancialChart
                incomes={filteredIncomes}
                expenses={filteredExpenses}
                categories={categories}
                filters={filters}
                wallets={wallets}
              />
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Entradas</CardTitle>
                <CardDescription>{filteredIncomes.length} entradas encontradas</CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionList
                  transactions={filteredIncomes}
                  type="income"
                  onUpdate={updateTransaction}
                  onDelete={deleteTransaction}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Saídas</CardTitle>
                <CardDescription>{filteredExpenses.length} saídas encontradas</CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionList
                  transactions={filteredExpenses}
                  type="expense"
                  onUpdate={updateTransaction}
                  onDelete={deleteTransaction}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

