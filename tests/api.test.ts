import { afterEach, describe, expect, it, vi } from "vitest"
import { isEndpointConfigured, postJSON } from "../lib/api"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("postJSON", () => {
  it("returns an error when the endpoint is not configured", async () => {
    const result = await postJSON("https://api.undefined.example.com", { foo: "bar" })

    expect(result).toEqual({
      success: false,
      error: "API endpoint not configured. Please add environment variables in Project Settings.",
    })
  })

  it("sends data to the API and returns the parsed response", async () => {
    const payload = { foo: "bar" }
    const responseData = { status: "ok" }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(responseData),
    })

    vi.stubGlobal("fetch", fetchMock)

    const result = await postJSON("https://api.example.com/submit", payload)

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    expect(result).toEqual({ success: true, data: responseData })
  })

  it("captures network failures and returns the error message", async () => {
    const error = new Error("Network error")
    const fetchMock = vi.fn().mockRejectedValue(error)
    vi.stubGlobal("fetch", fetchMock)
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await postJSON("https://api.example.com/submit", { foo: "bar" })

    expect(result).toEqual({ success: false, error: "Network error" })
    expect(consoleSpy).toHaveBeenCalledWith("API request failed:", error)
  })
})

describe("isEndpointConfigured", () => {
  it("returns true for configured endpoints", () => {
    expect(isEndpointConfigured("https://api.example.com")).toBe(true)
  })

  it("returns false for undefined or empty endpoints", () => {
    expect(isEndpointConfigured("")).toBeFalsy()
    expect(isEndpointConfigured("https://api.undefined.example.com")).toBe(false)
  })
})
