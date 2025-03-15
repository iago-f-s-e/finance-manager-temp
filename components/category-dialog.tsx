"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useFinancialStore } from "@/lib/store"
import type { Category } from "@/types/category"
import { ColorPicker } from "@/components/ui/color-picker"

const formSchema = z.object({
  label: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  value: z.string().min(2, {
    message: "O valor deve ter pelo menos 2 caracteres.",
  }),
  color: z.string().regex(/^#([0-9A-F]{6})$/i, {
    message: "Cor inválida. Use formato hexadecimal (ex: #FF5733).",
  }),
})

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category
  onSubmit: (category: Category) => void
}

export function CategoryDialog({ open, onOpenChange, category, onSubmit }: CategoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { categories } = useFinancialStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: category?.label || "",
      value: category?.value || "",
      color:
        category?.color ||
        "#" +
          Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, "0"),
    },
  })

  function handleSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    // Verificar se já existe uma categoria com o mesmo valor
    if (!category && categories.some((c) => c.value === values.value)) {
      form.setError("value", {
        type: "manual",
        message: "Já existe uma categoria com este identificador.",
      })
      setIsSubmitting(false)
      return
    }

    const newCategory: Category = {
      id: category?.id || crypto.randomUUID(),
      label: values.label,
      value: values.value,
      color: values.color,
    }

    onSubmit(newCategory)
    setIsSubmitting(false)
    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{category ? "Editar" : "Adicionar"} Categoria</DialogTitle>
          <DialogDescription>
            {category
              ? "Edite os detalhes da categoria selecionada."
              : "Adicione uma nova categoria para organizar suas transações."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Alimentação" {...field} />
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
                  <FormLabel>Identificador</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: food"
                      {...field}
                      disabled={!!category}
                      title={category ? "O identificador não pode ser alterado" : undefined}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                    <ColorPicker color={field.value} onChange={(color) => field.onChange(color)} />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {category ? "Atualizar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

