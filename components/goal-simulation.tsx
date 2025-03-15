"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Calculator } from "lucide-react"
import { format, addMonths, addYears, differenceInDays, differenceInMonths } from "date-fns"
import { handleInputMoneyMask, handleRemoveMoneyMask } from "@/lib/mask"
import { formatCurrency } from "@/lib/financial-utils"
import type { Wallet } from "@/types/wallet"

type FrequencyType = "daily" | "biweekly" | "monthly" | "quarterly" | "semiannually" | "yearly"

interface GoalSimulationProps {
  wallet: Wallet
}

export function GoalSimulation({ wallet }: GoalSimulationProps) {
  const [activeTab, setActiveTab] = useState<string>("time")
  const [frequency, setFrequency] = useState<FrequencyType>("monthly")
  const [amount, setAmount] = useState<string>("R$ 100,00")
  const [targetDate, setTargetDate] = useState<Date | undefined>(addYears(new Date(), 1))
  const [showCalendar, setShowCalendar] = useState<boolean>(false)
  const [simulationResult, setSimulationResult] = useState<string | null>(null)

  // Verificar se a carteira tem meta
  if (!wallet.goal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Simulação de Meta</CardTitle>
          <CardDescription>Esta carteira não possui uma meta definida</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Defina uma meta para esta carteira para poder realizar simulações.
          </p>
        </CardContent>
      </Card>
    )
  }

  const remainingAmount = wallet.goal.value - wallet.balance

  // Se a meta já foi atingida
  if (remainingAmount <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meta Atingida!</CardTitle>
          <CardDescription>Parabéns! Você atingiu a meta para esta carteira.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            Meta: {formatCurrency(wallet.goal.value)}
            <br />
            Saldo atual: {formatCurrency(wallet.balance)}
            <br />
            Excedente: {formatCurrency(Math.abs(remainingAmount))}
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleSimulateTime = () => {
    const amountValue = handleRemoveMoneyMask(amount)
    if (amountValue <= 0) {
      setSimulationResult("O valor da contribuição deve ser maior que zero.")
      return
    }

    let timeNeeded: number
    let timeUnit: string

    switch (frequency) {
      case "daily":
        timeNeeded = Math.ceil(remainingAmount / amountValue)
        timeUnit = timeNeeded === 1 ? "dia" : "dias"
        break
      case "biweekly":
        timeNeeded = Math.ceil(remainingAmount / amountValue)
        timeUnit = timeNeeded === 1 ? "quinzena" : "quinzenas"
        break
      case "monthly":
        timeNeeded = Math.ceil(remainingAmount / amountValue)
        timeUnit = timeNeeded === 1 ? "mês" : "meses"
        break
      case "quarterly":
        timeNeeded = Math.ceil(remainingAmount / amountValue)
        timeUnit = timeNeeded === 1 ? "trimestre" : "trimestres"
        break
      case "semiannually":
        timeNeeded = Math.ceil(remainingAmount / amountValue)
        timeUnit = timeNeeded === 1 ? "semestre" : "semestres"
        break
      case "yearly":
        timeNeeded = Math.ceil(remainingAmount / amountValue)
        timeUnit = timeNeeded === 1 ? "ano" : "anos"
        break
      default:
        timeNeeded = Math.ceil(remainingAmount / amountValue)
        timeUnit = "meses"
    }

    setSimulationResult(
      `Contribuindo ${amount} a cada ${getFrequencyLabel(frequency).toLowerCase()}, você atingirá sua meta em aproximadamente ${timeNeeded} ${timeUnit}.`,
    )
  }

  const handleSimulateAmount = () => {
    if (!targetDate) {
      setSimulationResult("Selecione uma data alvo válida.")
      return
    }

    const today = new Date()
    if (targetDate <= today) {
      setSimulationResult("A data alvo deve ser no futuro.")
      return
    }

    let periods: number
    let periodLabel: string

    switch (frequency) {
      case "daily":
        periods = differenceInDays(targetDate, today)
        periodLabel = periods === 1 ? "dia" : "dias"
        break
      case "biweekly":
        periods = Math.floor(differenceInDays(targetDate, today) / 15)
        periodLabel = periods === 1 ? "quinzena" : "quinzenas"
        break
      case "monthly":
        periods = differenceInMonths(targetDate, today)
        periodLabel = periods === 1 ? "mês" : "meses"
        break
      case "quarterly":
        periods = Math.floor(differenceInMonths(targetDate, today) / 3)
        periodLabel = periods === 1 ? "trimestre" : "trimestres"
        break
      case "semiannually":
        periods = Math.floor(differenceInMonths(targetDate, today) / 6)
        periodLabel = periods === 1 ? "semestre" : "semestres"
        break
      case "yearly":
        periods = Math.floor(differenceInMonths(targetDate, today) / 12)
        periodLabel = periods === 1 ? "ano" : "anos"
        break
      default:
        periods = differenceInMonths(targetDate, today)
        periodLabel = "meses"
    }

    if (periods <= 0) {
      setSimulationResult("O período é muito curto para a frequência selecionada.")
      return
    }

    const amountNeeded = remainingAmount / periods
    setSimulationResult(
      `Para atingir sua meta até ${format(targetDate, "dd/MM/yyyy")}, você precisará contribuir ${formatCurrency(
        amountNeeded,
      )} a cada ${getFrequencyLabel(frequency).toLowerCase()} (${periods} ${periodLabel}).`,
    )
  }

  const handleQuickDateSelect = (months: number) => {
    const newDate = addMonths(new Date(), months)
    setTargetDate(newDate)
    setShowCalendar(false)
  }

  const getFrequencyLabel = (freq: FrequencyType): string => {
    switch (freq) {
      case "daily":
        return "Dia"
      case "biweekly":
        return "Quinzena"
      case "monthly":
        return "Mês"
      case "quarterly":
        return "Trimestre"
      case "semiannually":
        return "Semestre"
      case "yearly":
        return "Ano"
      default:
        return "Mês"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulação de Meta</CardTitle>
        <CardDescription>
          Meta: {formatCurrency(wallet.goal.value)} | Falta: {formatCurrency(remainingAmount)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="time">Quanto tempo falta?</TabsTrigger>
            <TabsTrigger value="amount">Quanto preciso guardar?</TabsTrigger>
          </TabsList>

          <TabsContent value="time" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Quanto você pode guardar regularmente?</Label>
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(handleInputMoneyMask(e.target.value))}
                  placeholder="R$ 0,00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="frequency">Com qual frequência?</Label>
                <Select value={frequency} onValueChange={(value) => setFrequency(value as FrequencyType)}>
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diariamente</SelectItem>
                    <SelectItem value="biweekly">Quinzenalmente</SelectItem>
                    <SelectItem value="monthly">Mensalmente</SelectItem>
                    <SelectItem value="quarterly">Trimestralmente</SelectItem>
                    <SelectItem value="semiannually">Semestralmente</SelectItem>
                    <SelectItem value="yearly">Anualmente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSimulateTime} className="w-full">
              <Calculator className="mr-2 h-4 w-4" />
              Calcular Tempo
            </Button>
          </TabsContent>

          <TabsContent value="amount" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="target-date">Quando você quer atingir a meta?</Label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {targetDate ? format(targetDate, "dd/MM/yyyy") : <span>Escolha uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="flex w-auto  p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={targetDate}
                      onSelect={(date) => {
                        setTargetDate(date)
                        setShowCalendar(false)
                      }}
                      initialFocus
                      disabled={(date) => date <= new Date()}
                    />
                    <div className="p-3 border-b">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleQuickDateSelect(1)}
                        >
                          Em 1 mês
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleQuickDateSelect(2)}
                        >
                          Em 2 meses
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleQuickDateSelect(3)}
                        >
                          Em 3 meses
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleQuickDateSelect(6)}
                        >
                          Em 6 meses
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start col-span-2"
                          onClick={() => handleQuickDateSelect(12)}
                        >
                          Em 1 ano
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="frequency-amount">Com qual frequência?</Label>
                <Select value={frequency} onValueChange={(value) => setFrequency(value as FrequencyType)}>
                  <SelectTrigger id="frequency-amount">
                    <SelectValue placeholder="Selecione a frequência"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diariamente</SelectItem>
                    <SelectItem value="biweekly">Quinzenalmente</SelectItem>
                    <SelectItem value="monthly">Mensalmente</SelectItem>
                    <SelectItem value="quarterly">Trimestralmente</SelectItem>
                    <SelectItem value="semiannually">Semestralmente</SelectItem>
                    <SelectItem value="yearly">Anualmente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSimulateAmount} className="w-full">
              <Calculator className="mr-2 h-4 w-4"/>
              Calcular Valor Necessário
            </Button>
          </TabsContent>
        </Tabs>

        {simulationResult && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <p className="text-sm font-medium">{simulationResult}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

