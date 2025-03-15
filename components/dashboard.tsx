"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FinancialChart } from "@/components/financial-chart"
import { TransactionList } from "@/components/transaction-list"
import { TransactionForm } from "@/components/transaction-form"
import { ImportExport } from "@/components/import-export"
import { WalletList } from "@/components/wallet-list"
import { useFinancialStore } from "@/lib/store"
import { formatCurrency } from "@/lib/financial-utils"
import { ArrowDownIcon, ArrowUpIcon, BarChart3Icon, DollarSignIcon, ListFilterIcon, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Dashboard() {
  const router = useRouter()
  const { incomes, expenses, categories, wallets, addTransaction, updateTransaction, deleteTransaction } =
    useFinancialStore()

  const [totals, setTotals] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    accumulated: 0,
  })

  useEffect(() => {
    // Calcular os novos totais
    const totalIncome = incomes.reduce((sum, income) => sum + income.value, 0)
    const totalExpense = expenses.reduce((sum, expense) => sum + expense.value, 0)
    const balance = totalIncome - totalExpense

    // Verificar se os valores realmente mudaram antes de atualizar o estado
    setTotals((prev) => {
      if (
        prev.totalIncome !== totalIncome ||
        prev.totalExpense !== totalExpense ||
        prev.balance !== balance ||
        prev.accumulated !== balance
      ) {
        return {
          totalIncome,
          totalExpense,
          balance,
          accumulated: balance,
        }
      }
      return prev
    })
  }, [incomes, expenses])

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <Link href="/">
            <h1 className="text-3xl font-bold tracking-tight hover:text-primary/80 transition-colors">
              Gestão Financeira
            </h1>
          </Link>
          <div className="flex items-center gap-2">
            <ImportExport />
            <Button variant="outline" className="gap-1" onClick={() => router.push("/details")}>
              <ListFilterIcon className="h-4 w-4" />
              Detalhes e Filtros
            </Button>
            <Button variant="outline" className="gap-1" onClick={() => router.push("/effectuation")}>
              <CheckCircle2 className="h-4 w-4" />
              Efetivação
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">Gerencie suas finanças, acompanhe receitas e despesas</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas Totais</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas Totais</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalExpense)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.balance)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acumulado</CardTitle>
            <BarChart3Icon className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.accumulated)}</div>
          </CardContent>
        </Card>
      </div>

      <WalletList />

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Visão Geral Financeira</CardTitle>
          <CardDescription>Acompanhe suas entradas, saídas e saldo ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <FinancialChart incomes={incomes} expenses={expenses} categories={categories} wallets={wallets} />
        </CardContent>
      </Card>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="add-income">Nova Entrada</TabsTrigger>
          <TabsTrigger value="add-expense">Nova Saída</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Entradas</CardTitle>
                <CardDescription>Gerencie suas entradas financeiras</CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionList
                  transactions={incomes}
                  type="income"
                  onUpdate={updateTransaction}
                  onDelete={deleteTransaction}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Saídas</CardTitle>
                <CardDescription>Gerencie suas saídas financeiras</CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionList
                  transactions={expenses}
                  type="expense"
                  onUpdate={updateTransaction}
                  onDelete={deleteTransaction}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="add-income">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Entrada</CardTitle>
              <CardDescription>Registre uma nova entrada financeira</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionForm type="income" onSubmit={(transaction) => addTransaction(transaction)} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="add-expense">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Saída</CardTitle>
              <CardDescription>Registre uma nova saída financeira</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionForm type="expense" onSubmit={(transaction) => addTransaction(transaction)} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

