"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, Settings } from "lucide-react"
import { Controller, useForm, type FieldErrors } from "react-hook-form"
import { z } from "zod"

import { FormFieldError } from "@/components/form-field-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { API_ENDPOINTS, isEndpointConfigured, postJSON } from "@/lib/api"
import { getFirstErrorMessage } from "@/lib/forms"

const operationOptions = ["Оверлок", "Прямоточка", "Розпошив"] as const
const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"] as const
const colorOptions = ["Білий", "Чорний", "Сірий", "Синій", "Червоний", "Зелений"] as const

const operationsSchema = z.object({
  orderNumber: z.string().trim().min(1, "Номер замовлення обов'язковий"),
  layer: z.string().trim().min(1, "Настіл обов'язковий"),
  size: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || sizeOptions.includes(value as (typeof sizeOptions)[number]), {
      message: "Оберіть коректний розмір",
    })
    .default(""),
  color: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || colorOptions.includes(value as (typeof colorOptions)[number]), {
      message: "Оберіть коректний колір",
    })
    .default(""),
  operation: z
    .string()
    .trim()
    .min(1, "Оберіть операцію")
    .refine((value) => operationOptions.includes(value as (typeof operationOptions)[number]), {
      message: "Оберіть операцію",
    }),
  quantity: z
    .string()
    .trim()
    .min(1, "Вкажіть кількість")
    .refine((value) => /^[0-9]+$/.test(value), { message: "Кількість повинна бути цілим числом" })
    .refine((value) => Number.parseInt(value, 10) > 0, { message: "Кількість повинна бути додатним числом" }),
  notes: z.string().trim().max(500, "Примітки мають містити до 500 символів").optional().default(""),
})

type OperationsFormValues = z.infer<typeof operationsSchema>

const defaultValues: OperationsFormValues = {
  orderNumber: "",
  layer: "",
  size: "",
  color: "",
  operation: "",
  quantity: "",
  notes: "",
}

export function OperationsSection() {
  const [currentEmployee, setCurrentEmployee] = useState<string>("")
  const { toast } = useToast()
  const isConfigured = isEndpointConfigured(API_ENDPOINTS.operations)

  const form = useForm<OperationsFormValues>({
    resolver: zodResolver(operationsSchema),
    defaultValues,
    mode: "onChange",
  })

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = form

  useEffect(() => {
    const savedEmployee = localStorage.getItem("currentEmployee")
    if (savedEmployee) {
      setCurrentEmployee(savedEmployee)
    }
  }, [])

  const handleValidSubmit = async (values: OperationsFormValues) => {
    const quantityNum = Number.parseInt(values.quantity, 10)
    const operationData = {
      id: Date.now().toString(),
      orderNumber: values.orderNumber.trim(),
      layer: values.layer.trim(),
      size: values.size?.trim() ?? "",
      color: values.color?.trim() ?? "",
      operation: values.operation,
      quantity: quantityNum,
      notes: values.notes?.trim() ?? "",
      timestamp: new Date().toISOString(),
      user_id: "telegram_user_id",
    }

    try {
      const existingOperations = JSON.parse(localStorage.getItem("shift_operations") || "[]")
      existingOperations.push(operationData)
      localStorage.setItem("shift_operations", JSON.stringify(existingOperations))

      if (!isConfigured) {
        toast({
          title: "Операцію записано (демо)",
          description: `Замовлення ${operationData.orderNumber}, Настіл ${operationData.layer}: ${operationData.quantity} шт.`,
        })

        reset(defaultValues)
        return
      }

      const result = await postJSON(API_ENDPOINTS.operations, operationData)

      if (result.success) {
        toast({
          title: "Операцію записано",
          description: `Замовлення ${operationData.orderNumber}, Настіл ${operationData.layer}: ${operationData.quantity} шт.`,
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

  const handleInvalidSubmit = (formErrors: FieldErrors<OperationsFormValues>) => {
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
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orderNumber">Номер замовлення *</Label>
                <Input id="orderNumber" placeholder="Номер замовлення" {...register("orderNumber")} />
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
                <Label htmlFor="size">Розмір</Label>
                <Controller
                  control={control}
                  name="size"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть розмір" />
                      </SelectTrigger>
                      <SelectContent>
                        {sizeOptions.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormFieldError message={errors.size?.message} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="color">Колір</Label>
                <Controller
                  control={control}
                  name="color"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть колір" />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((color) => (
                          <SelectItem key={color} value={color}>
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormFieldError message={errors.color?.message} className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="operation">Операція *</Label>
                <Controller
                  control={control}
                  name="operation"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть операцію" />
                      </SelectTrigger>
                      <SelectContent>
                        {operationOptions.map((operation) => (
                          <SelectItem key={operation} value={operation}>
                            {operation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormFieldError message={errors.operation?.message} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="quantity">Кількість *</Label>
                <Input id="quantity" type="number" min="1" placeholder="0" {...register("quantity")} />
                <FormFieldError message={errors.quantity?.message} className="mt-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Примітки</Label>
              <Textarea id="notes" placeholder="Додаткова інформація..." rows={3} {...register("notes")} />
              <FormFieldError message={errors.notes?.message} className="mt-1" />
            </div>

            <Button type="submit" disabled={isSubmitting || !isValid} className="w-full">
              {isSubmitting ? "Записую..." : "Записати операцію"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
