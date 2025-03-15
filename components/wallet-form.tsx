"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WALLET_ICONS } from "@/lib/constants"
import type { Wallet } from "@/types/wallet"
import { handleInputMoneyMask, handleRemoveMoneyMask } from "@/lib/mask"
import type { LucideIcon } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { useFinancialStore } from "@/lib/store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {TransactionType} from "@/types/transaction";

const walletFormSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  description: z.string().optional(),
  balance: z.string().min(1, {
    message: "O saldo inicial é obrigatório.",
  }),
  color: z.string().regex(/^#([0-9A-F]{6})$/i, {
    message: "Cor inválida. Use formato hexadecimal (ex: #FF5733).",
  }),
  icon: z.string(),
})

const adjustmentFormSchema = z.object({
  reason: z.string().min(3, {
    message: "O motivo deve ter pelo menos 3 caracteres.",
  }),
})

type WalletFormValues = z.infer<typeof walletFormSchema>
type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>

interface WalletFormProps {
  wallet?: Wallet
  onSubmit: (wallet: Wallet) => void
  onCancel?: () => void
}

export function WalletForm({ wallet, onSubmit, onCancel }: WalletFormProps) {
  const [selectedIcon, setSelectedIcon] = useState(wallet?.icon || "wallet")
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false)
  const [newBalance, setNewBalance] = useState<number>(0)
  const [oldBalance, setOldBalance] = useState<number>(0)
  const addTransaction = useFinancialStore((state) => state.addTransaction)

  const defaultValues: Partial<WalletFormValues> = {
    name: wallet?.name || "",
    description: wallet?.description || "",
    balance: wallet ? handleInputMoneyMask(wallet.balance) : "R$ 0,00",
    color:
      wallet?.color ||
      "#" +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0"),
    icon: wallet?.icon || "wallet",
  }

  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletFormSchema),
    defaultValues,
  })

  const adjustmentForm = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: {
      reason: "",
    },
  })

  // Quando o valor do saldo mudar e for um wallet existente, armazenar os valores para comparação
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "balance" && wallet) {
        const newBalanceValue = handleRemoveMoneyMask(value.balance as string)
        setNewBalance(newBalanceValue)
        setOldBalance(wallet.balance)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, wallet])

  function handleSubmit(data: WalletFormValues) {
    const balanceValue = handleRemoveMoneyMask(data.balance)

    // Se for uma carteira existente e o saldo mudou, abrir diálogo para ajuste
    if (wallet && balanceValue !== wallet.balance) {
      setIsAdjustmentDialogOpen(true)
      return
    }

    const newWallet: Wallet = {
      id: wallet?.id || crypto.randomUUID(),
      name: data.name,
      description: data.description,
      balance: balanceValue,
      color: data.color,
      icon: data.icon,
      createdAt: wallet?.createdAt || new Date(),
    }

    onSubmit(newWallet)
  }

  function handleAdjustmentSubmit(data: AdjustmentFormValues) {
    // Criar a transação de ajuste
    const now = new Date()
    const difference = newBalance - oldBalance

    if (difference !== 0) {
      // Determinar se é entrada ou saída
      const type: TransactionType = difference > 0 ? "income" : "expense"

      // Criar a transação
      const transaction = {
        id: crypto.randomUUID(),
        type,
        name: `Ajuste de saldo: ${data.reason}`,
        value: Math.abs(difference),
        date: now,
        category: type === "income" ? "other_income" : "other_expense",
        walletId: wallet!.id,
        description: `Ajuste de saldo de ${handleInputMoneyMask(oldBalance)} para ${handleInputMoneyMask(newBalance)}: ${data.reason}`,
        isEffectuated: true,
        effectuatedAt: now,
        createdAt: now,
      }

      // Adicionar a transação
      addTransaction(transaction)
    }

    // Criar a carteira com o novo saldo
    const newWallet: Wallet = {
      id: wallet!.id,
      name: form.getValues("name"),
      description: form.getValues("description"),
      balance: newBalance,
      color: form.getValues("color"),
      icon: form.getValues("icon"),
      createdAt: wallet!.createdAt,
    }

    // Fechar o diálogo e enviar a carteira atualizada
    setIsAdjustmentDialogOpen(false)
    onSubmit(newWallet)
  }

  // Função para renderizar o ícone selecionado
  const renderIcon = (iconName: string) => {
    const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[
      iconName
        .split("-")
        .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
        .join("")
    ]

    return Icon ? <Icon className="h-5 w-5" /> : null
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Carteira</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Conta Corrente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descrição opcional" className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Saldo {wallet ? "Atual" : "Inicial"}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="R$ 0,00"
                    onChange={(e) => {
                      e.target.value = handleInputMoneyMask(e.target.value)
                      field.onChange(e)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <div className="h-10 w-10 rounded-md border" style={{ backgroundColor: field.value }} />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ícone</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      setSelectedIcon(value)
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um ícone">
                          <div className="flex items-center gap-2">
                            {renderIcon(selectedIcon)}
                            <span>{WALLET_ICONS.find((i) => i.value === selectedIcon)?.label || "Ícone"}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {WALLET_ICONS.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center gap-2">
                            {renderIcon(icon.value)}
                            {icon.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit">{wallet ? "Atualizar" : "Adicionar"} Carteira</Button>
          </div>
        </form>
      </Form>

      {/* Diálogo para justificar o ajuste de saldo */}
      <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Justificar Alteração de Saldo</DialogTitle>
            <DialogDescription>
              Informe o motivo da alteração de saldo de {handleInputMoneyMask(oldBalance)} para{" "}
              {handleInputMoneyMask(newBalance)}
            </DialogDescription>
          </DialogHeader>

          <Form {...adjustmentForm}>
            <form onSubmit={adjustmentForm.handleSubmit(handleAdjustmentSubmit)} className="space-y-4">
              <FormField
                control={adjustmentForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da Alteração</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Correção de saldo, Ajuste manual, etc."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAdjustmentDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Confirmar Alteração</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}

