import mongoose, { Schema, Document } from 'mongoose'

export interface IBadge extends Document {
  userId: string
  podId: string
  type: string
  earnedAt: Date
}

const BadgeSchema = new Schema<IBadge>(
  {
    userId:   { type: String, required: true },
    podId:    { type: String, required: true },
    type:     { type: String, required: true },
    earnedAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true, versionKey: false, transform: (_, ret) => { const { _id, ...rest } = ret; return rest } },
  }
)

export default mongoose.models.Badge || mongoose.model<IBadge>('Badge', BadgeSchema)
