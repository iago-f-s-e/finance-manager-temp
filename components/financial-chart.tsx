"use client"

import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Transaction, TransactionFilters } from "@/types/transaction"
import type { Category } from "@/types/category"
import type { Wallet } from "@/types/wallet"
import {
  groupTransactionsByMonth,
  calculateMonthlyBalance,
  groupTransactionsByCategory,
  groupTransactionsByWallet,
  formatCurrency,
} from "@/lib/financial-utils"
import { CHART_TYPES } from "@/lib/constants"
import React from "react"

interface FinancialChartProps {
  incomes: Transaction[]
  expenses: Transaction[]
  categories: Category[]
  wallets: Wallet[]
  filters?: TransactionFilters
}

export function FinancialChart({ incomes, expenses, categories, wallets, filters }: FinancialChartProps) {
  const [chartType, setChartType] = useState("line")
  const [chartView, setChartView] = useState("overview")

  // Memoize chart data to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    const monthlyIncomes = groupTransactionsByMonth(incomes)
    const monthlyExpenses = groupTransactionsByMonth(expenses)
    return calculateMonthlyBalance(monthlyIncomes, monthlyExpenses)
  }, [incomes, expenses])

  // Memoize category data
  const categoryData = useMemo(() => {
    return {
      incomes: groupTransactionsByCategory(
        incomes,
        categories.filter((c) => c.type === "income"),
      ),
      expenses: groupTransactionsByCategory(
        expenses,
        categories.filter((c) => c.type === "expense"),
      ),
    }
  }, [incomes, expenses, categories])

  // Memoize wallet data
  const walletData = useMemo(() => {
    return {
      incomes: groupTransactionsByWallet(incomes, wallets),
      expenses: groupTransactionsByWallet(expenses, wallets),
      balance: wallets.map((wallet) => ({
        id: wallet.id,
        name: wallet.name,
        value: wallet.balance,
        color: wallet.color,
      })),
    }
  }, [incomes, expenses, wallets])

  // Usar React.memo para evitar renderizações desnecessárias do tooltip
  const TooltipContent = React.memo(({ label, payload }: { label: string; payload: any[] }) => (
    <div className="bg-background p-2 border rounded-md shadow-sm">
      <p className="font-medium">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={`item-${index}`} style={{ color: entry.color || entry.stroke }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  ))

  const renderTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return <TooltipContent label={label} payload={payload} />
    }
    return null
  }

  // Render the appropriate chart based on type and view
  const renderChart = () => {
    // Handle wallet charts
    if (chartView === "wallet-balance" || chartView === "wallet-income" || chartView === "wallet-expense") {
      let data

      if (chartView === "wallet-balance") {
        data = walletData.balance
      } else if (chartView === "wallet-income") {
        data = walletData.incomes
      } else {
        data = walletData.expenses
      }

      // Skip rendering if no data
      if (!data || data.length === 0) {
        return (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Nenhum dado disponível para exibição</p>
          </div>
        )
      }

      if (chartType === "pie") {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || `#${Math.floor(Math.random() * 16777215).toString(16)}`}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )
      }

      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend />
            <Bar
              dataKey="value"
              name={chartView === "wallet-balance" ? "Saldo" : chartView === "wallet-income" ? "Entradas" : "Saídas"}
              fill={chartView === "wallet-balance" ? "#3b82f6" : chartView === "wallet-income" ? "#10b981" : "#ef4444"}
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || `#${Math.floor(Math.random() * 16777215).toString(16)}`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )
    }

    // Handle category charts
    if (chartView === "category-income" || chartView === "category-expense") {
      const data = chartView === "category-income" ? categoryData.incomes : categoryData.expenses

      // Skip rendering if no data
      if (!data || data.length === 0) {
        return (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Nenhum dado disponível para exibição</p>
          </div>
        )
      }

      if (chartType === "pie") {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                label={(entry) => `${entry.label}: ${formatCurrency(entry.value)}`}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || `#${Math.floor(Math.random() * 16777215).toString(16)}`}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )
      }

      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend />
            <Bar
              dataKey="value"
              name={chartView === "category-income" ? "Entradas" : "Saídas"}
              fill={chartView === "category-income" ? "#10b981" : "#ef4444"}
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || `#${Math.floor(Math.random() * 16777215).toString(16)}`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )
    }

    // Skip rendering if no data
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Nenhum dado disponível para exibição</p>
        </div>
      )
    }

    // Handle regular charts
    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={renderTooltip} />
              <Legend />
              {(chartView === "overview" || chartView === "income-expense") && (
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Entradas"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              )}
              {(chartView === "overview" || chartView === "income-expense") && (
                <Line type="monotone" dataKey="expense" name="Saídas" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              )}
              {(chartView === "overview" || chartView === "balance") && (
                <Line type="monotone" dataKey="balance" name="Saldo" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              )}
              {(chartView === "overview" || chartView === "accumulated") && (
                <Line
                  type="monotone"
                  dataKey="accumulated"
                  name="Acumulado"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )

      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={renderTooltip} />
              <Legend />
              {(chartView === "overview" || chartView === "income-expense") && (
                <Bar dataKey="income" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
              )}
              {(chartView === "overview" || chartView === "income-expense") && (
                <Bar dataKey="expense" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              )}
              {(chartView === "overview" || chartView === "balance") && (
                <Bar dataKey="balance" name="Saldo" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              )}
              {(chartView === "overview" || chartView === "accumulated") && (
                <Bar dataKey="accumulated" name="Acumulado" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={renderTooltip} />
              <Legend />
              {(chartView === "overview" || chartView === "income-expense") && (
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Entradas"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                />
              )}
              {(chartView === "overview" || chartView === "income-expense") && (
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Saídas"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.2}
                />
              )}
              {(chartView === "overview" || chartView === "balance") && (
                <Area
                  type="monotone"
                  dataKey="balance"
                  name="Saldo"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                />
              )}
              {(chartView === "overview" || chartView === "accumulated") && (
                <Area
                  type="monotone"
                  dataKey="accumulated"
                  name="Acumulado"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )

      case "composed":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={renderTooltip} />
              <Legend />
              {(chartView === "overview" || chartView === "income-expense") && (
                <Bar dataKey="income" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
              )}
              {(chartView === "overview" || chartView === "income-expense") && (
                <Bar dataKey="expense" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              )}
              {(chartView === "overview" || chartView === "balance") && (
                <Line type="monotone" dataKey="balance" name="Saldo" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              )}
              {(chartView === "overview" || chartView === "accumulated") && (
                <Line
                  type="monotone"
                  dataKey="accumulated"
                  name="Acumulado"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={chartView} onValueChange={setChartView} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-3 sm:grid-cols-9">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="income-expense">Entradas/Saídas</TabsTrigger>
            <TabsTrigger value="balance">Saldo</TabsTrigger>
            <TabsTrigger value="accumulated">Acumulado</TabsTrigger>
            <TabsTrigger value="category-income">Categorias (E)</TabsTrigger>
            <TabsTrigger value="category-expense">Categorias (S)</TabsTrigger>
            <TabsTrigger value="wallet-balance">Carteiras (Saldo)</TabsTrigger>
            <TabsTrigger value="wallet-income">Carteiras (E)</TabsTrigger>
            <TabsTrigger value="wallet-expense">Carteiras (S)</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 ml-auto">
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de Gráfico" />
            </SelectTrigger>
            <SelectContent>
              {CHART_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="h-[400px]">{renderChart()}</div>
    </div>
  )
}

