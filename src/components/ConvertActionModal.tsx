"use client"

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { FeedbackItem, User } from '@/types'
import type { CreateActionPayload } from '@/services/actionService'

interface ConvertActionModalProps {
  open: boolean
  feedbackItem: FeedbackItem | null
  sprintId: string
  users: Pick<User, '_id' | 'name'>[]
  onClose: () => void
  onSubmit: (payload: CreateActionPayload) => Promise<void>
}

export default function ConvertActionModal({
  open,
  feedbackItem,
  sprintId,
  users,
  onClose,
  onSubmit,
}: ConvertActionModalProps) {
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [ownerId, setOwnerId]         = useState('')
  const [dueDate, setDueDate]         = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const modal = modalRef.current
    if (!modal) return
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    modal.addEventListener('keydown', handleKeyDown)
    first?.focus()
    return () => modal.removeEventListener('keydown', handleKeyDown)
  }, [open])

  useEffect(() => {
    if (feedbackItem) {
      setTitle(feedbackItem.content)
    }
  }, [feedbackItem])

  if (!open || !feedbackItem) return null

  const submitDisabled = !title.trim() || !ownerId || isSubmitting

  function handleClose() {
    setTitle('')
    setDescription('')
    setOwnerId('')
    setDueDate('')
    setIsSubmitting(false)
    onClose()
    triggerRef.current?.focus()
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
        sourceFeedbackId: feedbackItem!._id,
        sourceQuote: feedbackItem!.content,
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
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cam-title"
        data-testid="convert-action-modal"
        className="w-full max-w-[540px] mx-4 rounded-xl border border-border/50 bg-background/95 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
          <div>
            <h2 id="cam-title" className="text-lg font-semibold">Convert to Action Item</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create an action item from this high-voted feedback.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            data-testid="cam-close-btn"
            aria-label="Close"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Source quote */}
          <blockquote className="border-l-4 border-blue-500 pl-3 py-1">
            <p className="text-sm text-slate-300 italic">{feedbackItem.content}</p>
          </blockquote>

          {/* Title */}
          <div>
            <label htmlFor="cam-title-input" className="block text-sm font-medium mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="cam-title-input"
              data-testid="cam-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Add automated test coverage"
              className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="cam-description" className="block text-sm font-medium mb-1.5">
              Description
            </label>
            <textarea
              id="cam-description"
              data-testid="cam-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details on how to implement this..."
              rows={3}
              className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none min-h-[72px]"
            />
          </div>

          {/* Assigned To */}
          <div>
            <label htmlFor="cam-owner" className="block text-sm font-medium mb-1.5">
              Assigned To <span className="text-red-400">*</span>
            </label>
            <select
              id="cam-owner"
              data-testid="cam-owner"
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
            <label htmlFor="cam-due-date" className="block text-sm font-medium mb-1.5">
              Due Date
            </label>
            <input
              id="cam-due-date"
              data-testid="cam-due-date"
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
              data-testid="cam-cancel-btn"
              className="px-4 py-2 rounded-md border border-border/50 text-sm font-medium hover:bg-secondary/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitDisabled}
              data-testid="convert-action-submit-btn"
              className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating…' : 'Create Action Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
