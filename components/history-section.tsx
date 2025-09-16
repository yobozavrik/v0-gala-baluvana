"use client"

import { useState, useEffect } from "react"
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
import { SHIFT_STORAGE_KEYS } from "@/lib/utils"

type ShiftRecordType = keyof typeof SHIFT_STORAGE_KEYS

interface ShiftRecord {
  id: string
  type: ShiftRecordType
  timestamp: string
  data: any
}

export function HistorySection() {
  const [records, setRecords] = useState<ShiftRecord[]>([])
  const [editingRecord, setEditingRecord] = useState<ShiftRecord | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = () => {
    const operations = JSON.parse(localStorage.getItem(SHIFT_STORAGE_KEYS.operations) || "[]")
    const qc = JSON.parse(localStorage.getItem(SHIFT_STORAGE_KEYS.qc) || "[]")
    const warehouse = JSON.parse(localStorage.getItem(SHIFT_STORAGE_KEYS.warehouse) || "[]")
    const cutting = JSON.parse(localStorage.getItem(SHIFT_STORAGE_KEYS.cutting) || "[]")

    const allRecords: ShiftRecord[] = [
      ...operations
        .filter((op: any) => op && op.id && op.timestamp)
        .map((op: any) => ({ id: op.id, type: "operations" as const, timestamp: op.timestamp, data: op })),
      ...qc
        .filter((q: any) => q && q.id && q.timestamp)
        .map((q: any) => ({ id: q.id, type: "qc" as const, timestamp: q.timestamp, data: q })),
      ...warehouse
        .filter((w: any) => w && w.id && w.timestamp)
        .map((w: any) => ({ id: w.id, type: "warehouse" as const, timestamp: w.timestamp, data: w })),
      ...cutting
        .filter((c: any) => c && c.id && c.timestamp)
        .map((c: any) => ({ id: c.id, type: "cutting" as const, timestamp: c.timestamp, data: c })),
    ]

    allRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setRecords(allRecords)
  }

  const deleteRecord = (record: ShiftRecord) => {
    if (!record || !record.type) return

    const storageKey = SHIFT_STORAGE_KEYS[record.type]
    const currentRecords = JSON.parse(localStorage.getItem(storageKey) || "[]")
    const updatedRecords = currentRecords.filter((r: any) => r.id !== record.id)
    localStorage.setItem(storageKey, JSON.stringify(updatedRecords))

    loadRecords()
    toast({
      title: "Запис видалено",
      description: "Запис успішно видалено з історії",
    })
  }

  const startEdit = (record: ShiftRecord) => {
    if (!record || !record.type) return

    setEditingRecord(record)
    setEditForm({ ...record.data })
    setIsEditDialogOpen(true)
  }

  const saveEdit = () => {
    if (!editingRecord || !editingRecord.type) return

    const storageKey = SHIFT_STORAGE_KEYS[editingRecord.type]
    const currentRecords = JSON.parse(localStorage.getItem(storageKey) || "[]")
    const updatedRecords = currentRecords.map((r: any) =>
      r.id === editingRecord.id ? { ...editForm, id: editingRecord.id, timestamp: editingRecord.timestamp } : r,
    )
    localStorage.setItem(storageKey, JSON.stringify(updatedRecords))

    setIsEditDialogOpen(false)
    setEditingRecord(null)
    setEditForm({})
    loadRecords()
    toast({
      title: "Запис оновлено",
      description: "Зміни успішно збережено",
    })
  }

  const cancelEdit = () => {
    setIsEditDialogOpen(false)
    setEditingRecord(null)
    setEditForm({})
  }

  const getRecordIcon = (type: string) => {
    if (!type) return <Clock className="h-4 w-4" />

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

  const getRecordTitle = (type: string) => {
    if (!type) return "Запис"

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
    if (!editingRecord || !editingRecord.type) return null

    switch (editingRecord.type) {
      case "cutting": // додав форму редагування для розкрою
        return (
          <div className="space-y-4">
            <div>
              <Label>Номер замовлення</Label>
              <Input
                value={editForm.orderNumber || ""}
                onChange={(e) => setEditForm({ ...editForm, orderNumber: e.target.value })}
              />
            </div>
            <div>
              <Label>Настіл</Label>
              <Input
                value={editForm.layer || ""}
                onChange={(e) => setEditForm({ ...editForm, layer: e.target.value })}
              />
            </div>
            <div>
              <Label>Розмір</Label>
              <Select value={editForm.size || ""} onValueChange={(value) => setEditForm({ ...editForm, size: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XS">XS</SelectItem>
                  <SelectItem value="S">S</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="XL">XL</SelectItem>
                  <SelectItem value="XXL">XXL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Кількість</Label>
              <Input
                type="number"
                value={editForm.quantity || ""}
                onChange={(e) => setEditForm({ ...editForm, quantity: Number.parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Примітки</Label>
              <Textarea
                value={editForm.notes || ""}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
          </div>
        )

      case "operations":
        return (
          <div className="space-y-4">
            <div>
              <Label>Номер замовлення</Label>
              <Input
                value={editForm.orderNumber || ""}
                onChange={(e) => setEditForm({ ...editForm, orderNumber: e.target.value })}
              />
            </div>
            <div>
              <Label>Настіл</Label>
              <Input
                value={editForm.layer || ""}
                onChange={(e) => setEditForm({ ...editForm, layer: e.target.value })}
              />
            </div>
            <div>
              <Label>Операція</Label>
              <Select
                value={editForm.operation || ""}
                onValueChange={(value) => setEditForm({ ...editForm, operation: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Оверлок">Оверлок</SelectItem>
                  <SelectItem value="Прямоточка">Прямоточка</SelectItem>
                  <SelectItem value="Розпошив">Розпошив</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Кількість</Label>
              <Input
                type="number"
                value={editForm.quantity || ""}
                onChange={(e) => setEditForm({ ...editForm, quantity: Number.parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Примітки</Label>
              <Textarea
                value={editForm.notes || ""}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
          </div>
        )

      case "qc":
        return (
          <div className="space-y-4">
            <div>
              <Label>Номер замовлення</Label>
              <Input
                value={editForm.orderNumber || ""}
                onChange={(e) => setEditForm({ ...editForm, orderNumber: e.target.value })}
              />
            </div>
            <div>
              <Label>Настіл</Label>
              <Input
                value={editForm.layer || ""}
                onChange={(e) => setEditForm({ ...editForm, layer: e.target.value })}
              />
            </div>
            <div>
              <Label>Операція</Label>
              <Select
                value={editForm.operation || ""}
                onValueChange={(value) => setEditForm({ ...editForm, operation: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Прасування">Прасування</SelectItem>
                  <SelectItem value="Пакування">Пакування</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Прийнято</Label>
              <Input
                type="number"
                value={editForm.accepted_qty || ""}
                onChange={(e) => setEditForm({ ...editForm, accepted_qty: Number.parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Відхилено</Label>
              <Input
                type="number"
                value={editForm.rejected_qty || ""}
                onChange={(e) => setEditForm({ ...editForm, rejected_qty: Number.parseInt(e.target.value) })}
              />
            </div>
            {editForm.rejected_qty > 0 && (
              <div>
                <Label>Причина браку</Label>
                <Select
                  value={editForm.defect_reason || ""}
                  onValueChange={(value) => setEditForm({ ...editForm, defect_reason: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wrong_size">Невірний розмір</SelectItem>
                    <SelectItem value="fabric_defect">Брак тканини</SelectItem>
                    <SelectItem value="sewing_defect">Брак пошиття</SelectItem>
                    <SelectItem value="color_mismatch">Невідповідність кольору</SelectItem>
                    <SelectItem value="damaged">Пошкоджено</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Примітки</Label>
              <Textarea
                value={editForm.notes || ""}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
          </div>
        )

      case "warehouse":
        return (
          <div className="space-y-4">
            <div>
              <Label>Номер замовлення</Label>
              <Input
                value={editForm.orderNumber || ""}
                onChange={(e) => setEditForm({ ...editForm, orderNumber: e.target.value })}
              />
            </div>
            <div>
              <Label>Настіл</Label>
              <Input
                value={editForm.layer || ""}
                onChange={(e) => setEditForm({ ...editForm, layer: e.target.value })}
              />
            </div>
            <div>
              <Label>Кількість</Label>
              <Input
                type="number"
                value={editForm.quantity || ""}
                onChange={(e) => setEditForm({ ...editForm, quantity: Number.parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Упаковка</Label>
              <Select
                value={editForm.packaging || ""}
                onValueChange={(value) => setEditForm({ ...editForm, packaging: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="пакет">Пакет</SelectItem>
                  <SelectItem value="коробка">Коробка</SelectItem>
                  <SelectItem value="зв'язка">Зв'язка</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Місце на складі</Label>
              <Select
                value={editForm.warehouse_location || ""}
                onValueChange={(value) => setEditForm({ ...editForm, warehouse_location: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A1">Зона A1</SelectItem>
                  <SelectItem value="A2">Зона A2</SelectItem>
                  <SelectItem value="B1">Зона B1</SelectItem>
                  <SelectItem value="B2">Зона B2</SelectItem>
                  <SelectItem value="C1">Зона C1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Примітки</Label>
              <Textarea
                value={editForm.notes || ""}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
          </div>
        )

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
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
              <div className="text-sm space-y-1">
                <div>
                  <strong>Замовлення:</strong> {record.data.orderNumber}
                </div>
                <div>
                  <strong>Настіл:</strong> {record.data.layer}
                </div>
                {record.type === "cutting" && ( // додав відображення даних розкрою
                  <>
                    <div>
                      <strong>Розмір:</strong> {record.data.size}
                    </div>
                    <div>
                      <strong>Кількість:</strong> {record.data.quantity}
                    </div>
                  </>
                )}
                {record.type === "operations" && (
                  <>
                    <div>
                      <strong>Операція:</strong> {record.data.operation}
                    </div>
                    <div>
                      <strong>Кількість:</strong> {record.data.quantity}
                    </div>
                  </>
                )}
                {record.type === "qc" && (
                  <>
                    <div>
                      <strong>Операція:</strong> {record.data.operation}
                    </div>
                    <div>
                      <strong>Прийнято:</strong> {record.data.accepted_qty}
                    </div>
                    <div>
                      <strong>Відхилено:</strong> {record.data.rejected_qty}
                    </div>
                    {record.data.defect_reason && (
                      <div>
                        <strong>Причина браку:</strong> {record.data.defect_reason}
                      </div>
                    )}
                  </>
                )}
                {record.type === "warehouse" && (
                  <>
                    <div>
                      <strong>Кількість:</strong> {record.data.quantity}
                    </div>
                    <div>
                      <strong>Упаковка:</strong> {record.data.packaging}
                    </div>
                    <div>
                      <strong>Місце:</strong> {record.data.warehouse_location}
                    </div>
                  </>
                )}
                {record.data.notes && (
                  <div>
                    <strong>Примітки:</strong> {record.data.notes}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
