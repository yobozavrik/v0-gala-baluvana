"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Settings } from "lucide-react"
import { postJSON, API_ENDPOINTS, isEndpointConfigured } from "@/lib/api"
import type { OperationRecord } from "@/components/shift-section"

export function OperationsSection() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentEmployee, setCurrentEmployee] = useState<string>("")
  const { toast } = useToast()
  const isConfigured = isEndpointConfigured(API_ENDPOINTS.operations)

  const [formData, setFormData] = useState({
    orderNumber: "",
    layer: "",
    size: "",
    color: "",
    operation: "",
    quantity: "",
    notes: "",
  })

  useEffect(() => {
    const savedEmployee = localStorage.getItem("currentEmployee")
    if (savedEmployee) {
      setCurrentEmployee(savedEmployee)
    }
  }, [])

  const operations = ["Оверлок", "Прямоточка", "Розпошив"]

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"]
  const colors = ["Білий", "Чорний", "Сірий", "Синій", "Червоний", "Зелений"]

  const getRequiredFieldsStatus = () => {
    const missingFields = []
    if (!formData.orderNumber) missingFields.push("Номер замовлення")
    if (!formData.layer) missingFields.push("Настіл")
    if (!formData.operation) missingFields.push("Операція")
    if (!formData.quantity) missingFields.push("Кількість")

    return {
      isValid: missingFields.length === 0,
      missingFields,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { isValid, missingFields } = getRequiredFieldsStatus()

    if (!isValid) {
      const employeeName = currentEmployee || "швея"
      toast({
        title: `Шановна ${employeeName}`,
        description: `Неможливо зробити запис. Заповніть поля: ${missingFields.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    const operationData: OperationRecord = {
      id: Date.now().toString(),
      ...formData,
      quantity: Number.parseInt(formData.quantity),
      timestamp: new Date().toISOString(),
      user_id: "telegram_user_id",
    }

    try {
      const existingOperations = JSON.parse(
        localStorage.getItem("shift_operations") || "[]",
      ) as OperationRecord[]
      existingOperations.push(operationData)
      localStorage.setItem("shift_operations", JSON.stringify(existingOperations))

      if (!isConfigured) {
        toast({
          title: "Операцію записано (демо)",
          description: `Замовлення ${formData.orderNumber}, Настіл ${formData.layer}: ${formData.quantity} шт.`,
        })

        setFormData({
          orderNumber: "",
          layer: "",
          size: "",
          color: "",
          operation: "",
          quantity: "",
          notes: "",
        })

        setIsLoading(false)
        return
      }

      const result = await postJSON<OperationRecord>(API_ENDPOINTS.operations, operationData)

      if (result.success) {
        toast({
          title: "Операцію записано",
          description: `Замовлення ${formData.orderNumber}, Настіл ${formData.layer}: ${formData.quantity} шт.`,
        })

        setFormData({
          orderNumber: "",
          layer: "",
          size: "",
          color: "",
          operation: "",
          quantity: "",
          notes: "",
        })
      } else {
        toast({
          title: "Запит додано до черги",
          description: "Буде відправлено при відновленні з'єднання",
        })
      }
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Спробуйте ще раз пізніше",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const { isValid } = getRequiredFieldsStatus()

  return (
    <div className="space-y-4">
      {!isConfigured && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Демо режим. Додайте змінні середовища у Project Settings.</span>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Запис операцій</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orderNumber">Номер замовлення *</Label>
                <Input
                  id="orderNumber"
                  value={formData.orderNumber}
                  onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                  placeholder="Номер замовлення"
                />
              </div>
              <div>
                <Label htmlFor="layer">Настіл *</Label>
                <Input
                  id="layer"
                  value={formData.layer}
                  onChange={(e) => setFormData({ ...formData, layer: e.target.value })}
                  placeholder="Номер настилу"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="size">Розмір</Label>
                <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть розмір" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="color">Колір</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть колір" />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="operation">Операція *</Label>
                <Select
                  value={formData.operation}
                  onValueChange={(value) => setFormData({ ...formData, operation: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть операцію" />
                  </SelectTrigger>
                  <SelectContent>
                    {operations.map((operation) => (
                      <SelectItem key={operation} value={operation}>
                        {operation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity">Кількість *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Примітки</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Додаткова інформація..."
                rows={3}
              />
            </div>

            <Button type="submit" disabled={isLoading || !isValid} className="w-full">
              {isLoading ? "Записую..." : "Записати операцію"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
