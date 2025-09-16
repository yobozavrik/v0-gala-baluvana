"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, Settings, CheckCircle, XCircle, Package } from "lucide-react"
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

const qcOperations = ["Прасування", "Пакування"] as const
const defectReasons = [
  "Неправильний шов",
  "Пошкодження тканини",
  "Неправильний розмір",
  "Забруднення",
  "Неправильний колір",
  "Відсутні деталі",
  "Інше",
] as const
const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"] as const
const colorOptions = ["Білий", "Чорний", "Сірий", "Синій", "Червоний", "Зелений"] as const

const qcSchema = z
  .object({
    operation: z
      .string()
      .trim()
      .min(1, "Оберіть операцію")
      .refine((value) => qcOperations.includes(value as (typeof qcOperations)[number]), {
        message: "Оберіть операцію",
      }),
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
    totalQty: z
      .string()
      .trim()
      .min(1, "Вкажіть загальну кількість")
      .refine((value) => /^[0-9]+$/.test(value), { message: "Загальна кількість повинна бути числом" })
      .refine((value) => Number.parseInt(value, 10) > 0, {
        message: "Загальна кількість повинна бути більшою за нуль",
      }),
    rejectedQty: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^[0-9]+$/.test(value), { message: "Брак повинен бути числом" })
      .default(""),
    defectReason: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || defectReasons.includes(value as (typeof defectReasons)[number]), {
        message: "Оберіть причину браку",
      })
      .default(""),
    notes: z.string().trim().max(500, "Примітки мають містити до 500 символів").optional().default(""),
  })
  .superRefine((data, ctx) => {
    const total = Number.parseInt(data.totalQty, 10)
    const rejected = Number.parseInt(data.rejectedQty || "0", 10)

    if (rejected > total) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Брак не може перевищувати загальну кількість",
        path: ["rejectedQty"],
      })
    }

    if (rejected > 0 && !data.defectReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Оберіть причину браку",
        path: ["defectReason"],
      })
    }
  })

type QCFormValues = z.infer<typeof qcSchema>

const defaultValues: QCFormValues = {
  operation: "",
  product: "",
  sku: "",
  size: "",
  color: "",
  totalQty: "",
  rejectedQty: "",
  defectReason: "",
  notes: "",
}

export function QCSection() {
  const [currentEmployee, setCurrentEmployee] = useState<string>("")
  const { toast } = useToast()
  const isConfigured = isEndpointConfigured(API_ENDPOINTS.qc)

  const form = useForm<QCFormValues>({
    resolver: zodResolver(qcSchema),
    defaultValues,
    mode: "onChange",
  })

  const {
    control,
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = form

  const totalQtyValue = Number.parseInt(watch("totalQty") || "0", 10) || 0
  const rejectedQtyValue = Number.parseInt(watch("rejectedQty") || "0", 10) || 0
  const acceptedQty = Math.max(totalQtyValue - rejectedQtyValue, 0)

  useEffect(() => {
    const savedEmployee = localStorage.getItem("currentEmployee")
    if (savedEmployee) {
      setCurrentEmployee(savedEmployee)
    }
  }, [])

  const handleValidSubmit = async (values: QCFormValues) => {
    const totalQtyNum = Number.parseInt(values.totalQty, 10)
    const rejectedQtyNum = Number.parseInt(values.rejectedQty || "0", 10)
    const acceptedQtyNum = totalQtyNum - rejectedQtyNum

    const qcData = {
      id: Date.now().toString(),
      operation: values.operation,
      product: values.product.trim(),
      sku: values.sku?.trim() ?? "",
      size: values.size?.trim() ?? "",
      color: values.color?.trim() ?? "",
      totalQty: totalQtyNum,
      acceptedQty: acceptedQtyNum,
      rejectedQty: rejectedQtyNum,
      defectReason: values.defectReason?.trim() ?? "",
      notes: values.notes?.trim() ?? "",
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
          description: `${qcData.operation}: Загалом ${qcData.totalQty}, Прийнято ${qcData.acceptedQty}, Брак ${qcData.rejectedQty}`,
        })

        reset(defaultValues)
        return
      }

      const result = await postJSON(API_ENDPOINTS.qc, qcData)

      if (result.success) {
        toast({
          title: "Контроль якості записано",
          description: `${qcData.operation}: Загалом ${qcData.totalQty}, Прийнято ${qcData.acceptedQty}, Брак ${qcData.rejectedQty}`,
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

  const handleInvalidSubmit = (formErrors: FieldErrors<QCFormValues>) => {
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
          <CardTitle>Контроль якості</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
                      {qcOperations.map((operation) => (
                        <SelectItem key={operation} value={operation}>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {operation}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormFieldError message={errors.operation?.message} className="mt-1" />
            </div>

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
                <Label htmlFor="totalQty">Загальна кількість *</Label>
                <Input id="totalQty" type="number" min="0" placeholder="0" {...register("totalQty")} />
                <FormFieldError message={errors.totalQty?.message} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="rejectedQty" className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Брак
                </Label>
                <Input id="rejectedQty" type="number" min="0" placeholder="0" {...register("rejectedQty")} />
                <FormFieldError message={errors.rejectedQty?.message} className="mt-1" />
              </div>
            </div>

            {rejectedQtyValue > 0 && (
              <div>
                <Label htmlFor="defectReason">Причина браку *</Label>
                <Controller
                  control={control}
                  name="defectReason"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
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
                  )}
                />
                <FormFieldError message={errors.defectReason?.message} className="mt-1" />
              </div>
            )}

            <div>
              <Label htmlFor="notes">Примітки</Label>
              <Textarea id="notes" placeholder="Додаткова інформація..." rows={3} {...register("notes")} />
              <FormFieldError message={errors.notes?.message} className="mt-1" />
            </div>

            {totalQtyValue > 0 && (
              <div className="space-y-1 rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Загалом:</span>
                  <span className="font-medium">{totalQtyValue} шт.</span>
                </div>
                <div className="flex items-center justify-between text-green-600">
                  <span className="flex items-center gap-1 text-sm">
                    <CheckCircle className="h-3 w-3" />
                    Прийнято:
                  </span>
                  <span>{acceptedQty} шт.</span>
                </div>
                {rejectedQtyValue > 0 && (
                  <div className="flex items-center justify-between text-red-600">
                    <span className="flex items-center gap-1 text-sm">
                      <XCircle className="h-3 w-3" />
                      Брак:
                    </span>
                    <span>{rejectedQtyValue} шт.</span>
                  </div>
                )}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting || !isValid} className="w-full">
              {isSubmitting ? "Записую..." : "Записати контроль"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
