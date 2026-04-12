"use client"

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import type { ActionItem } from '@/types'

interface VerifyImpactModalProps {
  open: boolean
  item: ActionItem | null
  onClose: () => void
  onSubmit: (itemId: string, impactNote: string) => Promise<void>
}

export default function VerifyImpactModal({
  open,
  item,
  onClose,
  onSubmit,
}: VerifyImpactModalProps) {
  const [impactNote, setImpactNote]   = useState('')
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

  if (!open || !item) return null

  const submitDisabled = !impactNote.trim() || impactNote.length > 300 || isSubmitting

  function handleClose() {
    setImpactNote('')
    setIsSubmitting(false)
    onClose()
    triggerRef.current?.focus()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit(item!._id, impactNote)
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
        aria-labelledby="vim-title"
        data-testid="verify-impact-modal"
        className="w-full max-w-[520px] mx-4 rounded-xl border border-border/50 bg-background/95 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
          <div>
            <h2 id="vim-title" className="text-lg font-semibold">Verify Impact</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Describe how this action item made a real difference for the team.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            data-testid="vim-close-btn"
            aria-label="Close"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Action item title */}
          <p className="text-sm font-medium text-slate-200">{item.title}</p>

          {/* Source quote — only when sourceQuote is non-empty */}
          {item.sourceQuote !== '' && (
            <blockquote className="border-l-4 border-amber-500 pl-3 py-1">
              <p className="text-xs text-slate-400 italic">{item.sourceQuote}</p>
            </blockquote>
          )}

          {/* Impact statement */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="vim-impact" className="block text-sm font-medium">
                Impact Statement <span className="text-red-400">*</span>
              </label>
              <span className="text-xs text-muted-foreground">{impactNote.length} / 300</span>
            </div>
            <textarea
              id="vim-impact"
              data-testid="vim-impact"
              value={impactNote}
              onChange={(e) => setImpactNote(e.target.value)}
              placeholder="e.g. Deployments now take 5 minutes instead of 45…"
              maxLength={300}
              rows={4}
              className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none min-h-[96px]"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              data-testid="vim-cancel-btn"
              className="px-4 py-2 rounded-md border border-border/50 text-sm font-medium hover:bg-secondary/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitDisabled}
              data-testid="verify-impact-submit-btn"
              className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Confirming…' : 'Confirm Verified'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
