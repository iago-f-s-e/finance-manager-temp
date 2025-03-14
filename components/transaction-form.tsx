"use client"

import { useState, useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {CalendarIcon, Plus} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { Transaction, TransactionType, RecurrenceType } from "@/types/transaction"
import type { Category } from "@/types/category"
import { RECURRENCE_TYPES } from "@/lib/constants"
import { CategoryDialog } from "@/components/category-dialog"
import { useFinancialStore } from "@/lib/store"
import { handleInputMoneyMask, handleRemoveMoneyMask } from "@/lib/mask"

const transactionFormSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  value: z.string().min(1, {
    message: "O valor deve ser maior que zero.",
  }),
  date: z.date(),
  category: z.string(),
  walletId: z.string({
    required_error: "Selecione uma carteira",
  }),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceType: z.string().optional(),
  recurrenceCount: z.coerce.number().int().min(2).max(60).optional(),
  isEffectuated: z.boolean().default(false),
})

type TransactionFormValues = z.infer<typeof transactionFormSchema>

interface TransactionFormProps {
  type: TransactionType
  transaction?: Transaction
  onSubmit: (data: Transaction, updateAll?: boolean) => void
  onCancel?: () => void
}

export function TransactionForm({ type, transaction, onSubmit, onCancel }: TransactionFormProps) {
  const [isRecurring, setIsRecurring] = useState(transaction?.isRecurring || false)
  const [updateAllRecurrences, setUpdateAllRecurrences] = useState(false)
  const categoriesStore = useFinancialStore((state) => state.categories)
  const categories = useMemo(() => categoriesStore.filter((c) => c.type === type), [categoriesStore, type])
  const wallets = useFinancialStore((state) => state.wallets)
  const addCategory = useFinancialStore((state) => state.addCategory)

  const defaultValues: Partial<TransactionFormValues> = {
    name: transaction?.name || "",
    value: handleInputMoneyMask(transaction?.value ?? 0),
    date: transaction?.date ? new Date(transaction.date) : new Date(),
    category: transaction?.category || "",
    walletId: transaction?.walletId || (wallets.length > 0 ? wallets[0].id : ""),
    description: transaction?.description || "",
    isRecurring: transaction?.isRecurring || false,
    recurrenceType: transaction?.recurrenceType || "monthly",
    recurrenceCount: transaction?.recurrenceCount || 2,
    isEffectuated: transaction?.isEffectuated || false,
  }

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues,
  })

  // Update form when transaction changes
  useEffect(() => {
    if (transaction) {
      form.reset({
        name: transaction.name,
        value: handleInputMoneyMask(transaction.value),
        date: new Date(transaction.date),
        category: transaction.category,
        walletId: transaction.walletId,
        description: transaction.description || "",
        isRecurring: transaction.isRecurring || false,
        recurrenceType: transaction.recurrenceType || "monthly",
        recurrenceCount: transaction.recurrenceCount || 2,
        isEffectuated: transaction.isEffectuated || false,
      })
      setIsRecurring(transaction.isRecurring || false)
    }
  }, [transaction, form])

  // Modificar o useEffect que sincroniza o estado isRecurring
  // TODO: refatorar esse useeffect
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.isRecurring !== undefined) {
        setIsRecurring(!!value.isRecurring)
      }
    })

    return () => subscription.unsubscribe()
  }, [form])

  function handleSubmit(data: TransactionFormValues) {
    const newTransaction: Transaction = {
      id: transaction?.id || crypto.randomUUID(),
      type,
      name: data.name,
      value: handleRemoveMoneyMask(data.value),
      date: data.date,
      category: data.category,
      walletId: data.walletId,
      description: data.description || "",
      isRecurring: data.isRecurring,
      recurrenceType: data.isRecurring ? (data.recurrenceType as RecurrenceType) : undefined,
      recurrenceCount: data.isRecurring ? data.recurrenceCount : undefined,
      isPartOfRecurrence: transaction?.isPartOfRecurrence,
      recurrenceGroupId: transaction?.recurrenceGroupId,
      isEffectuated: data.isEffectuated,
      effectuatedAt: data.isEffectuated ? new Date() : undefined,
      createdAt: transaction?.createdAt || new Date(),
    }

    onSubmit(newTransaction, updateAllRecurrences)

    if (!transaction) {
      form.reset()
    }
  }

  function handleAddCategory(category: Category) {
    addCategory(category)
    form.setValue("category", category.value)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder={`Nome da ${type === "income" ? "entrada" : "saída"}`} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
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
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="date"
            render={({field}) => (
              <FormItem className="flex flex-col justify-between">
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP", {locale: ptBR}) : <span>Selecione uma data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50"/>
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                  </PopoverContent>
                </Popover>
                <FormMessage/>
              </FormItem>
            )}
          />



          <FormField
            control={form.control}
            name="category"
            render={({field}) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Categoria</FormLabel>
                  <CategoryDialog type={type} onAddCategory={handleAddCategory}>
                    <Plus className="cursor-pointer" />
                  </CategoryDialog>
                </div>


                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria"/>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{backgroundColor: category.color}}/>
                          {category.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage/>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="walletId"
          render={({field}) => (
            <FormItem>
              <FormLabel>Carteira</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma carteira" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="isEffectuated"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Efetivada</FormLabel>
                  <FormDescription>Esta {type === "income" ? "entrada" : "saída"} já foi efetivada?</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isRecurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Recorrente</FormLabel>
                  <FormDescription>
                    Esta {type === "income" ? "entrada" : "saída"} se repete periodicamente?
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {isRecurring && (
            <>
              <FormField
                control={form.control}
                name="recurrenceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Recorrência</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de recorrência" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RECURRENCE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recurrenceCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Recorrências</FormLabel>
                    <FormControl>
                      <Input type="number" min={2} max={60} {...field} />
                    </FormControl>
                    <FormDescription>Quantas vezes esta transação se repetirá (2-60)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {transaction?.isPartOfRecurrence && (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Atualizar todas as recorrências</FormLabel>
                <FormDescription>Atualizar todas as transações desta série de recorrência</FormDescription>
              </div>
              <Switch checked={updateAllRecurrences} onCheckedChange={setUpdateAllRecurrences} />
            </FormItem>
          )}
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit">
            {transaction ? "Atualizar" : "Adicionar"} {type === "income" ? "Entrada" : "Saída"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

