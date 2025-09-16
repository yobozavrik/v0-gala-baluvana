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
import { SHIFT_STORAGE_KEYS } from "@/lib/utils"

export function CuttingSection() {
  const [isLoading, setIsLoading] = useState(false)
  const [layerTotal, setLayerTotal] = useState(0)
  const [currentEmployee, setCurrentEmployee] = useState<string>("")
  const { toast } = useToast()
  const isConfigured = isEndpointConfigured(API_ENDPOINTS.operations)

  const [formData, setFormData] = useState({
    orderNumber: "",
    layer: "",
    size: "",
    quantity: "",
    notes: "",
  })

  useEffect(() => {
    const savedEmployee = localStorage.getItem("currentEmployee")
    if (savedEmployee) {
      setCurrentEmployee(savedEmployee)
    }
  }, [])

  useEffect(() => {
    if (formData.orderNumber && formData.layer) {
      const existingCutting = JSON.parse(localStorage.getItem(SHIFT_STORAGE_KEYS.cutting) || "[]")
      const layerItems = existingCutting.filter(
        (item: any) => item.orderNumber === formData.orderNumber && item.layer === formData.layer,
      )
      const total = layerItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
      setLayerTotal(total)
    } else {
      setLayerTotal(0)
    }
  }, [formData.orderNumber, formData.layer])

  const getRequiredFieldsStatus = () => {
    const missingFields = []
    if (!formData.orderNumber) missingFields.push("Номер замовлення")
    if (!formData.layer) missingFields.push("Настіл")
    if (!formData.size) missingFields.push("Розмір")
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

    const sizeNum = Number.parseFloat(formData.size)
    if (isNaN(sizeNum) || sizeNum <= 0) {
      const employeeName = currentEmployee || "швея"
      toast({
        title: `Шановна ${employeeName}`,
        description: "Неможливо зробити запис. Розмір повинен бути додатним числом",
        variant: "destructive",
      })
      return
    }

    const quantityNum = Number.parseInt(formData.quantity)
    if (isNaN(quantityNum) || quantityNum <= 0) {
      const employeeName = currentEmployee || "швея"
      toast({
        title: `Шановна ${employeeName}`,
        description: "Неможливо зробити запис. Кількість повинна бути додатним числом",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    const cuttingData = {
      id: Date.now().toString(),
      ...formData,
      size: sizeNum,
      quantity: quantityNum,
      timestamp: new Date().toISOString(),
      user_id: "telegram_user_id",
      type: "cutting",
    }

    try {
      const existingCutting = JSON.parse(localStorage.getItem(SHIFT_STORAGE_KEYS.cutting) || "[]")
      existingCutting.push(cuttingData)
      localStorage.setItem(SHIFT_STORAGE_KEYS.cutting, JSON.stringify(existingCutting))

      if (!isConfigured) {
        toast({
          title: "Розкрій записано (демо)",
          description: `Замовлення ${formData.orderNumber}, Настіл ${formData.layer}: ${formData.size} см - ${formData.quantity} шт.`,
        })

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

            <Button type="submit" disabled={isLoading || !isValid} className="w-full">
              {isLoading ? "Записую..." : "Записати розкрій"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
