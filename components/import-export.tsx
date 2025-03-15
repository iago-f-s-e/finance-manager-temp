"use client"

import type React from "react"

import { useState } from "react"
import { Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useFinancialStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

export function ImportExport() {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const { toast } = useToast()

  const { incomes, expenses, wallets, transfers, categories, importData } = useFinancialStore()

  const handleExport = (format: "json" | "csv") => {
    const data = {
      incomes,
      expenses,
      categories,
      wallets,
      transfers
    }

    let content: string
    let mimeType: string
    let fileExtension: string

    if (format === "json") {
      content = JSON.stringify(data, null, 2)
      mimeType = "application/json"
      fileExtension = "json"
    } else {
      // CSV format
      const headers =
        "type,id,name,value,date,category,description,isRecurring,recurrenceType,recurrenceCount,isPartOfRecurrence,recurrenceGroupId,createdAt\n"

      const incomeRows = incomes
        .map((income) => {
          return `income,${income.id},${income.name},${income.value},${income.date},${income.category},${income.description || ""},${income.isRecurring || false},${income.recurrenceType || ""},${income.recurrenceCount || ""},${income.isPartOfRecurrence || false},${income.recurrenceGroupId || ""},${income.createdAt}`
        })
        .join("\n")

      const expenseRows = expenses
        .map((expense) => {
          return `expense,${expense.id},${expense.name},${expense.value},${expense.date},${expense.category},${expense.description || ""},${expense.isRecurring || false},${expense.recurrenceType || ""},${expense.recurrenceCount || ""},${expense.isPartOfRecurrence || false},${expense.recurrenceGroupId || ""},${expense.createdAt}`
        })
        .join("\n")

      content = headers + incomeRows + "\n" + expenseRows
      mimeType = "text/csv"
      fileExtension = "csv"
    }

    // Create and download the file
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `financial-data-export.${fileExtension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Exportação concluída",
      description: `Seus dados foram exportados com sucesso no formato ${format.toUpperCase()}.`,
    })
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        // Validate the imported data
        if (!data.incomes || !data.expenses || !data.categories || !data.wallets || !data.transfers) {
          throw new Error("Formato de arquivo inválido")
        }

        // Process dates to ensure they are Date objects
        const processedData = {
          incomes: data.incomes.map((income: any) => ({
            ...income,
            date: new Date(income.date),
            createdAt: new Date(income.createdAt),
          })),
          expenses: data.expenses.map((expense: any) => ({
            ...expense,
            date: new Date(expense.date),
            createdAt: new Date(expense.createdAt),
          })),
          categories: data.categories,
          wallets: data.wallets.map((wallet: any) => ({
            ...wallet,
            createdAt: new Date(wallet.createdAt),
          })),
          transfers: data.transfers.map((transfer: any) => ({
            ...transfer,
            date: new Date(transfer.date),
            createdAt: new Date(transfer.createdAt)
          }))
        }

        // Import the data
        importData(processedData)

        setIsImportDialogOpen(false)
        toast({
          title: "Importação concluída",
          description: "Seus dados foram importados com sucesso.",
        })
      } catch (error) {
        toast({
          title: "Erro na importação",
          description: "O arquivo selecionado não é um backup válido.",
          variant: "destructive",
        })
      }
    }

    reader.readAsText(file)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="gap-1" onClick={() => handleExport("json")}>
        <Download className="h-4 w-4" />
        Exportar JSON
      </Button>

      <Button variant="outline" size="sm" className="gap-1" onClick={() => handleExport("csv")}>
        <Download className="h-4 w-4" />
        Exportar CSV
      </Button>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Upload className="h-4 w-4" />
            Importar
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Dados</DialogTitle>
            <DialogDescription>
              Selecione um arquivo JSON de backup para importar. Isso substituirá todos os seus dados atuais.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="import-file" className="text-sm font-medium">
                Arquivo de Backup (JSON)
              </label>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImport}
                className="cursor-pointer rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

