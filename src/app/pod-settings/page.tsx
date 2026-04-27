"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import { getCurrentUser } from '@/services/userService'
import type { FeedbackItem, User } from '@/types'

export default function PodSettingsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [podUsers, setPodUsers] = useState<User[]>([])
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) { router.push('/'); return }
    if (!user.isAdmin) { router.push('/dashboard'); return }
    setCurrentUser(user)

    async function load() {
      try {
        const [usersRes, feedbackRes] = await Promise.all([
          fetch(`/api/users?pod=${encodeURIComponent(user!.pod)}`),
          fetch('/api/feedback?window=all'),
        ])
        const users = await usersRes.json()
        const feedback = await feedbackRes.json()
        setPodUsers(Array.isArray(users) ? users : [])
        setFeedbackItems(Array.isArray(feedback) ? feedback : [])
      } catch {
        // silent
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [router])

  async function handleDelete(feedbackId: string) {
    if (!currentUser) return
    setDeleteError(null)
    const res = await fetch(`/api/feedback/${feedbackId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser._id }),
    })
    if (res.ok) {
      setFeedbackItems(prev => prev.filter(f => f._id !== feedbackId))
      setDeleteConfirmId(null)
    } else {
      setDeleteError('Failed to delete feedback item.')
    }
  }

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Loading...
        </div>
      </Shell>
    )
  }

  if (!currentUser) return null

  return (
    <Shell>
      <div data-testid="pod-settings-page" className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-2xl font-bold">{currentUser.pod}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Pod Settings — manage members and moderate feedback.</p>
        </div>

        {/* User List */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-4">Pod Members</h2>
          <div data-testid="user-list" className="space-y-2">
            {podUsers.map((u) => (
              <div key={u._id} data-testid="user-row" className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium">
                    {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">@{u.username} · {u.pod}</p>
                  </div>
                </div>
                {u.isAdmin && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Admin</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Moderation */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-4">Feedback Moderation</h2>
          {deleteError && (
            <div className="mb-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
              {deleteError}
            </div>
          )}
          <div data-testid="feedback-moderation-list" className="space-y-2">
            {feedbackItems.map((f) => (
              <div key={f._id} data-testid="feedback-mod-row" className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/30">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm truncate">{f.content}</p>
                  <p className="text-xs text-muted-foreground">{f.category} · {f.isAnonymous ? 'Anonymous' : f.authorId}</p>
                </div>
                <div className="flex items-center gap-2">
                  {deleteConfirmId === f._id ? (
                    <div data-testid="delete-confirm-prompt" className="flex items-center gap-2 text-xs">
                      <span className="text-amber-400">This cannot be undone</span>
                      <button
                        data-testid="delete-confirm-btn"
                        onClick={() => handleDelete(f._id)}
                        className="px-2 py-1 rounded bg-red-500 text-white text-xs font-medium"
                      >
                        Delete
                      </button>
                      <button
                        data-testid="delete-cancel-btn"
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 rounded bg-secondary text-xs font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      data-testid="delete-feedback-btn"
                      onClick={() => setDeleteConfirmId(f._id)}
                      className="text-xs font-medium px-2.5 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
            {feedbackItems.length === 0 && (
              <p className="text-sm text-muted-foreground">No feedback items to moderate.</p>
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}
