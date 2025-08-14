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

interface ShiftRecord {
  action: "start" | "end"
  timestamp: string
  status: string
  employee?: string
}

interface ShiftData {
  employee: string
  records: {
    operations: any[]
    qc: any[]
    warehouse: any[]
  }
}

const EMPLOYEES = ["Кравчук", "Кучма", "Ющенко", "Янукович", "Порошенко", "Зеленський"]

export function ShiftSection() {
  const [currentShift, setCurrentShift] = useState<"active" | "inactive">("inactive")
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
      setCurrentShift(savedShift as "active" | "inactive")
    }
    if (savedEmployee) {
      setCurrentEmployee(savedEmployee)
    }

    // Load recent shifts
    const savedShifts = localStorage.getItem("recentShifts")
    if (savedShifts) {
      setRecentShifts(JSON.parse(savedShifts))
    }
  }, [])

  const handleShiftAction = async (action: "start" | "end") => {
    if (action === "start" && !selectedEmployee) {
      toast({
        title: "Оберіть співробітника",
        description: "Необхідно обрати співробітника перед початком зміни",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    const shiftData: any = {
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
      const operations = JSON.parse(localStorage.getItem("shiftOperations") || "[]")
      const qc = JSON.parse(localStorage.getItem("shiftQC") || "[]")
      const warehouse = JSON.parse(localStorage.getItem("shiftWarehouse") || "[]")

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

      const result = await postJSON(API_ENDPOINTS.shift, shiftData)

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
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Демо режим. Додайте змінні середовища у Project Settings для відправки даних.</span>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Управління зміною
            <div className="flex items-center gap-2">
              {currentEmployee && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {currentEmployee}
                </Badge>
              )}
              <Badge variant={currentShift === "active" ? "default" : "secondary"}>
                {currentShift === "active" ? "Активна" : "Неактивна"}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentShift === "inactive" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Оберіть співробітника:</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Виберіть співробітника..." />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEES.map((employee) => (
                    <SelectItem key={employee} value={employee}>
                      {employee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => handleShiftAction("start")}
              disabled={currentShift === "active" || isLoading}
              className="flex-1"
            >
              {isLoading ? "Обробка..." : "Почати зміну"}
            </Button>
            <Button
              onClick={() => handleShiftAction("end")}
              disabled={currentShift === "inactive" || isLoading}
              variant="outline"
              className="flex-1"
            >
              {isLoading ? "Обробка..." : "Завершити зміну"}
            </Button>
          </div>

          {recentShifts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Останні дії:</h4>
              {recentShifts.map((shift, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div className="flex flex-col">
                    <span>{shift.action === "start" ? "Початок" : "Кінець"} зміни</span>
                    {shift.employee && <span className="text-xs text-muted-foreground">{shift.employee}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{shift.timestamp}</span>
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
                      className="text-xs"
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
