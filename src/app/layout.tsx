import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { RetroProvider } from "@/store/retro-store"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RetroFlow — Async Team Retrospectives",
  description: "Gamified async retrospectives for agile teams. Replace meetings with action.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <RetroProvider>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </RetroProvider>
      </body>
    </html>
  )
}
