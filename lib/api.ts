export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function postJSON<TRequest extends object, TResponse = unknown>(
  url: string,
  data: TRequest,
): Promise<ApiResponse<TResponse>> {
  try {
    // Check if we have the required environment variables
    if (!url || url.includes("undefined")) {
      return {
        success: false,
        error: "API endpoint not configured. Please add environment variables in Project Settings.",
      }
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = (await response.json()) as TResponse
    return { success: true, data: result }
  } catch (error) {
    console.error("API request failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export function isEndpointConfigured(endpoint: string): boolean {
  return Boolean(endpoint) && endpoint.length > 0 && !endpoint.includes("undefined")
}

export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === "development"
}

// API endpoints with fallback for missing env vars
export const API_ENDPOINTS = {
  shift: process.env.NEXT_PUBLIC_VITE_N8N_SHIFT || "",
  operations: process.env.NEXT_PUBLIC_VITE_N8N_OPS || "",
  qc: process.env.NEXT_PUBLIC_VITE_N8N_QC || "",
  warehouse: process.env.NEXT_PUBLIC_VITE_N8N_WH || "",
}
