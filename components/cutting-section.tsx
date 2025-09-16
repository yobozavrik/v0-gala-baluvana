"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, Settings, Scissors } from "lucide-react"
import { useForm, type FieldErrors } from "react-hook-form"
import { z } from "zod"

import { FormFieldError } from "@/components/form-field-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { API_ENDPOINTS, isEndpointConfigured, postJSON } from "@/lib/api"
import { getFirstErrorMessage } from "@/lib/forms"

const cuttingSchema = z.object({
  orderNumber: z.string().trim().min(1, "Номер замовлення обов'язковий"),
  layer: z.string().trim().min(1, "Настіл обов'язковий"),
  size: z
    .string()
    .trim()
    .min(1, "Вкажіть розмір")
    .refine((value) => !Number.isNaN(Number.parseFloat(value)), { message: "Розмір повинен бути числом" })
    .refine((value) => Number.parseFloat(value) > 0, { message: "Розмір повинен бути додатним числом" }),
  quantity: z
    .string()
    .trim()
    .min(1, "Вкажіть кількість")
    .refine((value) => /^[0-9]+$/.test(value), { message: "Кількість повинна бути цілим числом" })
    .refine((value) => Number.parseInt(value, 10) > 0, { message: "Кількість повинна бути додатним числом" }),
  notes: z.string().trim().max(500, "Примітки мають містити до 500 символів").optional().default(""),
})

type CuttingFormValues = z.infer<typeof cuttingSchema>

const defaultValues: CuttingFormValues = {
  orderNumber: "",
  layer: "",
  size: "",
  quantity: "",
  notes: "",
}

export function CuttingSection() {
  const [layerTotal, setLayerTotal] = useState(0)
  const [currentEmployee, setCurrentEmployee] = useState<string>("")
  const { toast } = useToast()
  const isConfigured = isEndpointConfigured(API_ENDPOINTS.operations)

  const form = useForm<CuttingFormValues>({
    resolver: zodResolver(cuttingSchema),
    defaultValues,
    mode: "onChange",
  })

  const {
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = form

  const orderNumber = watch("orderNumber")
  const layer = watch("layer")
  const quantity = watch("quantity")

  useEffect(() => {
    const savedEmployee = localStorage.getItem("currentEmployee")
    if (savedEmployee) {
      setCurrentEmployee(savedEmployee)
    }
  }, [])

  useEffect(() => {
    if (orderNumber && layer) {
      const existingCutting = JSON.parse(localStorage.getItem("shift_cutting") || "[]")
      const layerItems = existingCutting.filter(
        (item: any) => item.orderNumber === orderNumber && item.layer === layer,
      )
      const total = layerItems.reduce((sum: number, item: any) => sum + Number(item.quantity ?? 0), 0)
      setLayerTotal(total)
    } else {
      setLayerTotal(0)
    }
  }, [orderNumber, layer])

  const handleValidSubmit = async (values: CuttingFormValues) => {
    const sizeNum = Number.parseFloat(values.size)
    const quantityNum = Number.parseInt(values.quantity, 10)
    const notes = values.notes?.trim() ?? ""

    const cuttingData = {
      id: Date.now().toString(),
      orderNumber: values.orderNumber.trim(),
      layer: values.layer.trim(),
      size: sizeNum,
      quantity: quantityNum,
      notes,
      timestamp: new Date().toISOString(),
      user_id: "telegram_user_id",
      type: "cutting" as const,
    }

    try {
      const existingCutting = JSON.parse(localStorage.getItem("shift_cutting") || "[]")
      existingCutting.push(cuttingData)
      localStorage.setItem("shift_cutting", JSON.stringify(existingCutting))

      if (!isConfigured) {
        toast({
          title: "Розкрій записано (демо)",
          description: `Замовлення ${cuttingData.orderNumber}, Настіл ${cuttingData.layer}: ${cuttingData.size} см - ${cuttingData.quantity} шт.`,
        })

        reset(defaultValues)
        return
      }

      const result = await postJSON(API_ENDPOINTS.operations, cuttingData)

      if (result.success) {
        toast({
          title: "Розкрій записано",
          description: `Замовлення ${cuttingData.orderNumber}, Настіл ${cuttingData.layer}: ${cuttingData.size} см - ${cuttingData.quantity} шт.`,
        })
        reset(defaultValues)
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
    }
  }

  const handleInvalidSubmit = (formErrors: FieldErrors<CuttingFormValues>) => {
    const employeeName = currentEmployee || "швея"
    const message =
      getFirstErrorMessage(formErrors) ?? "Неможливо зробити запис. Перевірте правильність заповнення форми"

    toast({
      title: `Шановна ${employeeName}`,
      description: message,
      variant: "destructive",
    })
  }

  const onSubmit = handleSubmit(handleValidSubmit, handleInvalidSubmit)

  const currentQuantity = Number.parseInt(quantity || "0", 10) || 0

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
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orderNumber">Номер замовлення *</Label>
                <Input
                  id="orderNumber"
                  placeholder="Номер замовлення"
                  {...register("orderNumber")}
                />
                <FormFieldError message={errors.orderNumber?.message} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="layer">Настіл *</Label>
                <Input id="layer" placeholder="Номер настилу" {...register("layer")} />
                <FormFieldError message={errors.layer?.message} className="mt-1" />
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
                  placeholder="Розмір в см"
                  {...register("size")}
                />
                <FormFieldError message={errors.size?.message} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="quantity">Кількість *</Label>
                <Input id="quantity" type="number" min="1" placeholder="0" {...register("quantity")} />
                <FormFieldError message={errors.quantity?.message} className="mt-1" />
              </div>
            </div>

            {layerTotal > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Загальна кількість по настилу {layer}: {layerTotal + currentQuantity} шт.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="notes">Примітки</Label>
              <Textarea
                id="notes"
                placeholder="Додаткова інформація..."
                rows={3}
                {...register("notes")}
              />
              <FormFieldError message={errors.notes?.message} className="mt-1" />
            </div>

            <Button type="submit" disabled={isSubmitting || !isValid} className="w-full">
              {isSubmitting ? "Записую..." : "Записати розкрій"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
