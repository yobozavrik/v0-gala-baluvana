import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const SHIFT_STORAGE_KEYS = {
  operations: "shift_operations",
  qc: "shift_qc",
  warehouse: "shift_warehouse",
  cutting: "shift_cutting",
} as const

export type ShiftStorageKey = (typeof SHIFT_STORAGE_KEYS)[keyof typeof SHIFT_STORAGE_KEYS]
