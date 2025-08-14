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
import { Trash2, Edit, Clock, Wrench, CheckCircle, Package, FileText } from "lucide-react"

interface ShiftRecord {
  id: string
  type: "operations" | "qc" | "warehouse"
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
    const operations = JSON.parse(localStorage.getItem("shift_operations") || "[]")
    const qc = JSON.parse(localStorage.getItem("shift_qc") || "[]")
    const warehouse = JSON.parse(localStorage.getItem("shift_warehouse") || "[]")

    const allRecords: ShiftRecord[] = [
      ...operations.map((op: any) => ({ id: op.id, type: "operations" as const, timestamp: op.timestamp, data: op })),
      ...qc.map((q: any) => ({ id: q.id, type: "qc" as const, timestamp: q.timestamp, data: q })),
      ...warehouse.map((w: any) => ({ id: w.id, type: "warehouse" as const, timestamp: w.timestamp, data: w })),
    ]

    allRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setRecords(allRecords)
  }

  const deleteRecord = (record: ShiftRecord) => {
    const storageKey = `shift_${record.type}`
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
    setEditingRecord(record)
    setEditForm({ ...record.data })
    setIsEditDialogOpen(true)
  }

  const saveEdit = () => {
    if (!editingRecord) return

    const storageKey = `shift_${editingRecord.type}`
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
    switch (type) {
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
    switch (type) {
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
    if (!editingRecord) return null

    switch (editingRecord.type) {
      case "operations":
        return (
          <div className="space-y-4">
            <div>
              <Label>Товар</Label>
              <Input
                value={editForm.product || ""}
                onChange={(e) => setEditForm({ ...editForm, product: e.target.value })}
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
                  <SelectItem value="cutting">Розкрій</SelectItem>
                  <SelectItem value="sewing">Пошиття</SelectItem>
                  <SelectItem value="overlock">Оверлок</SelectItem>
                  <SelectItem value="buttonhole">Петля</SelectItem>
                  <SelectItem value="button">Ґудзик</SelectItem>
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
              <Label>Товар</Label>
              <Input
                value={editForm.product || ""}
                onChange={(e) => setEditForm({ ...editForm, product: e.target.value })}
              />
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
              <Label>Товар</Label>
              <Input
                value={editForm.product || ""}
                onChange={(e) => setEditForm({ ...editForm, product: e.target.value })}
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
            Записи з'являться тут після виконання операцій, контролю якості або переказів на склад.
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
                  <strong>Товар:</strong> {record.data.product}
                </div>
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
