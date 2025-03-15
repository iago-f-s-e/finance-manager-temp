"use client"

import type React from "react"

import { useState } from "react"
import { Trash2, Edit, Plus, Download, Upload, AlertCircle } from "lucide-react"
import { useFinancialStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { defaultLocale, localeNames, locales } from "@/lib/i18n/config"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const categoryFormSchema = z.object({
  label: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  color: z.string().regex(/^#([0-9A-F]{6})$/i, {
    message: "Cor inválida. Use formato hexadecimal (ex: #FF5733).",
  }),
})

type CategoryFormValues = z.infer<typeof categoryFormSchema>

export default function SettingsPage() {
  const { categories, incomes, expenses, addCategory, updateCategory, deleteCategory, clearAllData, importData } =
    useFinancialStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("categories")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  const { theme, setTheme } = useTheme()
  const [currentLocale, setCurrentLocale] = useState(defaultLocale)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      label: "",
      color:
        "#" +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0"),
    },
  })

  const editForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      label: selectedCategory?.label || "",
      color: selectedCategory?.color || "#000000",
    },
  })

  // Reset form when selected category changes
  if (selectedCategory && editForm.getValues().label !== selectedCategory.label) {
    editForm.reset({
      label: selectedCategory.label,
      color: selectedCategory.color || "#000000",
    })
  }

  const handleAddCategory = (data: CategoryFormValues) => {
    const newCategory: Category = {
      id: crypto.randomUUID(),
      type: activeTab === "income" ? "income" : "expense",
      value: data.label.toLowerCase().replace(/\s+/g, "_"),
      label: data.label,
      color: data.color,
    }

    addCategory(newCategory)
    form.reset({
      label: "",
      color:
        "#" +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0"),
    })
    setIsAddDialogOpen(false)

    toast({
      title: "Categoria adicionada",
      description: `A categoria ${data.label} foi adicionada com sucesso.`,
    })
  }

  const handleEditCategory = (data: CategoryFormValues) => {
    if (!selectedCategory) return

    const updatedCategory: Category = {
      ...selectedCategory,
      label: data.label,
      value: data.label.toLowerCase().replace(/\s+/g, "_"),
      color: data.color,
    }

    updateCategory(updatedCategory)
    setIsEditDialogOpen(false)
    setSelectedCategory(null)

    toast({
      title: "Categoria atualizada",
      description: `A categoria ${data.label} foi atualizada com sucesso.`,
    })
  }

  const handleDeleteCategory = () => {
    if (!selectedCategory) return

    deleteCategory(selectedCategory.id)
    setIsDeleteDialogOpen(false)
    setSelectedCategory(null)

    toast({
      title: "Categoria excluída",
      description: `A categoria ${selectedCategory.label} foi excluída com sucesso.`,
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
        if (!data.incomes || !data.expenses || !data.categories) {
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
        <p className="text-muted-foreground">Gerencie categorias e configurações do sistema</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="backup">Backup e Restauração</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
        </TabsList>

        {/* Categorias */}
        <div className={activeTab === "categories" ? "" : "hidden"}>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Categorias de Entrada</CardTitle>
                <CardDescription>Gerencie as categorias para suas entradas financeiras</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Button
                    onClick={() => {
                      setActiveTab("income")
                      setIsAddDialogOpen(true)
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Categoria
                  </Button>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCategory(category)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCategory(category)
                              setIsDeleteDialogOpen(true)
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
                  <Button
                    onClick={() => {
                      setActiveTab("expense")
                      setIsAddDialogOpen(true)
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Categoria
                  </Button>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCategory(category)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCategory(category)
                              setIsDeleteDialogOpen(true)
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
        </div>

        {/* Backup e Restauração */}
        <div className={activeTab === "backup" ? "" : "hidden"}>
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

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Exportar Dados</h3>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => handleExport("json")} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Exportar como JSON
                  </Button>
                  <Button onClick={() => handleExport("csv")} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
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
                <div className="rounded-md bg-muted p-4">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(
                      {
                        incomes: [
                          {
                            id: "example-income",
                            type: "income",
                            name: "Salário",
                            value: 5000,
                            date: "2024-03-14T00:00:00.000Z",
                            category: "salary",
                            walletId: "main",
                            isEffectuated: true,
                            createdAt: "2024-03-14T00:00:00.000Z",
                          },
                        ],
                        expenses: [
                          {
                            id: "example-expense",
                            type: "expense",
                            name: "Aluguel",
                            value: 1500,
                            date: "2024-03-14T00:00:00.000Z",
                            category: "housing",
                            walletId: "main",
                            isEffectuated: true,
                            createdAt: "2024-03-14T00:00:00.000Z",
                          },
                        ],
                        categories: [
                          {
                            id: "salary",
                            type: "income",
                            value: "salary",
                            label: "Salário",
                            color: "#10b981",
                          },
                        ],
                        wallets: [
                          {
                            id: "main",
                            name: "Conta Principal",
                            balance: 3500,
                            color: "#3b82f6",
                            icon: "wallet",
                            createdAt: "2024-03-14T00:00:00.000Z",
                          },
                        ],
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Importar Dados</h3>
                <Button onClick={() => setIsImportDialogOpen(true)} className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Importar Backup
                </Button>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Atenção</AlertTitle>
                  <AlertDescription>
                    Importar um backup substituirá todos os seus dados atuais. Certifique-se de exportar seus dados
                    atuais antes de importar.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sistema */}
        <div className={activeTab === "system" ? "" : "hidden"}>
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>Gerencie as configurações gerais do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Dados</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Gerencie os dados do sistema. Cuidado, algumas ações não podem ser desfeitas.
                </p>

                <Button variant="destructive" onClick={() => setIsResetDialogOpen(true)}>
                  Resetar Todos os Dados
                </Button>
              </div>

              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription>
                  Resetar os dados irá remover todas as transações e categorias personalizadas. Esta ação não pode ser
                  desfeita.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Appearance */}
        <div className={activeTab === "appearance" ? "" : "hidden"}>
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>Personalize a aparência do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Tema</h3>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Idioma</h3>
                <Select value={currentLocale} onValueChange={setCurrentLocale}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    {locales.map((locale) => (
                      <SelectItem key={locale} value={locale}>
                        {localeNames[locale]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </Tabs>

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Categoria</DialogTitle>
            <DialogDescription>
              Crie uma nova categoria para {activeTab === "income" ? "entradas" : "saídas"}.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddCategory)} className="space-y-4">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Investimentos" {...field} />
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
                      <div className="h-10 w-10 rounded-md border" style={{ backgroundColor: field.value }} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">Adicionar Categoria</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>Atualize os detalhes da categoria selecionada.</DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditCategory)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Investimentos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
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

              <DialogFooter>
                <Button type="submit">Atualizar Categoria</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Categoria</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 p-3 border rounded-md">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedCategory?.color }} />
            <span>{selectedCategory?.label}</span>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              Transações que usam esta categoria não serão excluídas, mas perderão a referência à categoria.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

