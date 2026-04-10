import mongoose from 'mongoose'
import type { User } from '@/types'

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true },
  pod: { type: String, required: true },
  isAdmin: { type: Boolean, required: true, default: false },
  avatar: { type: String },
  totalPoints: { type: Number, default: 0 },
  createdAt: { type: Date, required: true, default: Date.now },
})

export default mongoose.models.User || mongoose.model('User', UserSchema)
