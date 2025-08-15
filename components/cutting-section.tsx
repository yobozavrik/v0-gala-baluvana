"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Settings, Scissors } from "lucide-react"
import { postJSON, API_ENDPOINTS, isEndpointConfigured } from "@/lib/api"

export function CuttingSection() {
  const [isLoading, setIsLoading] = useState(false)
  const [layerTotal, setLayerTotal] = useState(0)
  const { toast } = useToast()
  const isConfigured = isEndpointConfigured(API_ENDPOINTS.operations)

  const [formData, setFormData] = useState({
    orderNumber: "",
    layer: "",
    size: "",
    quantity: "",
    notes: "",
  })

  // Підрахунок загальної кількості по настилу
  useEffect(() => {
    if (formData.orderNumber && formData.layer) {
      const existingCutting = JSON.parse(localStorage.getItem("shift_cutting") || "[]")
      const layerItems = existingCutting.filter(
        (item: any) => item.orderNumber === formData.orderNumber && item.layer === formData.layer,
      )
      const total = layerItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
      setLayerTotal(total)
    } else {
      setLayerTotal(0)
    }
  }, [formData.orderNumber, formData.layer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Валідація всіх обов'язкових полів
    if (!formData.orderNumber || !formData.layer || !formData.size || !formData.quantity) {
      toast({
        title: "Помилка валідації",
        description: "Заповніть всі обов'язкові поля",
        variant: "destructive",
      })
      return
    }

    // Перевірка, що розмір є числом
    const sizeNum = Number.parseFloat(formData.size)
    if (isNaN(sizeNum) || sizeNum <= 0) {
      toast({
        title: "Помилка валідації",
        description: "Розмір повинен бути додатним числом",
        variant: "destructive",
      })
      return
    }

    // Перевірка, що кількість є числом
    const quantityNum = Number.parseInt(formData.quantity)
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: "Помилка валідації",
        description: "Кількість повинна бути додатним числом",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    const cuttingData = {
      id: Date.now().toString(),
      ...formData,
      size: sizeNum, // Зберігаємо розмір як число
      quantity: quantityNum,
      timestamp: new Date().toISOString(),
      user_id: "telegram_user_id",
      type: "cutting",
    }

    try {
      // Зберігаємо в localStorage для історії
      const existingCutting = JSON.parse(localStorage.getItem("shift_cutting") || "[]")
      existingCutting.push(cuttingData)
      localStorage.setItem("shift_cutting", JSON.stringify(existingCutting))

      if (!isConfigured) {
        // Demo mode
        toast({
          title: "Розкрій записано (демо)",
          description: `Замовлення ${formData.orderNumber}, Настіл ${formData.layer}: ${formData.size} см - ${formData.quantity} шт.`,
        })

        // Reset form
        setFormData({
          orderNumber: "",
          layer: "",
          size: "",
          quantity: "",
          notes: "",
        })

        setIsLoading(false)
        return
      }

      const result = await postJSON(API_ENDPOINTS.operations, cuttingData)

      if (result.success) {
        toast({
          title: "Розкрій записано",
          description: `Замовлення ${formData.orderNumber}, Настіл ${formData.layer}: ${formData.size} см - ${formData.quantity} шт.`,
        })

        // Reset form
        setFormData({
          orderNumber: "",
          layer: "",
          size: "",
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
            <Scissors className="h-5 w-5" />
            Розкрій
          </CardTitle>
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
                <Label htmlFor="size">Розмір (см) *</Label>
                <Input
                  id="size"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  placeholder="Розмір в см"
                />
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

            {layerTotal > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Загальна кількість по настилу {formData.layer}:{" "}
                  {layerTotal + (formData.quantity ? Number.parseInt(formData.quantity) : 0)} шт.
                </AlertDescription>
              </Alert>
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

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Записую..." : "Записати розкрій"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
