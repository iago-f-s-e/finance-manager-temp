"use client"

import { CardFooter } from "@/components/ui/card"

import type React from "react"

import { useState } from "react"
import { Trash2, Edit, Plus, Download, Upload, AlertCircle } from "lucide-react"
import { useFinancialStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import type { Category } from "@/types/category"
import { useTheme } from "next-themes"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Code } from "@/components/ui/code";
import {CategoryDialog} from "@/components/category-dialog";

const sampleData = `{
  "wallets": [
    {
      "id": "wallet-id-1",
      "name": "Conta Corrente",
      "balance": 1500,
      "color": "#3b82f6",
      "icon": "wallet"
    }
  ],
  "transfers": [
    {
      "id": "transfer-id-1",
      "fromWalletId": "wallet-id-1",
      "toWalletId": "wallet-id-2",
      "amount": 500.00,
      "description": "Transferência para poupança",
      "date": "2023-05-20T00:00:00.000Z",
      "createdAt": "2023-05-20T00:00:00.000Z"
    }
  ],
  "categories": [
    {
      "id": "category-id-1",
      "name": "Alimentacao",
      "type": "expense",
      "color": "#ef4444"
    },
    {
      "id": "category-id-2",
      "name": "Salario",
      "type": "income",
      "color": "#22c55e"
    }
  ],
  "expenses": [
    {
      "id": "expense-id-1",
      "type": "expense",
      "name": "Supermercado",
      "value": 150.75,
      "date": "2023-05-15T00:00:00.000Z",
      "category": "category-id-1",
      "walletId": "wallet-id-1",
      "description": "Compra mensal de supermercado",
      "isEffectuated": true,
      "effectuatedAt": "2023-05-15T00:00:00.000Z",
      "createdAt": "2023-05-10T00:00:00.000Z"
    }
  ],
  "incomes": [
    {
      "id": "income-id-1",
      "type": "income",
      "name": "Salario Maio",
      "value": 5000.00,
      "date": "2023-05-01T00:00:00.000Z",
      "category": "category-id-2",
      "walletId": "wallet-id-1",
      "description": "Pagamento mensal da empresa",
      "isRecurring": true,
      "recurrenceType": "monthly",
      "recurrenceCount": 12,
      "isEffectuated": true,
      "effectuatedAt": "2023-05-01T00:00:00.000Z",
      "createdAt": "2023-04-25T00:00:00.000Z"
    }
  ]
}`

export default function SettingsPage() {
  const { categories, wallets, transfers, incomes, expenses, addCategory, updateCategory, deleteCategory, clearAllData, importData } =
    useFinancialStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("general")
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  const { theme, setTheme } = useTheme()

  const handleAddCategory = (data: Category) => {
    const newCategory: Category = {
      id: crypto.randomUUID(),
      type: data.type,
      value: data.label.toLowerCase().replace(/\s+/g, "_"),
      label: data.label,
      color: data.color,
    }

    addCategory(newCategory)
    toast({
      title: "Categoria adicionada",
      description: `A categoria ${data.label} foi adicionada com sucesso.`,
    })
  }

  const handleEditCategory = (data: Category) => {
    updateCategory(data)

    toast({
      title: "Categoria atualizada",
      description: `A categoria ${data.label} foi atualizada com sucesso.`,
    })
  }

  const handleDeleteCategory = (category: Category) => {
    deleteCategory(category.id)

    toast({
      title: "Categoria excluída",
      description: `A categoria ${category.label} foi excluída com sucesso.`,
    })
  }

  const handleResetData = () => {
    clearAllData()
    setIsResetDialogOpen(false)

    toast({
      title: "Dados resetados",
      description: "Todos os dados foram resetados com sucesso.",
    })
  }

  const handleExport = (format: "json" | "csv") => {
    const data = {
      incomes,
      expenses,
      categories,
      wallets,
      transfers,
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
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Personalize o sistema de acordo com suas preferências</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="backup">Backup e Restauração</TabsTrigger>
          <TabsTrigger value="about">Sobre</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Tema</CardTitle>
              <CardDescription>Escolha o tema de sua preferência</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={theme} onValueChange={setTheme} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="theme-light" />
                  <Label htmlFor="theme-light">Claro</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="theme-dark" />
                  <Label htmlFor="theme-dark">Escuro</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="theme-system" />
                  <Label htmlFor="theme-system">Sistema</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Categorias de Entrada</CardTitle>
                <CardDescription>Gerencie as categorias para suas entradas financeiras</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <CategoryDialog type="income" onSubmit={handleAddCategory}>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Categoria
                    </Button>
                  </CategoryDialog>

                </div>

                <div className="space-y-2">
                  {categories
                    .filter((category) => category.type === "income")
                    .map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                          <span>{category.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CategoryDialog type={category.type} category={category} onSubmit={handleEditCategory}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </CategoryDialog>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              handleDeleteCategory(category)
                            }}
                            disabled={category.isDefault}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Categorias de Saída</CardTitle>
                <CardDescription>Gerencie as categorias para suas saídas financeiras</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <CategoryDialog type="expense" onSubmit={handleAddCategory}>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Categoria
                    </Button>
                  </CategoryDialog>
                </div>

                <div className="space-y-2">
                  {categories
                    .filter((category) => category.type === "expense")
                    .map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                          <span>{category.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CategoryDialog type={category.type} category={category} onSubmit={handleEditCategory}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </CategoryDialog>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              handleDeleteCategory(category)
                            }}
                            disabled={category.isDefault}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Backup e Restauração de Dados</CardTitle>
              <CardDescription>Exporte seus dados para backup ou importe dados de um backup anterior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Sobre Backups</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Como este sistema utiliza o armazenamento local do navegador (localStorage), é importante fazer
                  backups regulares dos seus dados. Isso permite que você:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mb-4">
                  <li>Proteja seus dados contra perda acidental (limpeza de cache, reinstalação do navegador)</li>
                  <li>Transfira seus dados para outro dispositivo ou navegador</li>
                  <li>Mantenha um histórico de seus registros financeiros</li>
                </ul>
              </div>

              <Separator/>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Exportar Dados</h3>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => handleExport("json")} className="flex items-center gap-2">
                    <Download className="h-4 w-4"/>
                    Exportar como JSON
                  </Button>
                  <Button onClick={() => handleExport("csv")} className="flex items-center gap-2">
                    <Download className="h-4 w-4"/>
                    Exportar como CSV
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  O formato JSON preserva todos os dados e é recomendado para backups completos. O formato CSV é útil
                  para análise em planilhas, mas pode não preservar todos os detalhes.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Formato do Backup</h3>
                <div className="bg-muted p-4 rounded-md overflow-auto max-h-80">
                  <Code language="json">{sampleData}</Code>
                </div>
              </div>

              <Separator/>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Importar Dados</h3>
                <Button onClick={() => setIsImportDialogOpen(true)} className="flex items-center gap-2">
                  <Upload className="h-4 w-4"/>
                  Importar Backup
                </Button>
                <Alert>
                  <AlertCircle className="h-4 w-4"/>
                  <AlertTitle>Atenção</AlertTitle>
                  <AlertDescription>
                    Importar um backup substituirá todos os seus dados atuais. Certifique-se de exportar seus dados
                    atuais antes de importar.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>Sobre o Sistema</CardTitle>
              <CardDescription>Informações sobre o sistema de gestão financeira</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Sistema de Gestão Financeira</h3>
                <p className="text-sm text-muted-foreground">Versão 1.0.0</p>
              </div>
              <div>
                <h3 className="font-medium">Desenvolvido por</h3>
                <div className="flex items-center gap-2 mt-2">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-d5wbjAldm0nmo4hVPZCuxFeMcuNFEQ.png"
                    alt="SabbathDev Logo"
                    className="h-8 w-8"
                  />
                  <span>SabbathDev</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} SabbathDev. Todos os direitos reservados.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Data Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar Todos os Dados</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja resetar todos os dados? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              Todas as transações e categorias personalizadas serão removidas permanentemente.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleResetData}>
              Resetar Dados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
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

