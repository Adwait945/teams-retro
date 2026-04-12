"use client"

import { useState } from 'react'
import { X } from 'lucide-react'
import type { User } from '@/types'
import type { CreateActionPayload } from '@/services/actionService'

interface NewActionItemModalProps {
  open: boolean
  sprintId: string
  users: Pick<User, '_id' | 'name'>[]
  onClose: () => void
  onSubmit: (payload: CreateActionPayload) => Promise<void>
}

export default function NewActionItemModal({
  open,
  sprintId,
  users,
  onClose,
  onSubmit,
}: NewActionItemModalProps) {
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [ownerId, setOwnerId]       = useState('')
  const [dueDate, setDueDate]       = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!open) return null

  const submitDisabled = !title.trim() || !ownerId || isSubmitting

  function handleClose() {
    setTitle('')
    setDescription('')
    setOwnerId('')
    setDueDate('')
    setIsSubmitting(false)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        title,
        description,
        ownerId,
        dueDate,
        sourceFeedbackId: '',
        sourceQuote: '',
        sprintId,
      })
      handleClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nam-title"
        data-testid="new-action-modal"
        className="w-full max-w-[520px] mx-4 rounded-xl border border-border/50 bg-background/95 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
          <div>
            <h2 id="nam-title" className="text-lg font-semibold">New Action Item</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Add a new action item for this sprint.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="nam-title-input" className="block text-sm font-medium mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="nam-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Add automated test coverage"
              className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="nam-description" className="block text-sm font-medium mb-1.5">
              Description
            </label>
            <textarea
              id="nam-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What needs to be done and why?"
              rows={3}
              className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none min-h-[72px]"
            />
          </div>

          {/* Owner */}
          <div>
            <label htmlFor="nam-owner" className="block text-sm font-medium mb-1.5">
              Owner <span className="text-red-400">*</span>
            </label>
            <select
              id="nam-owner"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select owner</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="nam-due-date" className="block text-sm font-medium mb-1.5">
              Due Date
            </label>
            <input
              id="nam-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-md border border-border/50 text-sm font-medium hover:bg-secondary/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitDisabled}
              data-testid="new-action-submit-btn"
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating…' : 'Create Action Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
