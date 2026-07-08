import mongoose from 'mongoose'
import type { PointEvent } from '@/types'

const PointEventSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  podId: { type: String, required: true },
  action: {
    type: String,
    required: true,
    enum: [
      'submit_feedback',
      'receive_upvote',
      'remove_upvote',
      'convert_action',
      'complete_action',
      'verify_action',
    ],
  },
  points: { type: Number, required: true },
  relatedId: { type: String },
  createdAt: { type: Date, required: true, default: Date.now },
})

PointEventSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.models.PointEvent || mongoose.model<PointEvent>('PointEvent', PointEventSchema)
