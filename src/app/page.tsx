"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Hexagon } from "lucide-react"
import { registerUser, getCurrentUser, cacheUser } from "@/services/userService"

export default function RegistrationPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [pod, setPod] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (user) router.push("/dashboard")
  }, [router])

  const isDisabled = !name || !username || !pod || isLoading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const user = await registerUser({ name, username, pod })
      cacheUser(user)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[480px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <Hexagon className="w-7 h-7 text-primary fill-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">RetroBoard</h1>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="text-center px-6 pt-6 pb-2">
            <h2 className="text-xl font-semibold">Welcome to RetroBoard</h2>
            <p className="text-sm text-muted-foreground mt-1">Set up your identity to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="e.g. Jane Doe"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null) }}
                className={`w-full rounded-md border px-3 py-2 text-sm bg-secondary/50 outline-none focus:ring-2 focus:ring-ring transition ${
                  error ? "border-destructive focus:ring-destructive" : "border-border"
                }`}
              />
              {error && (
                <p className="text-[13px] font-medium text-destructive animate-in fade-in">{error}</p>
              )}
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="e.g. jdoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm bg-secondary/50 outline-none focus:ring-2 focus:ring-ring transition"
              />
            </div>

            {/* Pod */}
            <div className="space-y-1.5">
              <label htmlFor="pod" className="text-sm font-medium">
                Pod
              </label>
              <select
                id="pod"
                value={pod}
                onChange={(e) => setPod(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm bg-secondary/50 outline-none focus:ring-2 focus:ring-ring transition"
              >
                <option value="" disabled>Select a pod</option>
                <option value="pod1">Pod 1</option>
                <option value="pod2">Pod 2</option>
                <option value="pod3">Pod 3</option>
              </select>
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isDisabled}
                className="w-full h-11 rounded-md bg-primary text-primary-foreground text-base font-bold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Joining..." : "Join RetroBoard"}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                Your name and pod are saved to the shared team database. No account required.
              </p>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
