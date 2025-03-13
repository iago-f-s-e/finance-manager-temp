"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { WalletTransfer } from "@/types/wallet"
import { useFinancialStore } from "@/lib/store"
import { handleInputMoneyMask, handleRemoveMoneyMask } from "@/lib/mask"

const transferFormSchema = z
  .object({
    fromWalletId: z.string({
      required_error: "Selecione a carteira de origem",
    }),
    toWalletId: z.string({
      required_error: "Selecione a carteira de destino",
    }),
    amount: z.string().min(1, {
      message: "O valor da transferência é obrigatório",
    }),
    description: z.string().optional(),
    date: z.date({
      required_error: "Selecione a data da transferência",
    }),
  })
  .refine((data) => data.fromWalletId !== data.toWalletId, {
    message: "As carteiras de origem e destino devem ser diferentes",
    path: ["toWalletId"],
  })

type TransferFormValues = z.infer<typeof transferFormSchema>

interface WalletTransferFormProps {
  onSubmit: (transfer: WalletTransfer) => void
  onCancel?: () => void
}

export function WalletTransferForm({ onSubmit, onCancel }: WalletTransferFormProps) {
  const wallets = useFinancialStore((state) => state.wallets)

  const defaultValues: Partial<TransferFormValues> = {
    fromWalletId: "",
    toWalletId: "",
    amount: "R$ 0,00",
    description: "",
    date: new Date(),
  }

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues,
  })

  function handleSubmit(data: TransferFormValues) {
    const transfer: WalletTransfer = {
      id: crypto.randomUUID(),
      fromWalletId: data.fromWalletId,
      toWalletId: data.toWalletId,
      amount: handleRemoveMoneyMask(data.amount),
      description: data.description,
      date: data.date,
      createdAt: new Date(),
    }

    onSubmit(transfer)
    form.reset(defaultValues)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="fromWalletId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carteira de Origem</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a carteira de origem" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: wallet.color }} />
                          {wallet.name} -{" "}
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                            wallet.balance,
                          )}
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
            name="toWalletId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carteira de Destino</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a carteira de destino" />
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
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor da Transferência</FormLabel>
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

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data da Transferência</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit">Realizar Transferência</Button>
        </div>
      </form>
    </Form>
  )
}

