"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  MessageSquarePlus,
  Trophy,
  ListChecks,
  FileText,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRetro } from "@/store/retro-store"

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/feedback", label: "Feedback Board", icon: MessageSquarePlus },
  { href: "/action-items", label: "Action Items", icon: ListChecks },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/digest", label: "Sprint Digest", icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()
  const { currentUser, activeSprint } = useRetro()

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Zap className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight">RetroFlow</h1>
          <p className="text-[11px] text-muted-foreground">Async Retrospectives</p>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Active Sprint</p>
          <p className="text-sm font-semibold text-foreground">{activeSprint.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {new Date(activeSprint.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {" — "}
            {new Date(activeSprint.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
            {currentUser.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser.name}</p>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Zap className="h-3 w-3 text-amber-500" />
              <span className="font-semibold text-amber-600">{currentUser.totalPoints}</span>
              <span>points</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
