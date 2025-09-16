"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Settings, CheckCircle, XCircle, Package } from "lucide-react"
import { postJSON, API_ENDPOINTS, isEndpointConfigured } from "@/lib/api"
import { useShiftStatus } from "@/components/shift-status-context"

export function QCSection() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const isConfigured = isEndpointConfigured(API_ENDPOINTS.qc)
  const { currentEmployee } = useShiftStatus()

  const [formData, setFormData] = useState({
    operation: "", // додано поле операції
    product: "",
    sku: "",
    size: "",
    color: "",
    totalQty: "", // змінено на загальну кількість
    rejectedQty: "",
    defectReason: "",
    notes: "",
  })

  const operations = ["Прасування", "Пакування"]

  const defectReasons = [
    "Неправильний шов",
    "Пошкодження тканини",
    "Неправильний розмір",
    "Забруднення",
    "Неправильний колір",
    "Відсутні деталі",
    "Інше",
  ]

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"]
  const colors = ["Білий", "Чорний", "Сірий", "Синій", "Червоний", "Зелений"]

  const totalQty = Number.parseInt(formData.totalQty) || 0
  const rejectedQty = Number.parseInt(formData.rejectedQty) || 0
  const acceptedQty = totalQty - rejectedQty

  const getRequiredFieldsStatus = () => {
    const missingFields = []
    if (!formData.operation) missingFields.push("Операція")
    if (!formData.product) missingFields.push("Товар")
    if (!formData.totalQty || totalQty === 0) missingFields.push("Загальна кількість")
    if (rejectedQty > 0 && !formData.defectReason) missingFields.push("Причина браку")

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

    if (rejectedQty > totalQty) {
      const employeeName = currentEmployee || "швея"
      toast({
        title: `Шановна ${employeeName}`,
        description: "Неможливо зробити запис. Брак не може перевищувати загальну кількість",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    const qcData = {
      id: Date.now().toString(),
      ...formData,
      totalQty,
      acceptedQty,
      rejectedQty,
      timestamp: new Date().toISOString(),
      user_id: "telegram_user_id",
    }

    try {
      const existingQC = JSON.parse(localStorage.getItem("shift_qc") || "[]")
      existingQC.push({
        ...qcData,
        employee: currentEmployee,
      })
      localStorage.setItem("shift_qc", JSON.stringify(existingQC))

      if (!isConfigured) {
        toast({
          title: "Контроль якості записано (демо)",
          description: `${formData.operation}: Загалом ${totalQty}, Прийнято ${acceptedQty}, Брак ${rejectedQty}`,
        })

        setFormData({
          operation: "",
          product: "",
          sku: "",
          size: "",
          color: "",
          totalQty: "",
          rejectedQty: "",
          defectReason: "",
          notes: "",
        })

        setIsLoading(false)
        return
      }

      const result = await postJSON(API_ENDPOINTS.qc, qcData)

      if (result.success) {
        toast({
          title: "Контроль якості записано",
          description: `${formData.operation}: Загалом ${totalQty}, Прийнято ${acceptedQty}, Брак ${rejectedQty}`,
        })

        setFormData({
          operation: "",
          product: "",
          sku: "",
          size: "",
          color: "",
          totalQty: "",
          rejectedQty: "",
          defectReason: "",
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
          <CardTitle>Контроль якості</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {operation}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product">Товар *</Label>
                <Input
                  id="product"
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  placeholder="Назва товару"
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Артикул"
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
                <Label htmlFor="totalQty">Загальна кількість *</Label>
                <Input
                  id="totalQty"
                  type="number"
                  min="0"
                  value={formData.totalQty}
                  onChange={(e) => setFormData({ ...formData, totalQty: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="rejectedQty" className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Брак
                </Label>
                <Input
                  id="rejectedQty"
                  type="number"
                  min="0"
                  max={totalQty}
                  value={formData.rejectedQty}
                  onChange={(e) => setFormData({ ...formData, rejectedQty: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            {rejectedQty > 0 && (
              <div>
                <Label htmlFor="defectReason">Причина браку *</Label>
                <Select
                  value={formData.defectReason}
                  onValueChange={(value) => setFormData({ ...formData, defectReason: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть причину" />
                  </SelectTrigger>
                  <SelectContent>
                    {defectReasons.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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

            {totalQty > 0 && (
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Загалом:</span>
                  <span className="font-medium">{totalQty} шт.</span>
                </div>
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-sm flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Прийнято:
                  </span>
                  <span>{acceptedQty} шт.</span>
                </div>
                {rejectedQty > 0 && (
                  <div className="flex justify-between items-center text-red-600">
                    <span className="text-sm flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Брак:
                    </span>
                    <span>{rejectedQty} шт.</span>
                  </div>
                )}
              </div>
            )}

            <Button type="submit" disabled={isLoading || !isValid} className="w-full">
              {isLoading ? "Записую..." : "Записати контроль"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
