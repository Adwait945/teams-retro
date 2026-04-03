import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { RetroProvider } from "@/store/retro-store"
import { Sidebar } from "@/components/sidebar"

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
    <html lang="en">
      <body className={inter.className}>
        <RetroProvider>
          <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </RetroProvider>
      </body>
    </html>
  )
}
