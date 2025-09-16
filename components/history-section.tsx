"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Edit, Clock, Wrench, CheckCircle, Package, FileText, Scissors } from "lucide-react"
import type {
  CuttingRecord,
  OperationRecord,
  QCRecord,
  WarehouseRecord,
} from "@/components/shift-section"

type RecordType = "operations" | "qc" | "warehouse" | "cutting"

type HistoryRecord =
  | { id: string; type: "operations"; timestamp: string; data: OperationRecord }
  | { id: string; type: "qc"; timestamp: string; data: QCRecord }
  | { id: string; type: "warehouse"; timestamp: string; data: WarehouseRecord }
  | { id: string; type: "cutting"; timestamp: string; data: CuttingRecord }

const STORAGE_KEYS: Record<RecordType, string> = {
  operations: "shift_operations",
  qc: "shift_qc",
  warehouse: "shift_warehouse",
  cutting: "shift_cutting",
}

const OPERATION_OPTIONS = ["Оверлок", "Прямоточка", "Розпошив"]
const QC_OPERATION_OPTIONS = ["Прасування", "Пакування"]
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"]
const COLOR_OPTIONS = ["Білий", "Чорний", "Сірий", "Синій", "Червоний", "Зелений"]
const PACKAGING_OPTIONS = ["Пакет", "Коробка", "Зв'язка"]
const LOCATION_OPTIONS = ["Склад А1", "Склад А2", "Склад Б1", "Склад Б2", "Експедиція", "Відвантаження"]
const DEFECT_REASONS = [
  "Неправильний шов",
  "Пошкодження тканини",
  "Неправильний розмір",
  "Забруднення",
  "Неправильний колір",
  "Відсутні деталі",
  "Інше",
]

function parseStoredRecords<T>(key: string): T[] {
  const raw = localStorage.getItem(key)
  if (!raw) return []
  try {
    return JSON.parse(raw) as T[]
  } catch (error) {
    console.error(`Failed to parse records for ${key}`, error)
    return []
  }
}

function isValidRecord<T extends { id: string; timestamp: string }>(
  record: T | null | undefined,
): record is T {
  return Boolean(record?.id && record?.timestamp)
}

export function HistorySection() {
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [editingRecord, setEditingRecord] = useState<HistoryRecord | null>(null)
  const [editForm, setEditForm] = useState<HistoryRecord["data"] | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { toast } = useToast()

  const loadRecords = () => {
    const operations = parseStoredRecords<OperationRecord>(STORAGE_KEYS.operations)
    const qc = parseStoredRecords<QCRecord>(STORAGE_KEYS.qc)
    const warehouse = parseStoredRecords<WarehouseRecord>(STORAGE_KEYS.warehouse)
    const cutting = parseStoredRecords<CuttingRecord>(STORAGE_KEYS.cutting)

    const allRecords: HistoryRecord[] = [
      ...operations
        .filter((record) => isValidRecord<OperationRecord>(record))
        .map((op) => ({ id: op.id, type: "operations" as const, timestamp: op.timestamp, data: op })),
      ...qc
        .filter((record) => isValidRecord<QCRecord>(record))
        .map((q) => ({ id: q.id, type: "qc" as const, timestamp: q.timestamp, data: q })),
      ...warehouse
        .filter((record) => isValidRecord<WarehouseRecord>(record))
        .map((w) => ({ id: w.id, type: "warehouse" as const, timestamp: w.timestamp, data: w })),
      ...cutting
        .filter((record) => isValidRecord<CuttingRecord>(record))
        .map((c) => ({ id: c.id, type: "cutting" as const, timestamp: c.timestamp, data: c })),
    ]

    allRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setRecords(allRecords)
  }

  useEffect(() => {
    loadRecords()
  }, [])

  const deleteRecord = (record: HistoryRecord) => {
    const storageKey = STORAGE_KEYS[record.type]

    switch (record.type) {
      case "operations": {
        const currentRecords = parseStoredRecords<OperationRecord>(storageKey)
        const updatedRecords = currentRecords.filter((item) => item.id !== record.id)
        localStorage.setItem(storageKey, JSON.stringify(updatedRecords))
        break
      }
      case "qc": {
        const currentRecords = parseStoredRecords<QCRecord>(storageKey)
        const updatedRecords = currentRecords.filter((item) => item.id !== record.id)
        localStorage.setItem(storageKey, JSON.stringify(updatedRecords))
        break
      }
      case "warehouse": {
        const currentRecords = parseStoredRecords<WarehouseRecord>(storageKey)
        const updatedRecords = currentRecords.filter((item) => item.id !== record.id)
        localStorage.setItem(storageKey, JSON.stringify(updatedRecords))
        break
      }
      case "cutting": {
        const currentRecords = parseStoredRecords<CuttingRecord>(storageKey)
        const updatedRecords = currentRecords.filter((item) => item.id !== record.id)
        localStorage.setItem(storageKey, JSON.stringify(updatedRecords))
        break
      }
    }

    loadRecords()
    toast({
      title: "Запис видалено",
      description: "Запис успішно видалено з історії",
    })
  }

  const startEdit = (record: HistoryRecord) => {
    setEditingRecord(record)
    setEditForm({ ...record.data })
    setIsEditDialogOpen(true)
  }

  const saveEdit = () => {
    if (!editingRecord || !editForm) return

    const storageKey = STORAGE_KEYS[editingRecord.type]

    switch (editingRecord.type) {
      case "operations": {
        const currentRecords = parseStoredRecords<OperationRecord>(storageKey)
        const updatedRecords = currentRecords.map((item) =>
          item.id === editingRecord.id
            ? {
                ...item,
                ...(editForm as OperationRecord),
                id: editingRecord.id,
                timestamp: editingRecord.timestamp,
              }
            : item,
        )
        localStorage.setItem(storageKey, JSON.stringify(updatedRecords))
        break
      }
      case "qc": {
        const currentRecords = parseStoredRecords<QCRecord>(storageKey)
        const updatedRecords = currentRecords.map((item) =>
          item.id === editingRecord.id
            ? {
                ...item,
                ...(editForm as QCRecord),
                id: editingRecord.id,
                timestamp: editingRecord.timestamp,
              }
            : item,
        )
        localStorage.setItem(storageKey, JSON.stringify(updatedRecords))
        break
      }
      case "warehouse": {
        const currentRecords = parseStoredRecords<WarehouseRecord>(storageKey)
        const updatedRecords = currentRecords.map((item) =>
          item.id === editingRecord.id
            ? {
                ...item,
                ...(editForm as WarehouseRecord),
                id: editingRecord.id,
                timestamp: editingRecord.timestamp,
              }
            : item,
        )
        localStorage.setItem(storageKey, JSON.stringify(updatedRecords))
        break
      }
      case "cutting": {
        const currentRecords = parseStoredRecords<CuttingRecord>(storageKey)
        const updatedRecords = currentRecords.map((item) =>
          item.id === editingRecord.id
            ? {
                ...item,
                ...(editForm as CuttingRecord),
                id: editingRecord.id,
                timestamp: editingRecord.timestamp,
              }
            : item,
        )
        localStorage.setItem(storageKey, JSON.stringify(updatedRecords))
        break
      }
    }

    setIsEditDialogOpen(false)
    setEditingRecord(null)
    setEditForm(null)
    loadRecords()
    toast({
      title: "Запис оновлено",
      description: "Зміни успішно збережено",
    })
  }

  const cancelEdit = () => {
    setIsEditDialogOpen(false)
    setEditingRecord(null)
    setEditForm(null)
  }

  const getRecordIcon = (type: RecordType) => {
    switch (type) {
      case "cutting":
        return <Scissors className="h-4 w-4" />
      case "operations":
        return <Wrench className="h-4 w-4" />
      case "qc":
        return <CheckCircle className="h-4 w-4" />
      case "warehouse":
        return <Package className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getRecordTitle = (type: RecordType) => {
    switch (type) {
      case "cutting":
        return "Розкрій"
      case "operations":
        return "Операція"
      case "qc":
        return "Контроль якості"
      case "warehouse":
        return "Переказ на склад"
      default:
        return "Запис"
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderEditForm = () => {
    if (!editingRecord || !editForm) return null

    switch (editingRecord.type) {
      case "cutting": {
        const data = editForm as CuttingRecord
        return (
          <div className="space-y-4">
            <div>
              <Label>Номер замовлення</Label>
              <Input
                value={data.orderNumber}
                onChange={(e) => setEditForm({ ...data, orderNumber: e.target.value })}
              />
            </div>
            <div>
              <Label>Настіл</Label>
              <Input
                value={data.layer}
                onChange={(e) => setEditForm({ ...data, layer: e.target.value })}
              />
            </div>
            <div>
              <Label>Розмір (см)</Label>
              <Input
                type="number"
                value={data.size}
                onChange={(e) => {
                  const value = Number.parseFloat(e.target.value)
                  setEditForm({ ...data, size: Number.isNaN(value) ? data.size : value })
                }}
              />
            </div>
            <div>
              <Label>Кількість</Label>
              <Input
                type="number"
                value={data.quantity}
                onChange={(e) => {
                  const value = Number.parseInt(e.target.value, 10)
                  setEditForm({ ...data, quantity: Number.isNaN(value) ? data.quantity : value })
                }}
              />
            </div>
            <div>
              <Label>Примітки</Label>
              <Textarea
                value={data.notes || ""}
                onChange={(e) => setEditForm({ ...data, notes: e.target.value })}
              />
            </div>
          </div>
        )
      }
      case "operations": {
        const data = editForm as OperationRecord
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Номер замовлення</Label>
                <Input
                  value={data.orderNumber}
                  onChange={(e) => setEditForm({ ...data, orderNumber: e.target.value })}
                />
              </div>
              <div>
                <Label>Настіл</Label>
                <Input
                  value={data.layer}
                  onChange={(e) => setEditForm({ ...data, layer: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Розмір</Label>
                <Select
                  value={data.size || ""}
                  onValueChange={(value) => setEditForm({ ...data, size: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть розмір" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Колір</Label>
                <Select
                  value={data.color || ""}
                  onValueChange={(value) => setEditForm({ ...data, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть колір" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((color) => (
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
                <Label>Операція</Label>
                <Select
                  value={data.operation}
                  onValueChange={(value) => setEditForm({ ...data, operation: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть операцію" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATION_OPTIONS.map((operation) => (
                      <SelectItem key={operation} value={operation}>
                        {operation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Кількість</Label>
                <Input
                  type="number"
                  value={data.quantity}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value, 10)
                    setEditForm({ ...data, quantity: Number.isNaN(value) ? data.quantity : value })
                  }}
                />
              </div>
            </div>
            <div>
              <Label>Примітки</Label>
              <Textarea
                value={data.notes || ""}
                onChange={(e) => setEditForm({ ...data, notes: e.target.value })}
              />
            </div>
          </div>
        )
      }
      case "qc": {
        const data = editForm as QCRecord
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Операція</Label>
                <Select
                  value={data.operation}
                  onValueChange={(value) => setEditForm({ ...data, operation: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть операцію" />
                  </SelectTrigger>
                  <SelectContent>
                    {QC_OPERATION_OPTIONS.map((operation) => (
                      <SelectItem key={operation} value={operation}>
                        {operation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Товар</Label>
                <Input
                  value={data.product}
                  onChange={(e) => setEditForm({ ...data, product: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SKU</Label>
                <Input
                  value={data.sku || ""}
                  onChange={(e) => setEditForm({ ...data, sku: e.target.value })}
                />
              </div>
              <div>
                <Label>Розмір</Label>
                <Select
                  value={data.size || ""}
                  onValueChange={(value) => setEditForm({ ...data, size: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть розмір" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Колір</Label>
                <Select
                  value={data.color || ""}
                  onValueChange={(value) => setEditForm({ ...data, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть колір" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Загальна кількість</Label>
                <Input
                  type="number"
                  value={data.totalQty}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value, 10)
                    setEditForm({ ...data, totalQty: Number.isNaN(value) ? data.totalQty : value })
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Прийнято</Label>
                <Input
                  type="number"
                  value={data.acceptedQty}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value, 10)
                    setEditForm({ ...data, acceptedQty: Number.isNaN(value) ? data.acceptedQty : value })
                  }}
                />
              </div>
              <div>
                <Label>Відхилено</Label>
                <Input
                  type="number"
                  value={data.rejectedQty}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value, 10)
                    setEditForm({ ...data, rejectedQty: Number.isNaN(value) ? data.rejectedQty : value })
                  }}
                />
              </div>
            </div>
            {data.rejectedQty > 0 && (
              <div>
                <Label>Причина браку</Label>
                <Select
                  value={data.defectReason || ""}
                  onValueChange={(value) => setEditForm({ ...data, defectReason: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть причину" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFECT_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Примітки</Label>
              <Textarea
                value={data.notes || ""}
                onChange={(e) => setEditForm({ ...data, notes: e.target.value })}
              />
            </div>
          </div>
        )
      }
      case "warehouse": {
        const data = editForm as WarehouseRecord
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Товар</Label>
                <Input
                  value={data.product}
                  onChange={(e) => setEditForm({ ...data, product: e.target.value })}
                />
              </div>
              <div>
                <Label>SKU</Label>
                <Input
                  value={data.sku || ""}
                  onChange={(e) => setEditForm({ ...data, sku: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Розмір</Label>
                <Select
                  value={data.size || ""}
                  onValueChange={(value) => setEditForm({ ...data, size: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть розмір" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Колір</Label>
                <Select
                  value={data.color || ""}
                  onValueChange={(value) => setEditForm({ ...data, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть колір" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((color) => (
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
                <Label>Кількість</Label>
                <Input
                  type="number"
                  value={data.quantity}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value, 10)
                    setEditForm({ ...data, quantity: Number.isNaN(value) ? data.quantity : value })
                  }}
                />
              </div>
              <div>
                <Label>Упаковка</Label>
                <Select
                  value={data.packaging || ""}
                  onValueChange={(value) => setEditForm({ ...data, packaging: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть упаковку" />
                  </SelectTrigger>
                  <SelectContent>
                    {PACKAGING_OPTIONS.map((packaging) => (
                      <SelectItem key={packaging} value={packaging}>
                        {packaging}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Місце на складі</Label>
                <Select
                  value={data.location}
                  onValueChange={(value) => setEditForm({ ...data, location: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть місце" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_OPTIONS.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Отримувач</Label>
                <Input
                  value={data.receiver || ""}
                  onChange={(e) => setEditForm({ ...data, receiver: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Примітки</Label>
              <Textarea
                value={data.notes || ""}
                onChange={(e) => setEditForm({ ...data, notes: e.target.value })}
              />
            </div>
          </div>
        )
      }
      default:
        return null
    }
  }

  const renderRecordDetails = (record: HistoryRecord) => {
    switch (record.type) {
      case "cutting": {
        const data = record.data
        return (
          <>
            <div>
              <strong>Замовлення:</strong> {data.orderNumber}
            </div>
            <div>
              <strong>Настіл:</strong> {data.layer}
            </div>
            <div>
              <strong>Розмір:</strong> {data.size} см
            </div>
            <div>
              <strong>Кількість:</strong> {data.quantity}
            </div>
            {data.notes && (
              <div>
                <strong>Примітки:</strong> {data.notes}
              </div>
            )}
          </>
        )
      }
      case "operations": {
        const data = record.data
        return (
          <>
            <div>
              <strong>Замовлення:</strong> {data.orderNumber}
            </div>
            <div>
              <strong>Настіл:</strong> {data.layer}
            </div>
            {data.size && (
              <div>
                <strong>Розмір:</strong> {data.size}
              </div>
            )}
            {data.color && (
              <div>
                <strong>Колір:</strong> {data.color}
              </div>
            )}
            <div>
              <strong>Операція:</strong> {data.operation}
            </div>
            <div>
              <strong>Кількість:</strong> {data.quantity}
            </div>
            {data.notes && (
              <div>
                <strong>Примітки:</strong> {data.notes}
              </div>
            )}
          </>
        )
      }
      case "qc": {
        const data = record.data
        return (
          <>
            <div>
              <strong>Операція:</strong> {data.operation}
            </div>
            <div>
              <strong>Товар:</strong> {data.product}
            </div>
            {data.sku && (
              <div>
                <strong>SKU:</strong> {data.sku}
              </div>
            )}
            {data.size && (
              <div>
                <strong>Розмір:</strong> {data.size}
              </div>
            )}
            {data.color && (
              <div>
                <strong>Колір:</strong> {data.color}
              </div>
            )}
            <div>
              <strong>Загалом:</strong> {data.totalQty}
            </div>
            <div>
              <strong>Прийнято:</strong> {data.acceptedQty}
            </div>
            <div>
              <strong>Брак:</strong> {data.rejectedQty}
            </div>
            {data.defectReason && (
              <div>
                <strong>Причина браку:</strong> {data.defectReason}
              </div>
            )}
            {data.notes && (
              <div>
                <strong>Примітки:</strong> {data.notes}
              </div>
            )}
          </>
        )
      }
      case "warehouse": {
        const data = record.data
        return (
          <>
            <div>
              <strong>Товар:</strong> {data.product}
            </div>
            {data.sku && (
              <div>
                <strong>SKU:</strong> {data.sku}
              </div>
            )}
            {data.size && (
              <div>
                <strong>Розмір:</strong> {data.size}
              </div>
            )}
            {data.color && (
              <div>
                <strong>Колір:</strong> {data.color}
              </div>
            )}
            <div>
              <strong>Кількість:</strong> {data.quantity}
            </div>
            {data.packaging && (
              <div>
                <strong>Упаковка:</strong> {data.packaging}
              </div>
            )}
            <div>
              <strong>Місце:</strong> {data.location}
            </div>
            {data.receiver && (
              <div>
                <strong>Отримувач:</strong> {data.receiver}
              </div>
            )}
            {data.notes && (
              <div>
                <strong>Примітки:</strong> {data.notes}
              </div>
            )}
          </>
        )
      }
      default:
        return null
    }
  }

  if (records.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Історія порожня</h3>
          <p className="text-muted-foreground">
            Записи з'являться тут після виконання розкрою, операцій, контролю якості або переказів на склад.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Історія зміни</h2>
        <Badge variant="secondary">{records.length} записів</Badge>
      </div>

      <div className="space-y-3">
        {records.map((record) => (
          <Card key={record.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getRecordIcon(record.type)}
                  <CardTitle className="text-sm">{getRecordTitle(record.type)}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {formatTime(record.timestamp)}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Dialog
                    open={isEditDialogOpen}
                    onOpenChange={(open) => {
                      setIsEditDialogOpen(open)
                      if (!open) {
                        setEditingRecord(null)
                        setEditForm(null)
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(record)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Редагувати запис</DialogTitle>
                      </DialogHeader>
                      {renderEditForm()}
                      <div className="flex gap-2 pt-4">
                        <Button onClick={saveEdit}>Зберегти</Button>
                        <Button variant="outline" onClick={cancelEdit}>
                          Скасувати
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="ghost" size="sm" onClick={() => deleteRecord(record)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm space-y-1">{renderRecordDetails(record)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
