import mongoose from 'mongoose'
import type { Badge } from '@/types'

const BadgeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  podId: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: [
      'feedback_machine',
      'action_taker',
      'innovator',
      'problem_solver',
      'consensus_builder',
      'pod_champion',
    ],
  },
  earnedAt: { type: Date, required: true, default: Date.now },
})

BadgeSchema.index(
  { userId: 1, type: 1, podId: 1 },
  { unique: true, partialFilterExpression: { type: { $ne: 'pod_champion' } } }
)

BadgeSchema.index(
  { type: 1, podId: 1 },
  { unique: true, partialFilterExpression: { type: 'pod_champion' } }
)

export default mongoose.models.Badge || mongoose.model<Badge>('Badge', BadgeSchema)
