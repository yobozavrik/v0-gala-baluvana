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
import { AlertCircle, Settings, Package } from "lucide-react"
import { postJSON, API_ENDPOINTS, isEndpointConfigured } from "@/lib/api"
import type { WarehouseRecord } from "@/components/shift-section"

export function WarehouseSection() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentEmployee, setCurrentEmployee] = useState<string>("")
  const { toast } = useToast()
  const isConfigured = isEndpointConfigured(API_ENDPOINTS.warehouse)

  const [formData, setFormData] = useState({
    product: "",
    sku: "",
    size: "",
    color: "",
    quantity: "",
    packaging: "",
    location: "",
    receiver: "",
    notes: "",
  })

  useEffect(() => {
    const savedEmployee = localStorage.getItem("currentEmployee")
    if (savedEmployee) {
      setCurrentEmployee(savedEmployee)
    }
  }, [])

  const packagingTypes = ["Пакет", "Коробка", "Зв'язка"]
  const locations = ["Склад А1", "Склад А2", "Склад Б1", "Склад Б2", "Експедиція", "Відвантаження"]
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"]
  const colors = ["Білий", "Чорний", "Сірий", "Синій", "Червоний", "Зелений"]

  const getRequiredFieldsStatus = () => {
    const missingFields = []
    if (!formData.product) missingFields.push("Товар")
    if (!formData.quantity) missingFields.push("Кількість")
    if (!formData.packaging) missingFields.push("Упаковка")
    if (!formData.location) missingFields.push("Місце на складі")

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

    const warehouseData: WarehouseRecord = {
      id: Date.now().toString(),
      ...formData,
      quantity: Number.parseInt(formData.quantity),
      timestamp: new Date().toISOString(),
      user_id: "telegram_user_id",
    }

    try {
      const existingWarehouse = JSON.parse(
        localStorage.getItem("shift_warehouse") || "[]",
      ) as WarehouseRecord[]
      existingWarehouse.push(warehouseData)
      localStorage.setItem("shift_warehouse", JSON.stringify(existingWarehouse))

      if (!isConfigured) {
        toast({
          title: "Переказ на склад записано (демо)",
          description: `${formData.quantity} шт. → ${formData.location}`,
        })

        setFormData({
          product: "",
          sku: "",
          size: "",
          color: "",
          quantity: "",
          packaging: "",
          location: "",
          receiver: "",
          notes: "",
        })

        setIsLoading(false)
        return
      }

      const result = await postJSON<WarehouseRecord>(API_ENDPOINTS.warehouse, warehouseData)

      if (result.success) {
        toast({
          title: "Переказ на склад записано",
          description: `${formData.quantity} шт. → ${formData.location}`,
        })

        setFormData({
          product: "",
          sku: "",
          size: "",
          color: "",
          quantity: "",
          packaging: "",
          location: "",
          receiver: "",
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
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Переказ на склад
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div>
                <Label htmlFor="packaging">Упаковка *</Label>
                <Select
                  value={formData.packaging}
                  onValueChange={(value) => setFormData({ ...formData, packaging: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Тип упаковки" />
                  </SelectTrigger>
                  <SelectContent>
                    {packagingTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="location">Місце на складі *</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => setFormData({ ...formData, location: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть місце" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="receiver">Отримувач</Label>
              <Input
                id="receiver"
                value={formData.receiver}
                onChange={(e) => setFormData({ ...formData, receiver: e.target.value })}
                placeholder="Ім'я отримувача (необов'язково)"
              />
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
              {isLoading ? "Записую..." : "Записати переказ"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
