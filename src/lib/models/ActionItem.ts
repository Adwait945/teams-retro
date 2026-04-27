import mongoose from 'mongoose'
import type { ActionItem } from '@/types'

const ActionItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  ownerId: { type: String, required: true },
  status: { type: String, required: true, enum: ['open', 'in-progress', 'completed', 'verified'], default: 'open' },
  sourceFeedbackId: { type: String },
  sourceQuote: { type: String },
  dueDate: { type: Date },
  impactNote: { type: String },
  createdAt: { type: Date, required: true, default: Date.now },
  completedAt: { type: Date },
})

export default mongoose.models.ActionItem || mongoose.model('ActionItem', ActionItemSchema)
