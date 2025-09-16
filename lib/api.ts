interface ApiResponse {
  success: boolean
  data?: any
  error?: string
}

export async function postJSON(url: string, data: any): Promise<ApiResponse> {
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

    const result = await response.json()
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
  return endpoint.length > 0 && !endpoint.includes("undefined")
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
