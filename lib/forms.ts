import type { FieldError, FieldErrors, FieldValues } from "react-hook-form"

function isFieldError(value: unknown): value is FieldError {
  return typeof value === "object" && value !== null && "message" in value
}

export function getFirstErrorMessage<TFieldValues extends FieldValues>(
  errors: FieldErrors<TFieldValues>,
): string | null {
  for (const value of Object.values(errors)) {
    if (!value) {
      continue
    }

    if (isFieldError(value)) {
      if (value.message) {
        return String(value.message)
      }
      continue
    }

    if (typeof value === "object") {
      const nestedMessage = getFirstErrorMessage(value as FieldErrors<FieldValues>)
      if (nestedMessage) {
        return nestedMessage
      }
    }
  }

  return null
}
