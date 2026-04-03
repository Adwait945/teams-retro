"use client"

import { useRetro } from "@/store/retro-store"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"

export function SprintSelector() {
  const { sprints, selectedSprintId, setSelectedSprintId } = useRetro()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = sprints.find((s) => s.id === selectedSprintId)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
      >
        <span>{selected?.name || "Select Sprint"}</span>
        {selected?.isActive && (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            Active
          </span>
        )}
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-56 rounded-lg border border-border bg-card shadow-lg">
          {sprints.map((sprint) => (
            <button
              key={sprint.id}
              onClick={() => {
                setSelectedSprintId(sprint.id)
                setOpen(false)
              }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-accent transition-colors first:rounded-t-lg last:rounded-b-lg",
                sprint.id === selectedSprintId && "bg-primary/5 text-primary font-medium"
              )}
            >
              <span>{sprint.name}</span>
              {sprint.isActive && (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Active
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
