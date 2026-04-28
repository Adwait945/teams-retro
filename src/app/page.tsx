"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Hexagon } from "lucide-react"
import { registerUser, getCurrentUser, cacheUser, getAllUsers } from "@/services/userService"

export default function RegistrationPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"signin" | "register">("register")

  // Sign-in state
  const [signinUsername, setSigninUsername] = useState("")
  const [signinLoading, setSigninLoading] = useState(false)
  const [signinError, setSigninError] = useState<string | null>(null)

  // Register state
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [pod, setPod] = useState("")
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (user) router.push("/dashboard")
  }, [router])

  function switchMode(next: "signin" | "register") {
    setMode(next)
    setSigninError(null)
    setRegisterError(null)
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setSigninLoading(true)
    setSigninError(null)
    try {
      const users = await getAllUsers()
      const found = users.find((u) => u.username.toLowerCase() === signinUsername.trim().toLowerCase())
      if (!found) {
        setSigninError("Username not found. Check the spelling or register a new account.")
        return
      }
      cacheUser(found)
      router.push("/dashboard")
    } catch {
      setSigninError("Something went wrong. Please try again.")
    } finally {
      setSigninLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setRegisterLoading(true)
    setRegisterError(null)
    try {
      const user = await registerUser({ name, username, pod })
      cacheUser(user)
      router.push("/dashboard")
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : "Registration failed")
      setRegisterLoading(false)
    }
  }

  const registerDisabled = !name || !username || !pod || registerLoading
  const signinDisabled = !signinUsername.trim() || signinLoading

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

          {/* Mode tabs */}
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mode === "signin"
                  ? "text-foreground border-b-2 border-primary -mb-px"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mode === "register"
                  ? "text-foreground border-b-2 border-primary -mb-px"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Register
            </button>
          </div>

          {/* Sign In form */}
          {mode === "signin" && (
            <form onSubmit={handleSignIn} className="px-6 pb-6 pt-5 space-y-4">
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">
                  Enter your username to pick up where you left off.
                </p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signin-username" className="text-sm font-medium">
                  Username
                </label>
                <input
                  id="signin-username"
                  type="text"
                  placeholder="e.g. jdoe"
                  value={signinUsername}
                  onChange={(e) => { setSigninUsername(e.target.value); setSigninError(null) }}
                  className={`w-full rounded-md border px-3 py-2 text-sm bg-secondary/50 outline-none focus:ring-2 focus:ring-ring transition ${
                    signinError ? "border-destructive focus:ring-destructive" : "border-border"
                  }`}
                />
                {signinError && (
                  <p className="text-[13px] font-medium text-destructive animate-in fade-in">{signinError}</p>
                )}
              </div>
              <div className="pt-1 space-y-3">
                <button
                  type="submit"
                  disabled={signinDisabled}
                  className="w-full h-11 rounded-md bg-primary text-primary-foreground text-base font-bold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signinLoading ? "Signing in..." : "Sign In"}
                </button>
              </div>
            </form>
          )}

          {/* Register form */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="px-6 pb-6 pt-5 space-y-4">
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">
                  New to RetroBoard? Set up your identity to get started.
                </p>
              </div>

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
                  onChange={(e) => { setName(e.target.value); setRegisterError(null) }}
                  className={`w-full rounded-md border px-3 py-2 text-sm bg-secondary/50 outline-none focus:ring-2 focus:ring-ring transition ${
                    registerError ? "border-destructive focus:ring-destructive" : "border-border"
                  }`}
                />
                {registerError && (
                  <p className="text-[13px] font-medium text-destructive animate-in fade-in">{registerError}</p>
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
                  disabled={registerDisabled}
                  className="w-full h-11 rounded-md bg-primary text-primary-foreground text-base font-bold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registerLoading ? "Joining..." : "Join RetroBoard"}
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  Your name and pod are saved to the shared team database. No account required.
                </p>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  )
}
