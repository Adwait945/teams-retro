import mongoose from 'mongoose'
import type { Sprint } from '@/types'

const SprintSchema = new mongoose.Schema({
  name: { type: String, required: true },
  goal: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, required: true, enum: ['open', 'closed'] },
  teamMemberIds: { type: [String], default: [] },
})

export default mongoose.models.Sprint || mongoose.model('Sprint', SprintSchema)
