"use client"

import { useState } from "react"
import { Trash2, Edit, Plus } from "lucide-react"
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
import { ImportExport } from "@/components/import-export"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { Category } from "@/types/category"

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
  const { categories, addCategory, updateCategory, deleteCategory, clearAllData } = useFinancialStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("income")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)

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
      type: activeTab as "income" | "expense",
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

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <ImportExport />
        </div>
        <p className="text-muted-foreground">Gerencie categorias e configurações do sistema</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Categorias</CardTitle>
            <CardDescription>Adicione, edite ou remova categorias de transações</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="income">Categorias de Entrada</TabsTrigger>
                <TabsTrigger value="expense">Categorias de Saída</TabsTrigger>
              </TabsList>

              <div className="mb-4">
                <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Categoria
                </Button>
              </div>

              <div className="space-y-2">
                {categories
                  .filter((category) => category.type === activeTab)
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
            </Tabs>
          </CardContent>
        </Card>

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
    </div>
  )
}

