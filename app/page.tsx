"use client"

import { useState, useEffect } from "react"
import { ShiftSection } from "@/components/shift-section"
import { CuttingSection } from "@/components/cutting-section" // додав імпорт розкрою
import { OperationsSection } from "@/components/operations-section"
import { QCSection } from "@/components/qc-section"
import { WarehouseSection } from "@/components/warehouse-section"
import { HistorySection } from "@/components/history-section"
import { BottomNavigation } from "@/components/bottom-navigation"

export default function HomePage() {
  const [activeSection, setActiveSection] = useState("shift")
  const [isShiftActive, setIsShiftActive] = useState(false)

  useEffect(() => {
    // Check if shift is active from localStorage
    const savedShift = localStorage.getItem("currentShift")
    setIsShiftActive(savedShift === "active")
  }, [])

  // Listen for shift status changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedShift = localStorage.getItem("currentShift")
      setIsShiftActive(savedShift === "active")
    }

    window.addEventListener("storage", handleStorageChange)

    // Also check periodically in case of same-tab changes
    const interval = setInterval(handleStorageChange, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const renderSection = () => {
    switch (activeSection) {
      case "shift":
        return <ShiftSection />
      case "cutting": // додав обробку розкрою
        return <CuttingSection />
      case "operations":
        return <OperationsSection />
      case "qc":
        return <QCSection />
      case "warehouse":
        return <WarehouseSection />
      case "history":
        return <HistorySection />
      default:
        return <ShiftSection />
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto p-4 max-w-md">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-center">Швейна фабрика</h1>
          <p className="text-muted-foreground text-center">Система управління виробництвом</p>
        </header>

        <main>{renderSection()}</main>
      </div>

      <BottomNavigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isShiftActive={isShiftActive}
      />
    </div>
  )
}
