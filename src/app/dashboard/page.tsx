"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare, ThumbsUp, CheckSquare, Activity } from "lucide-react"
import Shell from "@/components/layout/Shell"
import { getCurrentUser } from "@/services/userService"
import { getActions, getCompletionRate, getOpenCount, getCompletedCount } from "@/services/actionService"
import type { Sprint, ActionItem } from "@/types"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  testId: string
}

function StatCard({ title, value, icon, testId }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm" data-testid={testId}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="p-2 bg-secondary/50 rounded-md">{icon}</div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [sprint, setSprint] = useState<Sprint | null>(null)
  const [actions, setActions] = useState<ActionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/")
      return
    }

    async function load() {
      try {
        const sprintRes = await fetch("/api/sprints")
        const sprintData = await sprintRes.json()

        let activeSprint: Sprint | null = null
        if (Array.isArray(sprintData)) {
          activeSprint = sprintData.find((s: Sprint) => s.status === "open") ?? null
        } else if (sprintData && sprintData.status === "open") {
          activeSprint = sprintData
        }

        const fetchedActions = activeSprint ? await getActions(activeSprint._id) : []

        setSprint(activeSprint)
        setActions(fetchedActions)
      } catch {
        setLoadError(true)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [router])

  const completionRate = getCompletionRate(actions)

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Loading…
        </div>
      </Shell>
    )
  }

  if (loadError) {
    return (
      <Shell>
        <div data-testid="load-error" className="flex items-center justify-center h-full text-red-400 text-sm">
          Something went wrong. Please try again.
        </div>
      </Shell>
    )
  }

  return (
    <Shell sprintName={sprint?.name}>
      <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {sprint && (
          <div>
            <h1 className="text-2xl font-bold">{sprint.name}</h1>
            <p className="text-sm text-muted-foreground">
              {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
            </p>
          </div>
        )}

        {sprint ? (
          <>
            <div className="grid grid-cols-4 gap-4">
              <StatCard
                title="Feedback Count"
                value={0}
                icon={<MessageSquare className="w-4 h-4 text-blue-500" />}
                testId="stat-card-feedback"
              />
              <StatCard
                title="Total Upvotes"
                value={0}
                icon={<ThumbsUp className="w-4 h-4 text-emerald-500" />}
                testId="stat-card-upvotes"
              />
              <StatCard
                title="Action Items"
                value={actions.length}
                icon={<CheckSquare className="w-4 h-4 text-amber-500" />}
                testId="stat-card-actions"
              />
              <StatCard
                title="Completion Rate"
                value={`${completionRate}%`}
                icon={<Activity className="w-4 h-4 text-indigo-500" />}
                testId="stat-card-completion"
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h2 className="text-base font-semibold mb-4">Recent Feedback</h2>
                <p className="text-sm text-muted-foreground">No feedback yet this sprint.</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h2 className="text-base font-semibold mb-4">Activity Feed</h2>
                <p className="text-sm text-muted-foreground">
                  Activity will appear here once your team starts submitting feedback.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div data-testid="dashboard-empty-state" className="rounded-xl p-12 text-center bg-secondary/10 border-dashed border-2 border-border/50">
              <h2 className="text-xl font-bold mb-2">No sprint data yet.</h2>
              <p className="text-muted-foreground mb-6">Set up your first sprint to get started.</p>
              <button
                onClick={() => router.push("/sprint-setup")}
                data-testid="dashboard-setup-btn"
                className="px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
              >
                Set Up Sprint →
              </button>
            </div>
            <div className="rounded-xl p-12 text-center border border-border/50 bg-secondary/5">
              <p className="text-muted-foreground">
                Activity will appear here once your team starts submitting feedback.
              </p>
            </div>
          </>
        )}
      </div>
    </Shell>
  )
}
