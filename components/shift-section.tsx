"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { postJSON, API_ENDPOINTS, isEndpointConfigured } from "@/lib/api"
import { offlineQueue } from "@/lib/offline-queue"
import { AlertCircle, Settings, User } from "lucide-react"

export type ShiftAction = "start" | "end"
export type ShiftStatus = "active" | "inactive"

export interface OperationRecord {
  id: string
  orderNumber: string
  layer: string
  size?: string
  color?: string
  operation: string
  quantity: number
  notes?: string
  timestamp: string
  user_id: string
  employee?: string
}

export interface QCRecord {
  id: string
  operation: string
  product: string
  sku?: string
  size?: string
  color?: string
  totalQty: number
  acceptedQty: number
  rejectedQty: number
  defectReason?: string
  notes?: string
  timestamp: string
  user_id: string
  employee?: string
}

export interface WarehouseRecord {
  id: string
  product: string
  sku?: string
  size?: string
  color?: string
  quantity: number
  packaging?: string
  location: string
  receiver?: string
  notes?: string
  timestamp: string
  user_id: string
}

export interface CuttingRecord {
  id: string
  orderNumber: string
  layer: string
  size: number
  quantity: number
  notes?: string
  timestamp: string
  user_id: string
  type: "cutting"
}

export interface ShiftSummary {
  operations: OperationRecord[]
  qc: QCRecord[]
  warehouse: WarehouseRecord[]
  total_records: number
}

export interface ShiftRequestPayload {
  action: ShiftAction
  timestamp: string
  user_id: string
  employee?: string
  shift_data?: ShiftSummary
}

export interface ShiftRecord {
  action: ShiftAction
  timestamp: string
  status: "success" | "pending" | "demo" | "error"
  employee?: string
}

const EMPLOYEES = ["Кравчук", "Кучма", "Ющенко", "Янукович", "Порошенко", "Зеленський"]

export function ShiftSection() {
  const [currentShift, setCurrentShift] = useState<ShiftStatus>("inactive")
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [currentEmployee, setCurrentEmployee] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [recentShifts, setRecentShifts] = useState<ShiftRecord[]>([])
  const { toast } = useToast()

  const isConfigured = isEndpointConfigured(API_ENDPOINTS.shift)

  useEffect(() => {
    // Load shift status from localStorage
    const savedShift = localStorage.getItem("currentShift")
    const savedEmployee = localStorage.getItem("currentEmployee")
    if (savedShift) {
      setCurrentShift(savedShift as ShiftStatus)
    }
    if (savedEmployee) {
      setCurrentEmployee(savedEmployee)
    }

    // Load recent shifts
    const savedShifts = localStorage.getItem("recentShifts")
    if (savedShifts) {
      try {
        setRecentShifts(JSON.parse(savedShifts) as ShiftRecord[])
      } catch (error) {
        console.error("Failed to parse recent shifts", error)
      }
    }
  }, [])

  const handleShiftAction = async (action: ShiftAction) => {
    if (action === "start" && !selectedEmployee) {
      toast({
        title: "Оберіть співробітника",
        description: "Необхідно обрати співробітника перед початком зміни",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    const shiftData: ShiftRequestPayload = {
      action,
      timestamp: new Date().toISOString(),
      user_id: "telegram_user_id",
    }

    if (action === "start") {
      shiftData.employee = selectedEmployee
      localStorage.removeItem("shiftOperations")
      localStorage.removeItem("shiftQC")
      localStorage.removeItem("shiftWarehouse")
    } else {
      shiftData.employee = currentEmployee
      const operations = JSON.parse(localStorage.getItem("shiftOperations") || "[]") as OperationRecord[]
      const qc = JSON.parse(localStorage.getItem("shiftQC") || "[]") as QCRecord[]
      const warehouse = JSON.parse(localStorage.getItem("shiftWarehouse") || "[]") as WarehouseRecord[]

      shiftData.shift_data = {
        operations,
        qc,
        warehouse,
        total_records: operations.length + qc.length + warehouse.length,
      }
    }

    try {
      if (!isConfigured) {
        // Demo mode - just update local state
        const newShift = action === "start" ? "active" : "inactive"
        setCurrentShift(newShift)
        localStorage.setItem("currentShift", newShift)

        if (action === "start") {
          setCurrentEmployee(selectedEmployee)
          localStorage.setItem("currentEmployee", selectedEmployee)
        } else {
          setCurrentEmployee("")
          localStorage.removeItem("currentEmployee")
          localStorage.removeItem("shiftOperations")
          localStorage.removeItem("shiftQC")
          localStorage.removeItem("shiftWarehouse")
        }

        const shiftRecord: ShiftRecord = {
          action,
          timestamp: new Date().toLocaleString("uk-UA"),
          status: "demo",
          employee: action === "start" ? selectedEmployee : currentEmployee,
        }

        const updatedShifts = [shiftRecord, ...recentShifts.slice(0, 4)]
        setRecentShifts(updatedShifts)
        localStorage.setItem("recentShifts", JSON.stringify(updatedShifts))

        toast({
          title:
            action === "start"
              ? `Зміну розпочато (демо) - ${selectedEmployee}`
              : `Зміну завершено (демо) - ${currentEmployee}`,
          description:
            action === "end"
              ? `Відправлено ${shiftData.shift_data?.total_records || 0} записів`
              : "Налаштуйте API endpoints для відправки даних на сервер",
        })

        if (action === "start") {
          setSelectedEmployee("")
        }

        setIsLoading(false)
        return
      }

      const result = await postJSON<ShiftRequestPayload>(API_ENDPOINTS.shift, shiftData)

      if (result.success) {
        const newShift = action === "start" ? "active" : "inactive"
        setCurrentShift(newShift)
        localStorage.setItem("currentShift", newShift)

        if (action === "start") {
          setCurrentEmployee(selectedEmployee)
          localStorage.setItem("currentEmployee", selectedEmployee)
          setSelectedEmployee("")
        } else {
          setCurrentEmployee("")
          localStorage.removeItem("currentEmployee")
          localStorage.removeItem("shiftOperations")
          localStorage.removeItem("shiftQC")
          localStorage.removeItem("shiftWarehouse")
        }

        // Add to recent shifts
        const shiftRecord: ShiftRecord = {
          action,
          timestamp: new Date().toLocaleString("uk-UA"),
          status: "success",
          employee: action === "start" ? selectedEmployee : currentEmployee,
        }

        const updatedShifts = [shiftRecord, ...recentShifts.slice(0, 4)]
        setRecentShifts(updatedShifts)
        localStorage.setItem("recentShifts", JSON.stringify(updatedShifts))

        toast({
          title: action === "start" ? `Зміну розпочато - ${selectedEmployee}` : `Зміну завершено - ${currentEmployee}`,
          description:
            action === "end"
              ? `Відправлено ${shiftData.shift_data?.total_records || 0} записів`
              : "Дані успішно відправлено",
        })
      } else {
        console.info("Shift action queued:", result.error)

        // Add to offline queue
        await offlineQueue.addRequest(API_ENDPOINTS.shift, shiftData)

        // Add to recent shifts with pending status
        const shiftRecord: ShiftRecord = {
          action,
          timestamp: new Date().toLocaleString("uk-UA"),
          status: "pending",
          employee: action === "start" ? selectedEmployee : currentEmployee,
        }

        const updatedShifts = [shiftRecord, ...recentShifts.slice(0, 4)]
        setRecentShifts(updatedShifts)
        localStorage.setItem("recentShifts", JSON.stringify(updatedShifts))

        toast({
          title: "Запит додано до черги",
          description: "Буде відправлено при відновленні з'єднання",
        })
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      toast({
        title: "Несподівана помилка",
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
        <Alert className="bg-muted border-border">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="flex items-center justify-between text-foreground">
            <span>Демо режим. Додайте змінні середовища у Project Settings для відправки даних.</span>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardTitle className="flex items-center justify-between text-card-foreground">
            Управління зміною
            <div className="flex items-center gap-2">
              {currentEmployee && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 bg-secondary/50 text-secondary-foreground border-border"
                >
                  <User className="h-3 w-3" />
                  {currentEmployee}
                </Badge>
              )}
              <Badge
                variant={currentShift === "active" ? "default" : "secondary"}
                className={
                  currentShift === "active"
                    ? "bg-success text-success-foreground"
                    : "bg-secondary text-secondary-foreground"
                }
              >
                {currentShift === "active" ? "Активна" : "Неактивна"}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {currentShift === "inactive" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Оберіть співробітника:</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="bg-input border-border text-foreground focus:ring-primary">
                  <SelectValue placeholder="Виберіть співробітника..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {EMPLOYEES.map((employee) => (
                    <SelectItem
                      key={employee}
                      value={employee}
                      className="text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      {employee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => handleShiftAction("start")}
              disabled={currentShift === "active" || isLoading}
              className="flex-1 relative overflow-hidden bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200" />
              <span className="relative z-10">{isLoading ? "Обробка..." : "Почати зміну"}</span>
            </Button>
            <Button
              onClick={() => handleShiftAction("end")}
              disabled={currentShift === "inactive" || isLoading}
              className="flex-1 relative overflow-hidden bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:shadow-lg hover:from-red-400 hover:via-red-500 hover:to-red-600"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200" />
              <span className="relative z-10">{isLoading ? "Обробка..." : "Завершити зміну"}</span>
            </Button>
          </div>

          {recentShifts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Останні дії:</h4>
              {recentShifts.map((shift, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-sm bg-muted/30 p-3 rounded-lg border border-border"
                >
                  <div className="flex flex-col">
                    <span className="text-foreground font-medium">
                      {shift.action === "start" ? "Початок" : "Кінець"} зміни
                    </span>
                    {shift.employee && <span className="text-xs text-muted-foreground">{shift.employee}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">{shift.timestamp}</span>
                    <Badge
                      variant={
                        shift.status === "success"
                          ? "default"
                          : shift.status === "pending"
                            ? "secondary"
                            : shift.status === "demo"
                              ? "outline"
                              : "destructive"
                      }
                      className={`text-xs ${
                        shift.status === "success"
                          ? "bg-success text-success-foreground"
                          : shift.status === "pending"
                            ? "bg-secondary text-secondary-foreground"
                            : shift.status === "demo"
                              ? "bg-background text-foreground border-border"
                              : "bg-destructive text-destructive-foreground"
                      }`}
                    >
                      {shift.status === "success"
                        ? "Відправлено"
                        : shift.status === "pending"
                          ? "В черзі"
                          : shift.status === "demo"
                            ? "Демо"
                            : "Помилка"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
