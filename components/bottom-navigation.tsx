"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Wrench, CheckCircle, Package, History } from "lucide-react"

interface BottomNavigationProps {
  activeSection: string
  onSectionChange: (section: string) => void
  isShiftActive: boolean
}

export function BottomNavigation({ activeSection, onSectionChange, isShiftActive }: BottomNavigationProps) {
  const sections = [
    {
      id: "shift",
      label: "Зміна",
      icon: Clock,
      enabled: true,
    },
    {
      id: "operations",
      label: "Операції",
      icon: Wrench,
      enabled: isShiftActive,
    },
    {
      id: "qc",
      label: "Контроль",
      icon: CheckCircle,
      enabled: isShiftActive,
    },
    {
      id: "warehouse",
      label: "Склад",
      icon: Package,
      enabled: isShiftActive,
    },
    {
      id: "history",
      label: "Історія",
      icon: History,
      enabled: isShiftActive,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
      <div className="container mx-auto max-w-md">
        <div className="grid grid-cols-5 gap-1 p-2">
          {sections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            const isEnabled = section.enabled

            return (
              <Button
                key={section.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                disabled={!isEnabled}
                onClick={() => isEnabled && onSectionChange(section.id)}
                className="flex flex-col gap-1 h-auto py-2 px-1 relative"
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{section.label}</span>
                {!isEnabled && section.id !== "shift" && (
                  <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs px-1 py-0">
                    🔒
                  </Badge>
                )}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
