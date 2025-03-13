import type { Category } from "@/types/category"
import type { RecurrenceType } from "@/types/transaction"
import type { Wallet } from "@/types/wallet"

export const INITIAL_CATEGORIES: Category[] = [
  // Income categories
  { id: "salary", type: "income", value: "salary", label: "Salário", color: "#10b981", isDefault: true },
  { id: "freelance", type: "income", value: "freelance", label: "Freelance", color: "#3b82f6", isDefault: true },
  {
    id: "investments",
    type: "income",
    value: "investments",
    label: "Investimentos",
    color: "#8b5cf6",
    isDefault: true,
  },
  { id: "rental", type: "income", value: "rental", label: "Aluguel", color: "#f59e0b", isDefault: true },
  { id: "other_income", type: "income", value: "other_income", label: "Outros", color: "#6b7280", isDefault: true },

  // Expense categories
  { id: "housing", type: "expense", value: "housing", label: "Moradia", color: "#ef4444", isDefault: true },
  { id: "food", type: "expense", value: "food", label: "Alimentação", color: "#f97316", isDefault: true },
  {
    id: "transportation",
    type: "expense",
    value: "transportation",
    label: "Transporte",
    color: "#84cc16",
    isDefault: true,
  },
  { id: "utilities", type: "expense", value: "utilities", label: "Contas", color: "#06b6d4", isDefault: true },
  {
    id: "entertainment",
    type: "expense",
    value: "entertainment",
    label: "Entretenimento",
    color: "#8b5cf6",
    isDefault: true,
  },
  { id: "health", type: "expense", value: "health", label: "Saúde", color: "#ec4899", isDefault: true },
  { id: "education", type: "expense", value: "education", label: "Educação", color: "#0ea5e9", isDefault: true },
  { id: "shopping", type: "expense", value: "shopping", label: "Compras", color: "#d946ef", isDefault: true },
  { id: "debt", type: "expense", value: "debt", label: "Dívidas", color: "#dc2626", isDefault: true },
  { id: "other_expense", type: "expense", value: "other_expense", label: "Outros", color: "#6b7280", isDefault: true },
]

export const INITIAL_WALLETS: Wallet[] = [
  {
    id: "main",
    name: "Conta Principal",
    description: "Conta principal para gerenciar despesas do dia a dia",
    balance: 0,
    color: "#3b82f6",
    icon: "wallet",
    isDefault: true,
    createdAt: new Date(),
  },
  {
    id: "savings",
    name: "Reserva de Emergência",
    description: "Fundo para emergências",
    balance: 0,
    color: "#10b981",
    icon: "shield",
    isDefault: true,
    createdAt: new Date(),
  },
  {
    id: "investments",
    name: "Investimentos",
    description: "Recursos para investimentos de longo prazo",
    balance: 0,
    color: "#8b5cf6",
    icon: "trending-up",
    isDefault: true,
    createdAt: new Date(),
  },
]

export const RECURRENCE_TYPES: { value: RecurrenceType; label: string }[] = [
  { value: "daily", label: "Diária" },
  { value: "weekly", label: "Semanal" },
  { value: "biweekly", label: "Quinzenal" },
  { value: "monthly", label: "Mensal" },
  { value: "yearly", label: "Anual" },
]

export const CHART_TYPES = [
  { value: "line", label: "Linha" },
  { value: "bar", label: "Barra" },
  { value: "area", label: "Área" },
  { value: "pie", label: "Pizza" },
  { value: "composed", label: "Composto (Linha e Barra)" },
]

export const WALLET_ICONS = [
  { value: "wallet", label: "Carteira" },
  { value: "credit-card", label: "Cartão de Crédito" },
  { value: "piggy-bank", label: "Cofrinho" },
  { value: "landmark", label: "Banco" },
  { value: "shield", label: "Segurança" },
  { value: "briefcase", label: "Trabalho" },
  { value: "home", label: "Casa" },
  { value: "car", label: "Carro" },
  { value: "plane", label: "Viagem" },
  { value: "heart", label: "Saúde" },
  { value: "graduation-cap", label: "Educação" },
  { value: "gift", label: "Presente" },
  { value: "shopping-bag", label: "Compras" },
  { value: "trending-up", label: "Investimentos" },
]

