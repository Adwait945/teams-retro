import mongoose from 'mongoose'
import type { FeedbackItem } from '@/types'

const FeedbackItemSchema = new mongoose.Schema({
  sprintId: { type: String, required: true },
  authorId: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true, enum: ['slowed-us-down', 'should-try', 'went-well'] },
  isAnonymous: { type: Boolean, required: true, default: false },
  suggestion: { type: String },
  upvotedBy: { type: [String], default: [] },
  upvotes: { type: Number, default: 0 },
  createdAt: { type: Date, required: true, default: Date.now },
  actionItemId: { type: String },
})

export default mongoose.models.FeedbackItem || mongoose.model('FeedbackItem', FeedbackItemSchema)
