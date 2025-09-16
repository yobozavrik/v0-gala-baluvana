import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export const metadata: Metadata = {
  title: "Швейна фабрика - Система управління",
  description: "Telegram Web App для управління швейним виробництвом",
  generator: "v0.app",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="uk">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
/* додав базові стилі для адаптивності */
body {
  overflow-x: hidden;
  -webkit-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
}
        `}</style>
      </head>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
