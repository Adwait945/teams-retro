"use client"

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import type { FeedbackCategory } from '@/types'

interface SubmitFeedbackModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: {
    category: FeedbackCategory
    content: string
    suggestion: string
    isAnonymous: boolean
  }) => Promise<void>
}

const RADIO_OPTIONS: { value: FeedbackCategory; label: string; colorClass: string }[] = [
  { value: 'slowed-us-down', label: '🔴 What Slowed Us Down?', colorClass: 'text-red-500 font-medium' },
  { value: 'should-try',     label: '💡 What Should We Try?',  colorClass: 'text-blue-500 font-medium' },
  { value: 'went-well',      label: '✅ What Went Well?',       colorClass: 'text-emerald-500 font-medium' },
]

const TESTID_MAP: Record<FeedbackCategory, string> = {
  'slowed-us-down': 'sfm-category-slowed',
  'should-try':     'sfm-category-try',
  'went-well':      'sfm-category-well',
}

export default function SubmitFeedbackModal({ open, onClose, onSubmit }: SubmitFeedbackModalProps) {
  const [category, setCategory]         = useState<FeedbackCategory>('went-well')
  const [content, setContent]           = useState('')
  const [suggestion, setSuggestion]     = useState('')
  const [isAnonymous, setIsAnonymous]   = useState(false)
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

  if (!open) return null

  const isSlowed = category === 'slowed-us-down'
  const submitDisabled = !content.trim() || (isSlowed && !suggestion.trim()) || isSubmitting

  function handleClose() {
    setCategory('went-well')
    setContent('')
    setSuggestion('')
    setIsAnonymous(false)
    setIsSubmitting(false)
    onClose()
    triggerRef.current?.focus()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({ category, content, suggestion, isAnonymous })
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
        aria-labelledby="sfm-title"
        data-testid="submit-feedback-modal"
        className="w-full max-w-[520px] mx-4 rounded-xl border border-border/50 bg-background/95 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
          <div>
            <h2 id="sfm-title" className="text-lg font-semibold">Submit Feedback</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Share your thoughts on the recent sprint.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            data-testid="modal-close-btn"
            aria-label="Close"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* Category radio group */}
          <div>
            <p className="text-sm font-medium mb-3">Category</p>
            <div role="radiogroup" aria-label="Category" className="space-y-2">
              {RADIO_OPTIONS.map((opt) => {
                const selected = category === opt.value
                const highlight = opt.value === 'slowed-us-down' && selected
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 cursor-pointer rounded-md p-2 transition-colors ${
                      highlight ? 'bg-secondary/30 border border-border/50' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={opt.value}
                      checked={selected}
                      onChange={() => setCategory(opt.value)}
                      data-testid={TESTID_MAP[opt.value]}
                      className="accent-primary"
                    />
                    <span className={opt.colorClass}>{opt.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="sfm-content" className="block text-sm font-medium mb-1.5">
              Content
            </label>
            <textarea
              id="sfm-content"
              data-testid="sfm-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What happened?"
              rows={3}
              className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none min-h-[80px]"
            />
          </div>

          {/* Suggestion — Reframe Rule (slowed-us-down only) */}
          {isSlowed && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="sfm-suggestion" className="text-sm font-medium">
                  Suggested Improvement
                </label>
                <span className="text-[10px] text-red-400 font-medium uppercase tracking-wider bg-red-500/10 px-1.5 py-0.5 rounded">
                  REFRAME RULE: REQUIRED
                </span>
              </div>
              <textarea
                id="sfm-suggestion"
                data-testid="sfm-suggestion"
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="How could we fix or improve this?"
                rows={2}
                className="w-full rounded-lg border border-red-500/40 bg-secondary/50 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500 resize-none min-h-[60px]"
              />
            </div>
          )}

          {/* Anonymous */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              data-testid="sfm-anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="accent-primary"
            />
            <span className="text-sm font-normal text-muted-foreground">Submit anonymously</span>
          </label>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              data-testid="sfm-cancel-btn"
              className="px-4 py-2 rounded-md border border-border/50 text-sm font-medium hover:bg-secondary/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitDisabled}
              data-testid="modal-submit-btn"
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting…' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
