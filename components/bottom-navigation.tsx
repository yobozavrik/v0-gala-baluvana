"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Wrench, CheckCircle, Package, History, Scissors } from "lucide-react"
import { useShiftStatus } from "@/components/shift-status-context"

interface BottomNavigationProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function BottomNavigation({ activeSection, onSectionChange }: BottomNavigationProps) {
  const { isShiftActive } = useShiftStatus()
  const sections = [
    {
      id: "shift",
      label: "Зміна",
      icon: Clock,
      enabled: true,
    },
    {
      id: "cutting",
      label: "Розкрій",
      icon: Scissors,
      enabled: isShiftActive,
    },
    {
      id: "operations",
      label: "Операції",
      icon: Wrench,
      enabled: isShiftActive,
    },
    {
      id: "qc",
      label: "Утюжка", // змінив назву з "Контроль" на "Утюжка"
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
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-inset-bottom shadow-lg">
      <div className="container mx-auto max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
        <div className="grid grid-cols-6 gap-0.5 sm:gap-1 p-1 sm:p-2">
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
                className={`flex flex-col gap-0.5 sm:gap-1 h-auto py-1.5 sm:py-2 px-0.5 sm:px-1 relative min-h-[60px] sm:min-h-[70px] transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : isEnabled
                      ? "text-foreground hover:bg-secondary hover:text-secondary-foreground"
                      : "text-muted-foreground opacity-50"
                }`}
              >
                <Icon className={`h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 ${isActive ? "text-primary-foreground" : ""}`} />
                <span
                  className={`text-[10px] sm:text-xs leading-tight text-center ${isActive ? "text-primary-foreground font-medium" : ""}`}
                >
                  {section.label}
                </span>
                {!isEnabled && section.id !== "shift" && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-0.5 -right-0.5 text-[8px] sm:text-xs px-0.5 sm:px-1 py-0 h-4 sm:h-5 bg-muted text-muted-foreground border-border"
                  >
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
