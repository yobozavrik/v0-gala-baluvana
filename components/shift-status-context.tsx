"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type ShiftState = "active" | "inactive"

interface ShiftStatusContextValue {
  status: ShiftState
  currentEmployee: string
  isShiftActive: boolean
  setShiftState: (status: ShiftState, employeeName?: string) => void
  startShift: (employeeName: string) => void
  endShift: () => void
}

const SHIFT_STATUS_KEY = "currentShift"
const SHIFT_EMPLOYEE_KEY = "currentEmployee"

const ShiftStatusContext = createContext<ShiftStatusContextValue | undefined>(undefined)

export function ShiftStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ShiftState>("inactive")
  const [currentEmployee, setCurrentEmployee] = useState("")

  const syncFromStorage = useCallback(() => {
    const savedStatus = localStorage.getItem(SHIFT_STATUS_KEY)
    const savedEmployee = localStorage.getItem(SHIFT_EMPLOYEE_KEY)

    if (savedStatus === "active" || savedStatus === "inactive") {
      setStatus(savedStatus)
    } else {
      setStatus("inactive")
    }

    setCurrentEmployee(savedEmployee || "")
  }, [])

  useEffect(() => {
    syncFromStorage()
  }, [syncFromStorage])

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === SHIFT_STATUS_KEY || event.key === SHIFT_EMPLOYEE_KEY || event.key === null) {
        syncFromStorage()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [syncFromStorage])

  const setShiftState = useCallback((newStatus: ShiftState, employeeName?: string) => {
    setStatus(newStatus)

    if (newStatus === "active") {
      const finalEmployee = employeeName ?? ""
      setCurrentEmployee(finalEmployee)
      localStorage.setItem(SHIFT_STATUS_KEY, "active")
      if (finalEmployee) {
        localStorage.setItem(SHIFT_EMPLOYEE_KEY, finalEmployee)
      } else {
        localStorage.removeItem(SHIFT_EMPLOYEE_KEY)
      }
    } else {
      setCurrentEmployee("")
      localStorage.setItem(SHIFT_STATUS_KEY, "inactive")
      localStorage.removeItem(SHIFT_EMPLOYEE_KEY)
    }
  }, [])

  const startShift = useCallback(
    (employeeName: string) => {
      setShiftState("active", employeeName)
    },
    [setShiftState],
  )

  const endShift = useCallback(() => {
    setShiftState("inactive")
  }, [setShiftState])

  const value = useMemo(
    () => ({
      status,
      currentEmployee,
      isShiftActive: status === "active",
      setShiftState,
      startShift,
      endShift,
    }),
    [currentEmployee, endShift, setShiftState, startShift, status],
  )

  return <ShiftStatusContext.Provider value={value}>{children}</ShiftStatusContext.Provider>
}

export function useShiftStatus() {
  const context = useContext(ShiftStatusContext)

  if (!context) {
    throw new Error("useShiftStatus must be used within a ShiftStatusProvider")
  }

  return context
}
