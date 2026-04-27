"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Hexagon, Settings, LayoutDashboard, MessageSquare, CheckSquare, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import type { User } from "@/types"

interface ShellProps {
  children: React.ReactNode
}

const BASE_NAV = [
  { href: "/dashboard",     label: "Dashboard",       icon: LayoutDashboard },
  { href: "/feedback",      label: "Feedback Board",  icon: MessageSquare },
  { href: "/action-items",  label: "Action Items",    icon: CheckSquare },
]
const POD_SETTINGS_NAV = { href: "/pod-settings", label: "Pod Settings", icon: Settings }

export default function Shell({ children }: ShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("retroboard_user")
      if (raw) setCurrentUser(JSON.parse(raw) as User)
    } catch {
      // ignore parse errors
    }
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background" data-testid="shell">
      <aside className="w-[240px] flex-shrink-0 flex flex-col h-screen border-r border-border">

        {/* Header */}
        <div className="p-6 flex items-center gap-3 font-semibold text-lg tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
            <Hexagon className="w-5 h-5 fill-primary" />
          </div>
          RetroBoard
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1">
          {(currentUser?.isAdmin ? [...BASE_NAV, POD_SETTINGS_NAV] : BASE_NAV).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative",
                  isActive
                    ? "bg-secondary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                  )}
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* User identity card + Logout */}
        {currentUser && (
          <div className="p-4 mt-auto border-t border-border space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium">
                {currentUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">{currentUser.pod}</p>
              </div>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem("retroboard_user")
                router.push("/")
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log out
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
