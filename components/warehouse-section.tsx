"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, Settings, Package } from "lucide-react"
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

const packagingTypes = ["Пакет", "Коробка", "Зв'язка"] as const
const locations = ["Склад А1", "Склад А2", "Склад Б1", "Склад Б2", "Експедиція", "Відвантаження"] as const
const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"] as const
const colorOptions = ["Білий", "Чорний", "Сірий", "Синій", "Червоний", "Зелений"] as const

const warehouseSchema = z.object({
  product: z.string().trim().min(1, "Вкажіть товар"),
  sku: z.string().trim().optional().default(""),
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
  quantity: z
    .string()
    .trim()
    .min(1, "Вкажіть кількість")
    .refine((value) => /^[0-9]+$/.test(value), { message: "Кількість повинна бути цілим числом" })
    .refine((value) => Number.parseInt(value, 10) > 0, { message: "Кількість повинна бути додатним числом" }),
  packaging: z
    .string()
    .trim()
    .min(1, "Оберіть упаковку")
    .refine((value) => packagingTypes.includes(value as (typeof packagingTypes)[number]), {
      message: "Оберіть упаковку",
    }),
  location: z
    .string()
    .trim()
    .min(1, "Оберіть місце на складі")
    .refine((value) => locations.includes(value as (typeof locations)[number]), {
      message: "Оберіть місце на складі",
    }),
  receiver: z.string().trim().optional().default(""),
  notes: z.string().trim().max(500, "Примітки мають містити до 500 символів").optional().default(""),
})

type WarehouseFormValues = z.infer<typeof warehouseSchema>

const defaultValues: WarehouseFormValues = {
  product: "",
  sku: "",
  size: "",
  color: "",
  quantity: "",
  packaging: "",
  location: "",
  receiver: "",
  notes: "",
}

export function WarehouseSection() {
  const [currentEmployee, setCurrentEmployee] = useState<string>("")
  const { toast } = useToast()
  const isConfigured = isEndpointConfigured(API_ENDPOINTS.warehouse)

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
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

  const handleValidSubmit = async (values: WarehouseFormValues) => {
    const quantityNum = Number.parseInt(values.quantity, 10)

    const warehouseData = {
      id: Date.now().toString(),
      product: values.product.trim(),
      sku: values.sku?.trim() ?? "",
      size: values.size?.trim() ?? "",
      color: values.color?.trim() ?? "",
      quantity: quantityNum,
      packaging: values.packaging,
      location: values.location,
      receiver: values.receiver?.trim() ?? "",
      notes: values.notes?.trim() ?? "",
      timestamp: new Date().toISOString(),
      user_id: "telegram_user_id",
    }

    try {
      const existingWarehouse = JSON.parse(localStorage.getItem("shift_warehouse") || "[]")
      existingWarehouse.push(warehouseData)
      localStorage.setItem("shift_warehouse", JSON.stringify(existingWarehouse))

      if (!isConfigured) {
        toast({
          title: "Переказ на склад записано (демо)",
          description: `${warehouseData.quantity} шт. → ${warehouseData.location}`,
        })

        reset(defaultValues)
        return
      }

      const result = await postJSON(API_ENDPOINTS.warehouse, warehouseData)

      if (result.success) {
        toast({
          title: "Переказ на склад записано",
          description: `${warehouseData.quantity} шт. → ${warehouseData.location}`,
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

  const handleInvalidSubmit = (formErrors: FieldErrors<WarehouseFormValues>) => {
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
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Переказ на склад
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product">Товар *</Label>
                <Input id="product" placeholder="Назва товару" {...register("product")} />
                <FormFieldError message={errors.product?.message} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" placeholder="Артикул" {...register("sku")} />
                <FormFieldError message={errors.sku?.message} className="mt-1" />
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
                <Label htmlFor="quantity">Кількість *</Label>
                <Input id="quantity" type="number" min="1" placeholder="0" {...register("quantity")} />
                <FormFieldError message={errors.quantity?.message} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="packaging">Упаковка *</Label>
                <Controller
                  control={control}
                  name="packaging"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
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
                  )}
                />
                <FormFieldError message={errors.packaging?.message} className="mt-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Місце на складі *</Label>
              <Controller
                control={control}
                name="location"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
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
                )}
              />
              <FormFieldError message={errors.location?.message} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="receiver">Отримувач</Label>
              <Input id="receiver" placeholder="Ім'я отримувача (необов'язково)" {...register("receiver")} />
              <FormFieldError message={errors.receiver?.message} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="notes">Примітки</Label>
              <Textarea id="notes" placeholder="Додаткова інформація..." rows={3} {...register("notes")} />
              <FormFieldError message={errors.notes?.message} className="mt-1" />
            </div>

            <Button type="submit" disabled={isSubmitting || !isValid} className="w-full">
              {isSubmitting ? "Записую..." : "Записати переказ"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
