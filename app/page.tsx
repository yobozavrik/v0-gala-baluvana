"use client"

import { useState } from "react"
import { ShiftSection } from "@/components/shift-section"
import { CuttingSection } from "@/components/cutting-section"
import { OperationsSection } from "@/components/operations-section"
import { QCSection } from "@/components/qc-section"
import { WarehouseSection } from "@/components/warehouse-section"
import { HistorySection } from "@/components/history-section"
import { BottomNavigation } from "@/components/bottom-navigation"
import { ShiftStatusProvider } from "@/components/shift-status-context"

export default function HomePage() {
  const [activeSection, setActiveSection] = useState("shift")

  const renderSection = () => {
    switch (activeSection) {
      case "shift":
        return <ShiftSection />
      case "cutting":
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
    <ShiftStatusProvider>
      <div className="min-h-screen bg-background pb-16 sm:pb-20 md:pb-24">
        <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
          <header className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center">Швейна фабрика</h1>
            <p className="text-sm sm:text-base text-muted-foreground text-center">Система управління виробництвом</p>
          </header>

          <main className="space-y-4 sm:space-y-6">{renderSection()}</main>
        </div>

        <BottomNavigation activeSection={activeSection} onSectionChange={setActiveSection} />
      </div>
    </ShiftStatusProvider>
  )
}
